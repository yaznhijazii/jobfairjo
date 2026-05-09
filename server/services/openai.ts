import "dotenv/config";
import OpenAI from "openai";

console.log(`--- SERVER VERSION 2.0 IS READY ---`);
console.log(`Forcing Base URL: https://api.openai.com/v1`);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // HARDCODED TO BYPASS ENV ISSUES
});

export interface MatchScore {
  score: number; // 0-1 similarity score
  rationale: string; // Explanation of the score
}

/**
 * Calculate semantic similarity between CV text and job description using OpenAI
 * This provides deep AI analysis for accurate matching
 */
export async function calculateSimilarityScore(
  cvText: string,
  jobDescription: string
): Promise<MatchScore> {
  try {
    const prompt = `You are an intelligent recruitment systems analyzer. Your goal is to identify if a candidate's career path aligns with a job role.
    
    MATCHING STRATEGY:
    1. ROLE ALIGNMENT: If the Job Title or core role (e.g., Software Engineer, Data Analyst, Marketing) is in the same career path as the candidate's history, BE GENEROUS (yghawiz). Even if they lack 20-30% of the specific tools, give them a high score (0.7+) because they have the right foundation.
    2. ROLE MISMATCH: If the job is in a completely different professional world (e.g., a Technical person applying for a Language Teacher role), the score MUST be below 0.3.
    3. SENIORITY: Adjust slightly for seniority, but prioritize Role Alignment first.
    
    Calculate a similarity score from 0.0 to 1.0 and provide a technical rationale.
    
    Respond with ONLY a JSON object: { "score": number, "rationale": string }
    
    ---
    CANDIDATE CV:
    ${cvText}
    ---
    JOB DESCRIPTION:
    ${jobDescription}
    ---`;

    console.log(`Using Base URL: ${openai.baseURL}`);
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a technical matching engine. You prioritize domain relevance. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      // max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const score = parseFloat(result.score) || 0;
    const rationale = result.rationale || "Matching analysis completed based on candidate's skills and job requirements.";
    
    console.log(`--- AI Match Result ---`);
    console.log(`Job: ${jobDescription}`);
    console.log(`Score: ${score}`);
    console.log(`Rationale: ${rationale}`);
    console.log(`-----------------------`);

    // Ensure score is between 0 and 1
    return {
      score: Math.max(0, Math.min(1, score)),
      rationale: rationale
    };
  } catch (error: any) {
    console.error("AI Error Details:");
    console.error(`Status: ${error.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response) {
      console.error(`Response Data: ${JSON.stringify(error.response.data)}`);
    }
    
    // Return a low score on error rather than failing completely
    return {
      score: 0.1,
      rationale: "Automated analysis was unable to reach the AI engine. This score represents a baseline semantic match."
    };
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    //console.log(`[AI] Generating embedding for text (length: ${text.length} chars)`);
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    console.log(`[AI] Embedding generated successfully`);
    return response.data[0].embedding;
  } catch (error: any) {
    console.error("[AI] Error generating embedding:", error.message);
    // Return zero vector on error
    return new Array(1536).fill(0);
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
