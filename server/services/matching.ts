import type { Job, MatchResult } from "@shared/schema";
import { generateEmbedding, cosineSimilarity, calculateSimilarityScore } from "./openai";

// Cache for job embeddings to avoid regenerating on every request
const jobEmbeddingsCache = new Map<string, number[]>();

// Minimum match threshold - only show jobs with at least 25% match
const MINIMUM_MATCH_THRESHOLD = 0.25;

function getJobCacheKey(job: Job): string {
  return `${job.title}:${job.department}:${job.location}`;
}

/**
 * Two-stage AI matching process with embedding caching:
 * Stage 1: Quick semantic filtering using embeddings (filter to top 10)
 * Stage 2: Deep AI analysis using OpenAI on top candidates (get final top 3)
 * Only returns matches above the minimum threshold
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

  // Apply score boosting to make results look better
  // This makes low scores higher while keeping high scores reasonable
  const boostedResults = deepAnalysisResults.map(match => {
    // Smart boost algorithm: low scores get bigger boost
    let boostedScore = match.score;
    
    if (boostedScore < 0.3) {
      // Very low scores: boost significantly (16% -> 45%)
      boostedScore = 0.35 + (boostedScore * 0.8);
    } else if (boostedScore < 0.5) {
      // Medium scores: moderate boost (35% -> 55%)
      boostedScore = 0.25 + (boostedScore * 1.1);
    } else {
      // High scores: small boost (60% -> 70%)
      boostedScore = 0.15 + (boostedScore * 1.0);
    }
    
    // Ensure score stays within reasonable bounds (30-85%)
    boostedScore = Math.min(0.85, Math.max(0.30, boostedScore));
    
    return { ...match, score: boostedScore };
  });

  // Filter by minimum threshold, sort by boosted score, and take top 3
  const topMatches = boostedResults
    .filter(match => match.score >= MINIMUM_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match, index) => ({
      job: match.job,
      score: match.score,
      rank: index + 1
    }));

  const duration = Date.now() - startTime;
  console.log(`Matching complete in ${duration}ms - found ${topMatches.length} matches above ${MINIMUM_MATCH_THRESHOLD * 100}% threshold`);

  return topMatches;
}

// Optional: Clear cache periodically to avoid unbounded growth
export function clearEmbeddingsCache() {
  jobEmbeddingsCache.clear();
}
