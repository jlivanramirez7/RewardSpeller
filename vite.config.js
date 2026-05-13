import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getRequestBody(req, limit = 1024 * 100) { // Default 100KB
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    req.on('data', (chunk) => {
      length += chunk.length;
      if (length > limit) {
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const bodyStr = buffer.toString('utf8');
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

const getStoragePath = () => process.env.STORAGE_PATH || path.resolve('saved_scores.json');

const scoresApiMiddleware = async (req, res, next) => {
  const filePath = getStoragePath();
  
  if (req.url === '/api/load-scores' && req.method === 'GET') {
    try {
      await fs.promises.access(filePath);
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    } catch {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({}));
    }
    return;
  }

  if (req.url === '/api/save-scores' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      await fs.promises.writeFile(filePath, JSON.stringify(body, null, 2));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      res.statusCode = error.message === 'Body too large' ? 413 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message || 'Failed to save scores' }));
    }
    return;
  }

  if (req.url === '/api/storage-path' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const displayedPath = process.env.K_SERVICE ? 'Cloud Storage (Mounted)' : filePath;
    res.end(JSON.stringify({ path: displayedPath }));
    return;
  }

  next();
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'scores-api',
      configureServer(server) {
        server.middlewares.use(scoresApiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(scoresApiMiddleware);
      }
    }
  ],
  server: {
    allowedHosts: ['.proxy.googlers.com']
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT) || 8080
  }
})
