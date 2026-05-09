import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { matchRequestSchema } from "../shared/schema.js";
import { fetchJoAcademyJobs } from "./services/jobs.js";
import { matchJobsToCV } from "./services/matching.js";
import { extractTextFromDocument } from "./services/pdf-parser.js";

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    
    // Check mimetype or file extension for mobile compatibility
    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);
    const isAllowedExt = /\.(pdf|doc|docx)$/i.test(file.originalname);

    if (isAllowedMime || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word files are allowed"));
    }
  },
});

export function registerRoutes(app: Express) {
  console.log(`Current Environment (NODE_ENV): ${process.env.NODE_ENV}`);
  console.log(`Express Environment (app.get('env')): ${app.get('env')}`);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: app.get("env") });
  });

  // CV Upload
  app.post("/api/upload-cv", upload.single("cv"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const extractedText = await extractTextFromDocument(
        req.file.buffer, 
        req.file.mimetype, 
        req.file.originalname
      );
      if (!extractedText || extractedText.length < 50) {
        return res.status(400).json({ success: false, error: "Insufficient text extracted from document" });
      }

      res.json({ success: true, text: extractedText });
    } catch (error) {
      console.error("Error processing CV:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to process CV" });
    }
  });

  // Job Matching
  app.post("/api/match-jobs", async (req: Request, res: Response) => {
    try {
      const validation = matchRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "CV text is required" });
      }

      const { cvText } = validation.data;
      const startTime = Date.now();
      const jobs = await fetchJoAcademyJobs();
      
      if (jobs.length === 0) {
        return res.json({ matches: [], totalJobs: 0, processingTime: Date.now() - startTime });
      }

      const matches = await matchJobsToCV(cvText, jobs);
      res.json({ matches, totalJobs: jobs.length, processingTime: Date.now() - startTime });
    } catch (error) {
      console.error("Error matching jobs:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to match jobs" });
    }
  });

  // Get Jobs (Testing)
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await fetchJoAcademyJobs();
      res.json({ jobs, total: jobs.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Catch-all for API 404
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });
}

export function createHttpServer(app: Express): Server {
  return createServer(app);
}
