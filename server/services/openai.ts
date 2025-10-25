import OpenAI from "openai";

// Using the javascript_openai blueprint
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface MatchScore {
  score: number; // 0-1 similarity score
}

/**
 * Calculate semantic similarity between CV text and job description using OpenAI
 * This provides deep AI analysis for accurate matching
 */
export async function calculateSimilarityScore(
  cvText: string,
  jobDescription: string
): Promise<number> {
  try {
    const prompt = `Compare the following CV and Job Description. Analyze the candidate's skills, experience, and qualifications against the job requirements.
    
Provide a similarity score from 0.0 to 1.0 where:
- 1.0 = Perfect match, candidate exceeds all requirements
- 0.8-0.9 = Excellent match, candidate meets most requirements with strong alignment
- 0.6-0.7 = Good match, candidate meets many requirements
- 0.4-0.5 = Moderate match, some relevant skills
- 0.0-0.3 = Poor match, minimal alignment

Respond with ONLY a JSON object in this format: { "score": number }

---
CV (first 3000 characters):
${cvText.substring(0, 3000)}
---
Job Description:
${jobDescription}
---`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert recruitment AI that analyzes resumes and job descriptions to calculate precise matching scores. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 100,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const score = parseFloat(result.score) || 0;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error("Error calculating similarity score:", error);
    // Return a low score on error rather than failing completely
    return 0.1;
  }
}

/**
 * Generate embeddings for text using OpenAI
 * Used for quick semantic filtering before deep analysis
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000), // Limit input length
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
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
