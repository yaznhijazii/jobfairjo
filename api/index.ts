import "dotenv/config";
import express from "express";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/vite.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add global error logging for Vercel
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message, err.stack);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

console.log("API Booting up...");

// Pre-check for required environment variables
if (!process.env.OPENAI_API_KEY) console.warn("MISSING: OPENAI_API_KEY");
if (!process.env.LLAMA_CLOUD_API_KEY) console.warn("MISSING: LLAMA_CLOUD_API_KEY");

// Register API routes
registerRoutes(app);

export default app;
