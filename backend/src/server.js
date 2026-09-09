import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createApp } from './app.js';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. See README1.md.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(await readFile(new URL('../../database/001_init.sql', import.meta.url), 'utf8'));
const projectId = process.env.FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY;
const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
const appId = process.env.FIREBASE_APP_ID;
let firebaseConfig = null, verifyToken = null;
if (projectId && apiKey && authDomain && appId) {
  initializeApp({ credential: applicationDefault(), projectId });
  firebaseConfig = { projectId, apiKey, authDomain, appId };
  verifyToken = token => getAuth().verifyIdToken(token, true);
} else {
  console.warn('Google login is not configured. Guest mode is available. Follow README1.md to connect Firebase.');
}
const server = createApp(pool, { origin: process.env.APP_ORIGIN || '', firebaseConfig, verifyToken });
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('GG Partner listening on port ' + (process.env.PORT || 3000)));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
