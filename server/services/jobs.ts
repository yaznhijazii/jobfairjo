import type { Job } from "@shared/schema";

const JOACADEMY_API_URL = process.env.JOACADEMY_API_URL || "https://careers.joacademy.com/en/api/v1/career_page/jobs/live";

interface JoAcademyJob {
  title: string;
  job_description: string;
  department_name: string;
  location: string;
  public_link: string;
}

interface JoAcademyApiResponse {
  data: JoAcademyJob[];
}

// Simple in-memory cache to avoid hammering the API
let jobsCache: { jobs: Job[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch live job listings from JoAcademy careers API with caching and fallback
 */
export async function fetchJoAcademyJobs(): Promise<Job[]> {
  // Check cache first
  if (jobsCache && Date.now() - jobsCache.timestamp < CACHE_DURATION) {
    console.log(`Using cached jobs (${jobsCache.jobs.length} listings)`);
    return jobsCache.jobs;
  }

  try {
    const params = new URLSearchParams({
      "page[number]": "1",
      "page[limit]": "50",
      "sort[type]": "created_at",
      "sort[order]": "desc",
      "slug": "2604-jo-academy"
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${JOACADEMY_API_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      }
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data: JoAcademyApiResponse = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid API response format");
    }

    const jobs = data.data.map((job) => ({
      title: job.title || "Untitled Position",
      department: job.department_name || "General",
      location: job.location || "Remote",
      description: job.job_description || "",
      link: job.public_link || ""
    }));

    // Update cache
    jobsCache = { jobs, timestamp: Date.now() };
    console.log(`Fetched and cached ${jobs.length} jobs from JoAcademy API`);

    return jobs;
  } catch (error) {
    console.error("Error fetching JoAcademy jobs:", error);

    // If we have cached data, return it even if expired
    if (jobsCache) {
      console.warn("Returning stale cached data due to API error");
      return jobsCache.jobs;
    }

    // As a last resort, return empty array with helpful error
    throw new Error(
      error instanceof Error && error.name === 'AbortError'
        ? "Job API request timed out. Please try again."
        : "Unable to fetch job listings. The JoAcademy careers API may be temporarily unavailable."
    );
  }
}
