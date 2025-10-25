import type { Job, MatchResult } from "@shared/schema";
import { generateEmbedding, cosineSimilarity, calculateSimilarityScore } from "./openai";

/**
 * Two-stage AI matching process:
 * Stage 1: Quick semantic filtering using embeddings (filter to top 10)
 * Stage 2: Deep AI analysis using OpenAI on top candidates (get final top 3)
 */
export async function matchJobsToCV(cvText: string, jobs: Job[]): Promise<MatchResult[]> {
  if (jobs.length === 0) {
    return [];
  }

  console.log(`Starting two-stage matching for ${jobs.length} jobs...`);

  // Stage 1: Quick Semantic Filtering using embeddings
  console.log("Stage 1: Quick semantic filtering with embeddings...");
  
  const cvEmbedding = await generateEmbedding(cvText);
  
  // Generate embeddings for all jobs (using title + department + location for quick match)
  const jobScores = await Promise.all(
    jobs.map(async (job, index) => {
      const jobText = `${job.title} ${job.department} ${job.location}`;
      const jobEmbedding = await generateEmbedding(jobText);
      const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);
      
      return { job, similarity, index };
    })
  );

  // Sort by similarity and take top 10 candidates
  const topCandidates = jobScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  console.log(`Stage 1 complete: Filtered to ${topCandidates.length} top candidates`);

  // Stage 2: Deep AI Analysis on top candidates
  console.log("Stage 2: Deep AI analysis on top candidates...");
  
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

  console.log(`Stage 2 complete: Found ${topMatches.length} top matches`);
  console.log(`Top scores: ${topMatches.map(m => `${(m.score * 100).toFixed(1)}%`).join(", ")}`);

  return topMatches;
}
