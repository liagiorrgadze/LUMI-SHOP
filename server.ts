import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/db';
import { seedDatabase } from './server/seed';
import { apiRouter } from './server/routes/api';

async function startServer() {
  // Initialize SQLite schema & deterministic seed data
  initializeDatabase();
  seedDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // CORS configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded product images
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsPath, { recursive: true });
  app.use('/uploads', express.static(uploadsPath));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', store: 'LUMI STORE' });
  });

  // Mount REST API
  app.use('/api', apiRouter);

  // API 404 fallback
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LUMI STORE server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LUMI STORE server:', err);
  process.exit(1);
});
