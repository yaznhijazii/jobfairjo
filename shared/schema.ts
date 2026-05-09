import { z } from "zod";

// Job listing from JoAcademy API
export const jobSchema = z.object({
  title: z.string(),
  department: z.string(),
  location: z.string(),
  description: z.string(),
  link: z.string().url(),
});

export type Job = z.infer<typeof jobSchema>;

// Match result with confidence score
export const matchResultSchema = z.object({
  job: jobSchema,
  score: z.number().min(0).max(1),
  rank: z.number().int().positive(),
  rationale: z.string(), // AI's explanation for the score
});

export type MatchResult = z.infer<typeof matchResultSchema>;

// CV upload request/response
export const cvUploadResponseSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

export type CVUploadResponse = z.infer<typeof cvUploadResponseSchema>;

// Match request/response
export const matchRequestSchema = z.object({
  cvText: z.string().min(1),
});

export type MatchRequest = z.infer<typeof matchRequestSchema>;

export const matchResponseSchema = z.object({
  matches: z.array(matchResultSchema),
  totalJobs: z.number().int(),
  processingTime: z.number().optional(),
});

export type MatchResponse = z.infer<typeof matchResponseSchema>;

// Processing status
export type ProcessingStep = 'idle' | 'uploading' | 'extracting' | 'fetching' | 'analyzing' | 'complete' | 'error';

export interface ProcessingStatus {
  step: ProcessingStep;
  message: string;
  progress: number; // 0-100
}
