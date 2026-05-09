import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { matchRequestSchema } from "@shared/schema";
import { fetchJoAcademyJobs } from "./services/jobs";
import { matchJobsToCV } from "./services/matching";
import { extractTextFromPDF } from "./services/pdf-parser";

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log(`Current Environment (NODE_ENV): ${process.env.NODE_ENV}`);
  console.log(`Express Environment (app.get('env')): ${app.get('env')}`);

  app.get("/", (_req, res, next) => {
    // If it's an API request or something specific, let it pass
    // Otherwise, for testing, we can return a simple message or let Vite handle it
    // Let's just log and let Vite handle it usually, but for debug:
    console.log("Root route hit");
    next(); 
  });

  /**
   * GET /api/health
   */
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: app.get("env") });
  });
  /**
   * POST /api/upload-cv
   * Upload and extract text from PDF resume
   */
  app.post("/api/upload-cv", upload.single("cv"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded"
        });
      }

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(req.file.buffer);
      console.log(`Extracted CV text: ${extractedText}`);
      if (!extractedText || extractedText.length < 50) {
        return res.status(400).json({
          success: false,
          error: "Could not extract sufficient text from PDF. Please ensure your CV contains readable text."
        });
      }

      console.log(`Successfully extracted ${extractedText.length} characters from CV`);

      res.json({
        success: true,
        text: extractedText
      });
    } catch (error) {
      console.error("Error processing CV:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process CV"
      });
    }
  });

  /**
   * POST /api/match-jobs
   * Match CV text against live job listings using two-stage AI analysis
   */
  app.post("/api/match-jobs", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = matchRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request: CV text is required"
        });
      }

      const { cvText } = validation.data;
      const startTime = Date.now();

      // Fetch live jobs from JoAcademy
      console.log("Fetching live jobs from JoAcademy...");
      const jobs = await fetchJoAcademyJobs();
      console.log(`Fetched ${jobs.length} live job listings`);

      if (jobs.length === 0) {
        return res.json({
          matches: [],
          totalJobs: 0,
          processingTime: Date.now() - startTime
        });
      }

      // Run two-stage matching process
      console.log("Starting AI matching process...");
      const matches = await matchJobsToCV(cvText, jobs);
      
      const processingTime = Date.now() - startTime;
      console.log(`Matching complete in ${processingTime}ms`);

      res.json({
        matches,
        totalJobs: jobs.length,
        processingTime
      });
    } catch (error) {
      console.error("Error matching jobs:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to match jobs"
      });
    }
  });

  /**
   * GET /api/jobs
   * Fetch available job listings (optional endpoint for testing)
   */
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await fetchJoAcademyJobs();
      res.json({ jobs, total: jobs.length });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch jobs"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
