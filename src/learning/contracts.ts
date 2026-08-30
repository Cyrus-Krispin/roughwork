import { z } from 'zod';

const diagnosticQuestionSchema = z
  .object({
    question: z.string().trim().min(10).max(280),
    intent: z.string().trim().min(10).max(240),
  })
  .strict();

const evaluationSchema = z
  .object({
    status: z.enum(['demonstrated', 'partial', 'misconception', 'uncertain']),
    evidence: z
      .array(
        z
          .object({
            excerpt: z.string().min(1).max(320),
            finding: z.string().trim().min(5).max(280),
          })
          .strict(),
      )
      .min(1)
      .max(3),
    unresolvedGap: z.string().trim().min(5).max(320),
    uncertainty: z.enum(['low', 'medium', 'high']),
    proposedNextMove: z.enum(['probe', 'advance', 'prerequisite', 'hint']),
    nextQuestion: z.string().trim().min(10).max(320),
    nextQuestionRationale: z.string().trim().min(5).max(280),
  })
  .strict();

export type DiagnosticQuestion = z.infer<typeof diagnosticQuestionSchema>;
export type EvaluationResult = z.infer<typeof evaluationSchema>;

function parseJsonResponse(content: string): unknown {
  if (!content.trim()) {
    throw new Error('DeepSeek returned an empty response.');
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error('DeepSeek returned invalid JSON.');
  }
}

export function parseDiagnosticQuestion(content: string): DiagnosticQuestion {
  return diagnosticQuestionSchema.parse(parseJsonResponse(content));
}

export function parseEvaluation(
  content: string,
  learnerAnswer: string,
): EvaluationResult {
  const evaluation = evaluationSchema.parse(parseJsonResponse(content));

  for (const evidence of evaluation.evidence) {
    if (!learnerAnswer.includes(evidence.excerpt)) {
      throw new Error('Evidence must quote the learner answer exactly.');
    }
  }

  return evaluation;
}
