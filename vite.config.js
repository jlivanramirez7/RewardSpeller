import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Resend } from 'resend'

const COPPA_SECRET = process.env.COPPA_JWT_SECRET || 'rewardspeller_coppa_super_secret_key_2026';
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_8sBNFkhz_FeG6xx5AQdamd97BaMRrJen5';
const resend = new Resend(RESEND_API_KEY);
const SENDER_EMAIL = process.env.COPPA_SENDER_EMAIL || 'privacy@rewardspeller.com';

function signJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', COPPA_SECRET)
    .update(`${encHeader}.${encPayload}`)
    .digest('base64url');
  return `${encHeader}.${encPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encHeader, encPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', COPPA_SECRET)
      .update(`${encHeader}.${encPayload}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

async function sendCOPPAEmail(to, subject, textContent) {
  console.log(`\n==================================================`);
  console.log(`📧 [LIVE EMAIL DISPATCH] -> TO: ${to}`);
  console.log(`🏷️ SUBJECT: ${subject}`);
  console.log(`--------------------------------------------------`);
  console.log(textContent);
  console.log(`==================================================\n`);
  
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: subject,
      text: textContent
    });
    console.log(`[RESEND SUCCESS] Email sent successfully! ID: ${data?.id}`);
    return { success: true, messageId: data?.id || `resend-${Date.now()}` };
  } catch (err) {
    console.error(`[RESEND ERROR] Failed to send live email to ${to}:`, err);
    return { success: false, error: err.message, messageId: `mock-fallback-${Date.now()}` };
  }
}



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

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(302, { Location: '/landing.html' });
    res.end();
    return;
  }

  // HTML5 History SPA routing fallback: Rewrite browser GET routes to index.html
  // so the React SPA bundle loads cleanly instead of rendering 404 or blank pages!
  const isApi = req.url.startsWith('/api/');
  const isAsset = req.url.includes('.') || req.url.startsWith('/@') || req.url.startsWith('/node_modules/') || req.url.startsWith('/src/');
  
  if (!isApi && !isAsset && req.method === 'GET') {
    req.url = '/index.html';
  }

  if (req.url === '/api/config' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID
    }));
    return;
  }

  if (req.url === '/api/register-parent' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { email, uid } = body;
      if (!email || !uid) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing email or uid' }));
        return;
      }

      const token = signJWT({ uid, email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 24 * 3600 });
      const verifyUrl = `https://${req.headers.host}/api/verify-consent?token=${token}`;
      
      const emailText = `Subject: Action Required: Verifiable Parental Consent for RewardSpeller\n\nDear Parent/Guardian,\n\nYou have registered a parent account for RewardSpeller (email: ${email}).\n\nTo comply with the Children's Online Privacy Protection Act (COPPA), we require your explicit verifiable parental consent before your child can access our educational assessment modules or the Jedi Archive.\n\nDATA COLLECTION NOTICE:\nRewardSpeller collects educational performance data (spelling accuracy, struggle words, active learning duration, and engagement streaks) strictly to calibrate your child's individualized learning track and provide diagnostic insights within your Parent Control Center.\n\nPRIVACY GUARANTEE:\nWe pledge that your child's personal and educational data will NEVER be sold, rented, or shared with any third-party advertisers or commercial entities.\n\nTo grant verifiable parental consent and unlock the learning platform, please click the unique, secure verification link below (valid for 24 hours):\n${verifyUrl}\n\nIf you did not request this account, please ignore this email.\n\nSincerely,\nThe RewardSpeller Privacy Team`;

      const emailResult = await sendCOPPAEmail(email, 'Action Required: Verifiable Parental Consent for RewardSpeller', emailText);

      res.setHeader('Content-Type', 'application/json');
      if (!emailResult.success) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: `Resend API Error: ${emailResult.error}` }));
        return;
      }
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.url.startsWith('/api/verify-consent') && req.method === 'GET') {
    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    const token = urlObj.searchParams.get('token');
    if (!token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>400 - Missing Token</h1><p>No verification token provided.</p>');
      return;
    }

    const payload = verifyJWT(token);
    if (!payload) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>400 - Invalid or Expired Token</h1><p>Your parental consent link has expired or is invalid. Please log into RewardSpeller to request a new verification email.</p>');
      return;
    }

    const parentUrl = `https://${req.headers.host}/parent`;
    const emailText = `Subject: Confirmation: Parental Consent Recorded for RewardSpeller\n\nDear Parent/Guardian,\n\nThank you! We have successfully verified and recorded your parental consent for RewardSpeller (account: ${payload.email}).\n\nYour child's educational workspace is now officially unlocked. They can immediately access the Jedi Archive, begin spelling trials, and earn points toward your configured rewards vault.\n\nYou can monitor their real-time diagnostic struggle reports, calibrate curriculum grade levels, and manage custom rewards at any time by accessing your Parent Control Center:\n${parentUrl}\n\nSincerely,\nThe RewardSpeller Privacy Team`;

    await sendCOPPAEmail(payload.email, 'Confirmation: Parental Consent Recorded for RewardSpeller', emailText);

    res.writeHead(302, { Location: '/app?coppa-verified=true' });
    res.end();
    return;
  }

  if (req.url === '/api/notify-approval' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { email } = body;
      if (!email) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing email' }));
        return;
      }

      const loginUrl = `https://${req.headers.host}/login`;
      const emailText = `Subject: Welcome to RewardSpeller: Your Access Has Been Approved!\n\nDear Parent/Guardian,\n\nGreat news! Your access request for RewardSpeller (account: ${email}) has been reviewed and approved by our team.\n\nYou can now log into the application and immediately access the Parent Control Center to create child profiles, link student emails, and manage custom rewards:\n${loginUrl}\n\nAs a reminder, the default password to access your Parent Dashboard/Portal settings is simply "password".\n\nSincerely,\nThe RewardSpeller Team`;

      const emailResult = await sendCOPPAEmail(email, 'Welcome to RewardSpeller: Your Access Has Been Approved!', emailText);

      res.setHeader('Content-Type', 'application/json');
      if (!emailResult.success) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: `Resend API Error: ${emailResult.error}` }));
        return;
      }
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
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
    port: parseInt(process.env.PORT) || 8080,
    allowedHosts: true
  }
})
