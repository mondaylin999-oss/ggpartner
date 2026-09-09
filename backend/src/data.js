export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const deny = () => { throw new HttpError(403, 'Access denied'); };
const object = x => x && typeof x === 'object' && !Array.isArray(x);
export async function getDoc(db, path) { return (await db.query('SELECT data FROM documents WHERE path=$1', [path])).rows[0]?.data; }
function parts(path, document = true) {
  if (typeof path !== 'string' || path.length > 300 || !/^[a-zA-Z0-9_/-]+$/.test(path)) throw new HttpError(400, 'Invalid path');
  const p = path.split('/');
  const roots = ['users', 'profiles', 'precise', 'reports', 'events', 'calls', 'threads'];
  if (!roots.includes(p[0]) || p.some(x => !x) || p.length !== (document ? (p.length > 2 ? 4 : 2) : (p.length > 1 ? 3 : 1))) throw new HttpError(400, 'Invalid collection');
  if (p.length > 2 && !((p[0] === 'threads' && p[2] === 'messages') || (p[0] === 'calls' && ['callerCandidates', 'calleeCandidates'].includes(p[2])))) deny();
  if (p[0] === 'threads' && p.length < 3) deny();
  return p;
}
async function blocked(db, a, b) {
  const [pa, pb] = await Promise.all([getDoc(db, 'profiles/' + a), getDoc(db, 'profiles/' + b)]);
  return (pa?.blocked || []).includes(b) || (pb?.blocked || []).includes(a);
}
async function canRead(db, uid, p, d) {
  if (p[0] === 'users') return p[1] === uid;
  if (p[0] === 'profiles') return p[1] === uid || !(await blocked(db, uid, p[1]));
  if (p[0] === 'reports') return d?.reporter === uid;
  if (p[0] === 'precise') return p[1] === uid || ((d?.allowed || []).includes(uid) && !(await blocked(db, uid, p[1])));
  if (p[0] === 'threads') {
    const pair = p[1].split('__');
    return pair.length === 2 && pair.includes(uid) && !(await blocked(db, pair[0], pair[1]));
  }
  if (p[0] === 'calls') {
    const call = p.length > 2 ? await getDoc(db, 'calls/' + p[1]) : d;
    return !!call && [call.from, call.to].includes(uid) && !(await blocked(db, call.from, call.to));
  }
  if (p[0] === 'events') {
    if (!d) return false;
    if (d.host?.uid === uid) return true;
    if (await blocked(db, uid, d.host?.uid)) return false;
    if (d.visibility === 'public' || d.members?.some(m => m.uid === uid) || d.invited?.includes(uid)) return true;
    const host = await getDoc(db, 'users/' + d.host?.uid);
    return (host?.matches || []).includes(uid);
  }
  return false;
}
async function visibleData(db, uid, p, data) {
  if (!data || p[0] !== 'profiles' || p[1] === uid || data.phonePublic) return data;
  const owner = await getDoc(db, 'users/' + p[1]);
  if ((owner?.matches || []).includes(uid)) return data;
  const copy = structuredClone(data);
  if (copy.links) delete copy.links.phone;
  return copy;
}
export async function read(db, uid, request) {
  const p = parts(request.path, !!request.document);
  if (request.document) {
    const data = await getDoc(db, request.path);
    if (!data && ['users', 'profiles', 'precise'].includes(p[0]) && p[1] === uid) return { data: null };
    if (!await canRead(db, uid, p, data)) deny();
    return { data: (await visibleData(db, uid, p, data)) || null };
  }
  if (p[0] === 'users') deny();
  const filters = request.filters || [];
  if (!Array.isArray(filters) || filters.length > 5 || filters.some(f => !Array.isArray(f) || !['==', 'array-contains'].includes(f[1]))) throw new HttpError(400, 'Invalid filters');
  const result = await db.query('SELECT path,data FROM documents WHERE collection=$1', [request.path]);
  const rows = [];
  for (const r of result.rows) {
    if (!await canRead(db, uid, r.path.split('/'), r.data)) continue;
    if (!filters.every(([key, op, value]) => op === '==' ? r.data[key] === value : Array.isArray(r.data[key]) && r.data[key].includes(value))) continue;
    rows.push({ id: r.path.split('/').pop(), data: await visibleData(db, uid, r.path.split('/'), r.data) });
  }
  if (request.order) { const [key, direction] = request.order; rows.sort((a,b) => ((a.data[key] > b.data[key]) - (a.data[key] < b.data[key])) * (direction === 'desc' ? -1 : 1)); }
  return { rows: rows.slice(0, Math.max(1, Math.min(Number(request.limit) || 500, 500))) };
}
export async function write(db, uid, w) {
  const p = parts(w.path);
  // Serialize writes to a document even when it does not exist yet.
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [w.path]);
  const old = await getDoc(db, w.path);
  if (w.update && !old) throw new HttpError(404, 'Document not found');
  if (!w.remove && !object(w.data)) throw new HttpError(400, 'Data must be an object');
  let data = w.merge ? { ...old, ...w.data } : { ...w.data };
  const own = ['users', 'profiles', 'precise'].includes(p[0]);
  if (own) {
    if (p[1] !== uid) deny();
    if (p[0] === 'profiles') { data.uid = uid; data.phoneVerified = false; }
    if (p[0] === 'precise') {
      data.uid = uid;
      if (!w.remove && (!Array.isArray(data.allowed) || data.allowed.length > 200 || !Number.isFinite(data.lat) || Math.abs(data.lat) > 90 || !Number.isFinite(data.lng) || Math.abs(data.lng) > 180)) throw new HttpError(400, 'Invalid location');
    }
  } else if (p[0] === 'reports') {
    if (old || w.remove || data.reporter !== uid) deny();
    data.t = Date.now();
  } else if (p[0] === 'threads') {
    if (!await canRead(db, uid, p, old)) deny();
    if (w.remove) deny();
    const pair = p[1].split('__');
    if (!old) {
      if (data.from !== uid || data.to !== pair.find(x => x !== uid) || !['text', 'voice', 'call'].includes(data.kind)) deny();
      data.t = Date.now(); data.delivered = false; data.seen = false;
    } else {
      if (old.to !== uid || Object.keys(w.data).some(k => !['delivered','seen'].includes(k)) || Object.values(w.data).some(v => v !== true)) deny();
    }
  } else if (p[0] === 'events') {
    if (!old) {
      if (w.remove || data.host?.uid !== uid || !Array.isArray(data.members) || data.members.length !== 1 || data.members[0].uid !== uid) deny();
    } else if (old.host?.uid !== uid) {
      if (w.remove || !await canRead(db, uid, p, old)) deny();
      // Membership changes preserve the latest host fields and other participants.
      const was = (old.members || []).some(m => m.uid === uid);
      const member = data.members?.find(m => m.uid === uid);
      data = { ...old, members: (old.members || []).filter(m => m.uid !== uid) };
      if (member && !was && (old.phase !== 'recruiting' || old.members.length >= old.slots)) throw new HttpError(409, 'Event is full or no longer recruiting');
      if (member) data.members.push({ uid, name: String(member.name || 'Member').slice(0,80) });
      if (data.members.length >= data.slots && data.phase === 'recruiting') { data.phase = 'live'; data.startedAt = Date.now(); }
      if (!member && was && data.phase === 'live') { data.phase = 'recruiting'; data.startedAt = 0; }
    } else {
      data.host = old.host;
      // A stale host edit must not erase members joining concurrently.
      data.members = old.members;
    }
    if (!w.remove && (!Number.isInteger(data.slots) || data.slots < 2 || data.slots > 100 || !Array.isArray(data.members) || data.members.length > data.slots)) throw new HttpError(400, 'Invalid event capacity');
  } else if (p[0] === 'calls') {
    if (p.length > 2) {
      const call = await getDoc(db, 'calls/' + p[1]);
      if (!call || (p[2] === 'callerCandidates' ? call.from : call.to) !== uid || !await canRead(db, uid, p, old) || old || w.remove) deny();
    } else if (!old) {
      if (w.remove || data.from !== uid || typeof data.to !== 'string' || data.to === uid || await blocked(db, uid, data.to)) deny();
      data.state = 'ringing'; data.t = Date.now();
    } else {
      if (w.remove || !await canRead(db, uid, p, old) || Object.keys(w.data).some(k => !['state', 'answer', 'reason', 'endedAt'].includes(k))) deny();
      if (w.data.answer && uid !== old.to) deny();
      if (w.data.state && !['live','ended','declined'].includes(w.data.state)) deny();
      data.from = old.from; data.to = old.to;
    }
  } else deny();
  if (w.remove) await db.query('DELETE FROM documents WHERE path=$1', [w.path]);
  else await db.query('INSERT INTO documents(path,collection,data) VALUES($1,$2,$3::jsonb) ON CONFLICT(path) DO UPDATE SET data=excluded.data,updated_at=now()', [w.path, p.slice(0,-1).join('/'), JSON.stringify(data)]);
  return { ok: true };
}
