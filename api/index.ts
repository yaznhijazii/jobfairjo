import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Pre-check for required environment variables
if (!process.env.OPENAI_API_KEY || !process.env.LLAMA_CLOUD_API_KEY) {
  console.warn("WARNING: Missing essential API keys in environment variables!");
}

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  try {
    serveStatic(app);
  } catch (e) {
    console.error("Static serving setup failed:", e);
  }
}

export default app;
