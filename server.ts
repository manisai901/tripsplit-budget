import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // SPA fallback route for development
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/') || req.originalUrl.includes('.')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mani Traveler Server running on http://localhost:${PORT}`);
  });
}

startServer();
