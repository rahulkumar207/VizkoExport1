import express from 'express';

const app = express();

app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;