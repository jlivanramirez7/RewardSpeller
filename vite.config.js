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

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'scores-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/load-scores' && req.method === 'GET') {
            const filePath = path.resolve('saved_scores.json');
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({}));
            }
            return;
          }

          if (req.url === '/api/save-scores' && req.method === 'POST') {
            try {
              const body = await getRequestBody(req);
              const filePath = path.resolve('saved_scores.json');
              fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = error.message === 'Body too large' ? 413 : 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error.message || 'Failed to save scores' }));
            }
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    allowedHosts: ['.proxy.googlers.com']
  }
})
