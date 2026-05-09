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

    console.log(`Fetched ${jobs.length} jobs. Starting enrichment...`);

    // Enrich top jobs (or all if count is reasonable)
    const enrichedJobs = await Promise.all(jobs.slice(0, 15).map(async (job) => {
      if (job.link) {
        try {
          const res = await fetch(job.link);
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
        } catch (e) {
          console.error(`Failed to enrich job ${job.title}`);
        }
      }
      return job;
    }));

    // Update cache
    jobsCache = { jobs: enrichedJobs, timestamp: Date.now() };
    return enrichedJobs;
  } catch (error) {
    console.error("Error fetching JoAcademy jobs:", error);
    if (jobsCache) return jobsCache.jobs;
    throw error;
  }
}
