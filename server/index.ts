import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
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

// Initialize routes - wrap in a try/catch to prevent unhandled promise rejections
try {
  // Use a synchronous approach for Vercel
  registerRoutes(app).catch(err => {
    console.error("Failed to register routes:", err);
  });
} catch (error) {
  console.error("Error during route registration:", error);
}

// Add a simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handler middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error("Server error:", err);
  
  // Only send response if it hasn't been sent already
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

// Setup for development or production
if (process.env.NODE_ENV === "development") {
  const server = app.listen(3000, () => {
    console.log("Development server running on port 3000");
  });
  
  setupVite(app, server).catch(err => {
    console.error("Failed to setup Vite:", err);
  });
} else {
  // For production (Vercel)
  try {
    // Check if we're in a Vercel environment
    if (process.env.VERCEL) {
      console.log("Running in Vercel environment");
    }
    serveStatic(app);
  } catch (error) {
    console.error("Error setting up static serving:", error);
  }
}

// For local development
if (!process.env.VERCEL && process.env.NODE_ENV === "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

// Export the app for Vercel
export default app;
