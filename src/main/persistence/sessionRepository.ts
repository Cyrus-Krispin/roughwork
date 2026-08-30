import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

import type {
  DiagnosticQuestion,
  EvaluationResult,
} from '../../learning/contracts.ts';
import type {
  LearningSessionSummary,
  PersistedLearningSession,
  PersistedSessionStatus,
  PersistedTurn,
} from '../../learning/history.ts';

type RepositoryOptions = {
  createId?: () => string;
  now?: () => string;
};

type SessionRow = {
  id: string;
  topic: string;
  status: PersistedSessionStatus;
  started_at: string;
  updated_at: string;
  ended_at: string | null;
  current_question_id: string;
};

type TurnRow = {
  question_id: string;
  turn_number: number;
  prompt: string;
  intent: string;
  answer: string | null;
  evaluation_id: string | null;
  status: EvaluationResult['status'] | null;
  uncertainty: EvaluationResult['uncertainty'] | null;
  proposed_next_move: EvaluationResult['proposedNextMove'] | null;
  unresolved_gap: string | null;
  next_question: string | null;
  next_question_rationale: string | null;
};

export type RecordEvaluationInput = {
  sessionId: string;
  questionId: string;
  answer: string;
  evaluation: EvaluationResult;
};

export class LearningSessionRepository {
  private readonly database: DatabaseSync;
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(database: DatabaseSync, options: RepositoryOptions = {}) {
    this.database = database;
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  createSession(
    topicValue: string,
    diagnosticQuestion: DiagnosticQuestion,
  ): PersistedLearningSession {
    const topic = topicValue.trim();
    const sessionId = this.createId();
    const questionId = this.createId();
    const timestamp = this.now();

    this.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO learning_sessions
             (id, topic, status, current_question_id, started_at, updated_at, ended_at)
           VALUES (?, ?, 'active', NULL, ?, ?, NULL)`,
        )
        .run(sessionId, topic, timestamp, timestamp);
      this.database
        .prepare(
          `INSERT INTO questions
             (id, session_id, turn_number, prompt, intent, parent_evaluation_id, created_at)
           VALUES (?, ?, 1, ?, ?, NULL, ?)`,
        )
        .run(
          questionId,
          sessionId,
          diagnosticQuestion.question,
          diagnosticQuestion.intent,
          timestamp,
        );
      this.database
        .prepare(
          'UPDATE learning_sessions SET current_question_id = ? WHERE id = ?',
        )
        .run(questionId, sessionId);
    });

    return this.requireSession(sessionId);
  }

  recordEvaluation(input: RecordEvaluationInput): PersistedLearningSession {
    const existing = this.database
      .prepare('SELECT answer FROM attempts WHERE question_id = ?')
      .get(input.questionId) as { answer: string } | undefined;
    if (existing) {
      if (existing.answer !== input.answer) {
        throw new Error(
          'This question already has a different acknowledged answer.',
        );
      }
      return this.requireSession(input.sessionId);
    }

    const session = this.getSessionRow(input.sessionId);
    if (!session) throw new Error('Learning session not found.');
    if (session.status !== 'active')
      throw new Error('Learning session is not active.');
    if (session.current_question_id !== input.questionId) {
      throw new Error('The question is not current for this learning session.');
    }

    const currentTurn = this.database
      .prepare(
        'SELECT turn_number FROM questions WHERE id = ? AND session_id = ?',
      )
      .get(input.questionId, input.sessionId) as
      { turn_number: number } | undefined;
    if (!currentTurn)
      throw new Error('Question not found in this learning session.');

    const attemptId = this.createId();
    const evaluationId = this.createId();
    const nextQuestionId = this.createId();
    const timestamp = this.now();

    this.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO attempts (id, session_id, question_id, answer, submitted_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          attemptId,
          input.sessionId,
          input.questionId,
          input.answer,
          timestamp,
        );
      this.database
        .prepare(
          `INSERT INTO evaluations
             (id, attempt_id, revision, status, uncertainty, proposed_next_move,
              unresolved_gap, next_question, next_question_rationale, created_at)
           VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          evaluationId,
          attemptId,
          input.evaluation.status,
          input.evaluation.uncertainty,
          input.evaluation.proposedNextMove,
          input.evaluation.unresolvedGap,
          input.evaluation.nextQuestion,
          input.evaluation.nextQuestionRationale,
          timestamp,
        );
      const evidenceStatement = this.database.prepare(
        `INSERT INTO evaluation_evidence (evaluation_id, ordinal, excerpt, finding)
         VALUES (?, ?, ?, ?)`,
      );
      input.evaluation.evidence.forEach((evidence, ordinal) => {
        evidenceStatement.run(
          evaluationId,
          ordinal,
          evidence.excerpt,
          evidence.finding,
        );
      });
      this.database
        .prepare(
          `INSERT INTO questions
             (id, session_id, turn_number, prompt, intent, parent_evaluation_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          nextQuestionId,
          input.sessionId,
          currentTurn.turn_number + 1,
          input.evaluation.nextQuestion,
          input.evaluation.nextQuestionRationale,
          evaluationId,
          timestamp,
        );
      this.database
        .prepare(
          `UPDATE learning_sessions
           SET current_question_id = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(nextQuestionId, timestamp, input.sessionId);
    });

