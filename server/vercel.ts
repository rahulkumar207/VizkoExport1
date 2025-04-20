import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.get('/api/vercel-test', (req, res) => {
  res.json({ message: 'Vercel API is working' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Serve static files
const distPath = path.resolve(process.cwd(), 'public');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Fall through to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(500).json({ error: 'Build directory not found. Please build the client first.' });
  });
}

// Catch-all route for unmatched requests
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;