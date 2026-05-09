import type { Job } from "../../shared/schema.js";
import * as cheerio from 'cheerio';

const JOACADEMY_API_URL = process.env.JOACADEMY_API_URL || "https://careers.joacademy.com/en/api/v1/career_page/jobs/live";

interface JoAcademyJob {
  id: number;
  title: string;
  job_description: string;
  department_name: string;
  location: string;
  public_link: string;
}

interface JoAcademyApiResponse {
  data: JoAcademyJob[];
  meta?: {
    pager?: {
      has_next_page: boolean;
    }
  }
}

// Simple in-memory cache to avoid hammering the API
let jobsCache: { jobs: Job[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch live job listings from JoAcademy careers API with enrichment
 */
export async function fetchJoAcademyJobs(): Promise<Job[]> {
  // Check cache first
  if (jobsCache && Date.now() - jobsCache.timestamp < CACHE_DURATION) {
    console.log(`Using cached jobs (${jobsCache.jobs.length} listings)`);
    return jobsCache.jobs;
  }

  try {
    const jobs: Job[] = [];
    let page = 1;
    let hasNextPage = true;
    const token = process.env.JOACADEMY_TOKEN || '';

    while (hasNextPage) {
      const params = new URLSearchParams({
        "page[number]": page.toString(),
        "page[limit]": "20",
        "sort[type]": "created_at",
        "sort[order]": "desc",
        "slug": "2604-jo-academy"
      });

      const response = await fetch(`${JOACADEMY_API_URL}?${params.toString()}`, {
        headers: {
          "Accept": "application/json",
          "token": token,
          "x-kl-kes-ajax-request": "Ajax_Request"
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data: JoAcademyApiResponse = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        jobs.push(...data.data.map((job) => ({
          title: job.title || "Untitled Position",
          department: job.department_name || "General",
          location: job.location || "Remote",
          description: job.job_description || "",
          link: job.public_link || ""
        })));
      }

      if (data?.meta?.pager?.has_next_page) {
        page++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`Fetched ${jobs.length} jobs. Starting enrichment for top 10...`);

    // Enrich top jobs concurrently but limit to a reasonable number to avoid timeouts
    // We only enrich the top 10 to ensure we stay within Vercel's execution limits
    const enrichCount = Math.min(jobs.length, 10);
    const enrichedJobs = await Promise.all(jobs.slice(0, enrichCount).map(async (job) => {
      if (job.link) {
        try {
          const enrichStart = Date.now();
          const res = await fetch(job.link, { signal: AbortSignal.timeout(5000) }); // 5s timeout per job
          const html = await res.text();
          const $ = cheerio.load(html);
          
          $('script, style, nav, footer, iframe').remove();
          
          let content = '';
          $('h1, h2, h3, h4, p, li').each((_, el) => {
            const text = $(el).text().trim();
            if (text) content += text + '\n';
          });

          if (content.trim()) {
            job.description = content.trim().substring(0, 5000);
          }
          console.log(`Enriched job: ${job.title} (${Date.now() - enrichStart}ms)`);
        } catch (e) {
          console.error(`Failed to enrich job ${job.title}:`, e instanceof Error ? e.message : e);
        }
      }
      return job;
    }));

    // Add the rest of the jobs without enrichment
    if (jobs.length > enrichCount) {
      enrichedJobs.push(...jobs.slice(enrichCount));
    }

    // Update cache
    jobsCache = { jobs: enrichedJobs, timestamp: Date.now() };
    return enrichedJobs;
  } catch (error) {
    console.error("Error fetching JoAcademy jobs:", error);
    if (jobsCache) return jobsCache.jobs;
    throw error;
  }
}
