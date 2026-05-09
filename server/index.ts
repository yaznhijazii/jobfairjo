import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, createHttpServer } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize the server
const startServer = async () => {
  registerRoutes(app);
  const server = createHttpServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    log("Environment: development - Setting up Vite...");
    await setupVite(app, server);
  } else {
    log("Environment: production - Serving static files...");
    try {
      serveStatic(app);
    } catch (e) {
      console.error("Failed to setup static serving:", e);
    }
  }

  const port = parseInt(process.env.PORT || '5001', 10);
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  }
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

export default app;