    return this.requireSession(input.sessionId);
  }

  endSession(sessionId: string): PersistedLearningSession {
    const session = this.requireSession(sessionId);
    if (session.status === 'ended') return session;
    const timestamp = this.now();
    this.database
      .prepare(
        `UPDATE learning_sessions
         SET status = 'ended', updated_at = ?, ended_at = ?
         WHERE id = ?`,
      )
      .run(timestamp, timestamp, sessionId);
    return this.requireSession(sessionId);
  }

  getSession(sessionId: string): PersistedLearningSession | null {
    const session = this.getSessionRow(sessionId);
    if (!session) return null;

    const rows = this.database
      .prepare(
        `SELECT q.id AS question_id, q.turn_number, q.prompt, q.intent,
                a.answer, e.id AS evaluation_id, e.status, e.uncertainty,
                e.proposed_next_move, e.unresolved_gap, e.next_question,
                e.next_question_rationale
         FROM questions q
         LEFT JOIN attempts a ON a.question_id = q.id
         LEFT JOIN evaluations e ON e.attempt_id = a.id AND e.revision = 1
         WHERE q.session_id = ?
         ORDER BY q.turn_number ASC`,
      )
      .all(sessionId) as TurnRow[];

    return {
      id: session.id,
      topic: session.topic,
      status: session.status,
      startedAt: session.started_at,
      updatedAt: session.updated_at,
      endedAt: session.ended_at,
      currentQuestionId: session.current_question_id,
      turns: rows.map((row) => this.toTurn(row)),
    };
  }

  listSessions(limit: number): LearningSessionSummary[] {
    const rows = this.database
      .prepare(
        `SELECT id, topic, status, started_at, updated_at, ended_at,
                current_question_id
         FROM learning_sessions
         ORDER BY updated_at DESC, started_at DESC
         LIMIT ?`,
      )
      .all(limit) as SessionRow[];

    return rows.map((row) => {
      const session = this.getSession(row.id);
      if (!session)
        throw new Error('Learning session disappeared while listing.');
      const evaluations = session.turns.flatMap((turn) =>
        turn.evaluation ? [turn.evaluation] : [],
      );
      return {
        id: session.id,
        topic: session.topic,
        status: session.status,
        startedAt: session.startedAt,
        updatedAt: session.updatedAt,
        endedAt: session.endedAt,
        answeredTurns: session.turns.filter((turn) => turn.answer !== null)
          .length,
        totalQuestions: session.turns.length,
        evaluationCounts: {
          demonstrated: evaluations.filter(
            (item) => item.status === 'demonstrated',
          ).length,
          partial: evaluations.filter((item) => item.status === 'partial')
            .length,
          misconception: evaluations.filter(
            (item) => item.status === 'misconception',
          ).length,
          uncertain: evaluations.filter((item) => item.status === 'uncertain')
            .length,
        },
      };
    });
  }

  deleteSession(sessionId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM learning_sessions WHERE id = ?')
      .run(sessionId);
    return result.changes === 1;
  }

  private getSessionRow(sessionId: string): SessionRow | null {
    return (
      (this.database
        .prepare(
          `SELECT id, topic, status, started_at, updated_at, ended_at,
                  current_question_id
           FROM learning_sessions WHERE id = ?`,
        )
        .get(sessionId) as SessionRow | undefined) ?? null
    );
  }

  private requireSession(sessionId: string): PersistedLearningSession {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Learning session not found.');
    return session;
  }

  private toTurn(row: TurnRow): PersistedTurn {
    let evaluation: EvaluationResult | null = null;
    if (row.evaluation_id) {
      const evidenceRows = this.database
        .prepare(
          `SELECT excerpt, finding FROM evaluation_evidence
           WHERE evaluation_id = ? ORDER BY ordinal ASC`,
        )
        .all(row.evaluation_id) as EvaluationResult['evidence'];
      const evidence = evidenceRows.map((item) => ({
        excerpt: item.excerpt,
        finding: item.finding,
      }));
      evaluation = {
        status: row.status!,
        evidence,
        unresolvedGap: row.unresolved_gap!,
        uncertainty: row.uncertainty!,
        proposedNextMove: row.proposed_next_move!,
        nextQuestion: row.next_question!,
        nextQuestionRationale: row.next_question_rationale!,
      };
    }
    return {
      questionId: row.question_id,
      turn: row.turn_number,
      question: row.prompt,
      intent: row.intent,
      answer: row.answer,
      evaluation,
    };
  }

  private transaction(work: () => void): void {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      work();
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}
