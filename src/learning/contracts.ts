import { z } from 'zod';

const shortQuestionSchema = z
  .string()
  .trim()
  .min(5)
  .max(140)
  .refine((question) => question.split(/\s+/u).length <= 16, {
    message: 'Question must contain at most 16 words.',
  })
  .refine(
    (question) =>
      !question.includes('\n') &&
      question.endsWith('?') &&
      question.match(/\?/gu)?.length === 1,
    { message: 'Question must be one sentence with one question mark.' },
  );

const diagnosticQuestionSchema = z
  .object({
    question: shortQuestionSchema,
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
    nextQuestion: shortQuestionSchema,
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
