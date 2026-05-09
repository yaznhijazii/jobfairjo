import type { Job, MatchResult } from "../../shared/schema.js";
import { generateEmbedding, cosineSimilarity, calculateSimilarityScore } from "./openai.js";

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
  
  // Generate or retrieve cached embeddings for jobs
  // We use a simple loop or chunking to avoid 100+ concurrent network requests
  console.log(`[Matching] Generating embeddings for ${jobs.length} jobs...`);
  const jobScores = [];
  const batchSize = 10;
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (job) => {
        const cacheKey = getJobCacheKey(job);
        const jobText = `${job.title} ${job.department} ${job.location}`;
        
        let jobEmbedding = jobEmbeddingsCache.get(cacheKey);
        if (!jobEmbedding) {
          // Include a slice of the description for better semantic filtering
          const jobText = `${job.title} ${job.department} ${job.location} ${job.description.slice(0, 300)}`;
          jobEmbedding = await generateEmbedding(jobText);
          jobEmbeddingsCache.set(cacheKey, jobEmbedding);
        }
        
        const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);
        return { job, similarity };
      })
    );
    jobScores.push(...batchResults);
  }

  // Sort by similarity and take top 10 candidates
  const topCandidates = jobScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  // Stage 2: Deep AI Analysis on top candidates
  const deepAnalysisResults = await Promise.all(
    topCandidates.map(async ({ job, similarity }) => {
      // Use OpenAI for deep analysis on full job description and title
      const { score: deepScore, rationale } = await calculateSimilarityScore(cvText, job.title, job.description);
      
      // Use the AI deep score as the primary score, with a small influence from semantic embedding
      // This provides a balanced score that prioritizes deep analysis
      const finalScore = (deepScore * 0.9) + (similarity * 0.1);
      
      return { job, score: finalScore, rationale };
    })
  );

  // Use raw scores from deep AI analysis for maximum accuracy
  const finalResults = deepAnalysisResults.map(match => {
    // Ensure score stays within 0-1 range
    const finalScore = Math.min(1.0, Math.max(0, match.score));
    return { ...match, score: finalScore };
  });

  // Filter by minimum threshold, sort by score, and take top 3
  const topMatches = finalResults
    .filter(match => match.score >= MINIMUM_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((match, index) => ({
      job: match.job,
      score: match.score,
      rank: index + 1,
      rationale: match.rationale
    }));

  const duration = Date.now() - startTime;
  console.log(`Matching complete in ${duration}ms - found ${topMatches.length} matches above ${MINIMUM_MATCH_THRESHOLD * 100}% threshold`);

  return topMatches;
}

// Optional: Clear cache periodically to avoid unbounded growth
export function clearEmbeddingsCache() {
  jobEmbeddingsCache.clear();
}
