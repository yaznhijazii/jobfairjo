import type { Job, MatchResult } from "@shared/schema";
import { generateEmbedding, cosineSimilarity, calculateSimilarityScore } from "./openai";

// Cache for job embeddings to avoid regenerating on every request
const jobEmbeddingsCache = new Map<string, number[]>();

function getJobCacheKey(job: Job): string {
  return `${job.title}:${job.department}:${job.location}`;
}

/**
 * Two-stage AI matching process with embedding caching:
 * Stage 1: Quick semantic filtering using embeddings (filter to top 10)
 * Stage 2: Deep AI analysis using OpenAI on top candidates (get final top 3)
 */
export async function matchJobsToCV(cvText: string, jobs: Job[]): Promise<MatchResult[]> {
  if (jobs.length === 0) {
    return [];
  }

  const startTime = Date.now();

  // Stage 1: Quick Semantic Filtering using embeddings
  const cvEmbedding = await generateEmbedding(cvText);
  
  // Generate or retrieve cached embeddings for all jobs
  const jobScores = await Promise.all(
    jobs.map(async (job) => {
      const cacheKey = getJobCacheKey(job);
      const jobText = `${job.title} ${job.department} ${job.location}`;
      
      // Try to get from cache, otherwise generate and cache
      let jobEmbedding = jobEmbeddingsCache.get(cacheKey);
      if (!jobEmbedding) {
        jobEmbedding = await generateEmbedding(jobText);
        jobEmbeddingsCache.set(cacheKey, jobEmbedding);
      }
      
      const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);
      
      return { job, similarity };
    })
  );

  // Sort by similarity and take top 10 candidates
  const topCandidates = jobScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  // Stage 2: Deep AI Analysis on top candidates
  const deepAnalysisResults = await Promise.all(
    topCandidates.map(async ({ job, similarity }) => {
      // Use OpenAI for deep analysis on full job description
      const deepScore = await calculateSimilarityScore(cvText, job.description);
      
      // Weighted combination: 70% deep AI analysis, 30% embedding similarity
      const finalScore = (deepScore * 0.7) + (similarity * 0.3);
      
      return { job, score: finalScore };
    })
  );

  // Sort by final score and take top 3
  const topMatches = deepAnalysisResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match, index) => ({
      job: match.job,
      score: match.score,
      rank: index + 1
    }));

  const duration = Date.now() - startTime;
  console.log(`Matching complete in ${duration}ms`);

  return topMatches;
}

// Optional: Clear cache periodically to avoid unbounded growth
export function clearEmbeddingsCache() {
  jobEmbeddingsCache.clear();
}
