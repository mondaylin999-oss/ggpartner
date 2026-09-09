import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError, read, write } from './data.js';
const root = fileURLToPath(new URL('../../frontend/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const publicUser = row => row ? { uid: row.id, email: row.email, displayName: row.name, photoURL: row.photo_url || '' } : null;
async function body(req) {
  let size = 0, chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 3 * 1024 * 1024) throw new HttpError(413, 'Request too large'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { throw new HttpError(400, 'Invalid JSON'); }
}
export function createApp(pool, { origin = '', firebaseConfig = null, verifyToken = null } = {}) {
  return http.createServer(async (req, res) => {
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/api/')) {
        if (!['GET','HEAD'].includes(req.method)) throw new HttpError(405, 'Method not allowed');
        const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
        if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw new HttpError(403, 'Access denied');
        let bytes; try { bytes = await readFile(path); } catch { throw new HttpError(404, 'Not found'); }
        res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : bytes); return;
      }
      if (url.pathname === '/api/health' && req.method === 'GET') { await pool.query('SELECT 1'); json(200,{ ok:true, database:'PostgreSQL' }); return; }
      if (req.method !== 'GET' && req.method !== 'POST') throw new HttpError(405,'Method not allowed');
      if (req.method === 'POST') {
        if (req.headers['x-gg-request'] !== '1' || !req.headers['content-type']?.startsWith('application/json')) throw new HttpError(403,'Invalid request');
        const expected = origin || 'http://' + req.headers.host;
        if (req.headers.origin && req.headers.origin !== expected) throw new HttpError(403,'Origin not allowed');
      }
      const route = url.pathname.slice(5);
      if (route === 'config' && req.method === 'GET') {
        json(200, { firebase: firebaseConfig, configured: !!(firebaseConfig && verifyToken) }); return;
      }
      if (!['auth/me','data/read','data/write','data/batch'].includes(route)) throw new HttpError(404,'Not found');
      if (!verifyToken) throw new HttpError(503,'Google sign-in is not configured. Follow README1.md.');
      const token = /^Bearer ([^ ]+)$/.exec(req.headers.authorization || '')?.[1];
      if (!token || token.length > 16000) throw new HttpError(401,'Please sign in with Google.');
      let claims;
      try { claims = await verifyToken(token); }
      catch { throw new HttpError(401,'Your sign-in expired or was rejected. Please sign in again.'); }
      if (!claims?.uid || claims.firebase?.sign_in_provider !== 'google.com') throw new HttpError(403,'A Google sign-in is required.');
      // Only verified token claims identify accounts; never trust a client-supplied UID/email.
      const user = (await pool.query(`INSERT INTO google_accounts(id,firebase_uid,email,name,photo_url)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(firebase_uid) DO UPDATE
        SET email=excluded.email,name=excluded.name,photo_url=excluded.photo_url RETURNING *`,
        [randomUUID(),claims.uid,claims.email || '',claims.name || 'Member',claims.picture || ''])).rows[0];
      if (route === 'auth/me' && req.method === 'GET') { json(200,{user:publicUser(user)});return; }
      if (req.method !== 'POST') throw new HttpError(405,'Method not allowed');
      const input = await body(req);
      if(route==='data/read') { json(200,await read(pool,user.id,input));return; }
      if(['data/write','data/batch'].includes(route)) {
        const writes=route==='data/batch'?input.writes:[input];
        if(!Array.isArray(writes)||!writes.length||writes.length>500) throw new HttpError(400,'Invalid batch');
        const client=await pool.connect();
        try { await client.query('BEGIN');for(const w of writes) await write(client,user.id,w);await client.query('COMMIT'); }
        catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
        json(200,{ok:true});return;
      }
      throw new HttpError(404,'Not found');
    } catch(e) { if(!e.status) console.error(e); json(e.status || 500,{error:e.status?e.message:'Server error. Check server logs.'}); }
  });
}
