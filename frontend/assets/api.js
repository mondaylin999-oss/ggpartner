/* PostgreSQL API adapter. Retains the original UI's document-shaped calls.
   All authorization is enforced by the server. Subscriptions poll every 2s. */
(function () {
  let firebaseAuth = null;
  async function request(path, body) {
    const headers = body === undefined ? {} : { 'Content-Type': 'application/json', 'X-GG-Request': '1' };
    if (firebaseAuth?.currentUser) headers.Authorization = 'Bearer ' + await firebaseAuth.currentUser.getIdToken();
    const response = await fetch('/api/' + path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  }
  function snapshot(row, path) {
    return { id: path.split('/').pop(), exists: !!row, data: () => row || undefined, ref: new Ref(path, true) };
  }
  class Ref {
    constructor(path, document = false, query = {}) { this.path = path; this.document = document; this.query = query; this.id = path.split('/').pop(); }
    collection(name) { return new Ref(this.path + '/' + name); }
    doc(id = crypto.randomUUID()) { return new Ref(this.path + '/' + id, true); }
    where(field, op, value) { return new Ref(this.path, false, { ...this.query, filters: [...(this.query.filters || []), [field, op, value]] }); }
    orderBy(field, direction = 'asc') { return new Ref(this.path, false, { ...this.query, order: [field, direction] }); }
    limit(limit) { return new Ref(this.path, false, { ...this.query, limit }); }
    async get() {
      const result = await request('data/read', { path: this.path, document: this.document, ...this.query });
      if (this.document) return snapshot(result.data, this.path);
      const docs = result.rows.map(r => snapshot(r.data, this.path + '/' + r.id));
      return { docs, forEach: f => docs.forEach(f), docChanges: () => docs.map(doc => ({ type: 'added', doc })) };
    }
    set(data, options = {}) { return request('data/write', { path: this.path, data, merge: !!options.merge }); }
    update(data) { return request('data/write', { path: this.path, data, merge: true, update: true }); }
    delete() { return request('data/write', { path: this.path, remove: true }); }
    async add(data) { const ref = this.doc(); await ref.set(data); return ref; }
    onSnapshot(callback, onError = console.error) {
      let stopped = false, timer, previous = new Map(), last = null;
      const poll = async () => {
        try {
          const snap = await this.get();
          if (stopped) return;
          const fingerprint = JSON.stringify(this.document ? snap.data() : snap.docs.map(d => [d.id, d.data()]));
          if (fingerprint !== last) {
            if (!this.document) {
              const next = new Map(snap.docs.map(d => [d.id, JSON.stringify(d.data())]));
              const changes = snap.docs.filter(d => previous.get(d.id) !== next.get(d.id)).map(doc => ({ type: previous.has(doc.id) ? 'modified' : 'added', doc }));
              snap.docChanges = () => changes; previous = next;
            }
            last = fingerprint; callback(snap);
          }
        } catch (e) { if (!stopped) onError(e); }
        if (!stopped) timer = setTimeout(poll, 2000);
      };
      poll(); return () => { stopped = true; clearTimeout(timer); };
    }
  }
  function loadScript(src) {
    return new Promise((resolve,reject) => {
      const script=document.createElement('script'); script.src=src;
      script.onload=resolve; script.onerror=()=>reject(new Error('Cannot load Google sign-in. Check your internet connection.'));
      document.head.appendChild(script);
    });
  }
  let ready;
  function initialize() {
    if (!ready) ready=(async()=>{
      const config=await request('config');
      if (!config.configured) throw new Error('Google sign-in is not configured yet. The operator should follow README1.md.');
      await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js');
      firebase.initializeApp(config.firebase);
      firebaseAuth=firebase.auth();
      await firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      return firebaseAuth;
    })();
    return ready;
  }
  function clearAccountCache() {
    Object.keys(localStorage).filter(k => /ggpartner|pairup/i.test(k) && k !== 'gg.auth.identity').forEach(k => localStorage.removeItem(k));
  }
  const auth = {
    error: '',
    async onAuthStateChanged(callback) {
      try {
        const fb=await initialize();
        let first=true;
        fb.onAuthStateChanged(async user=>{
          const id=user?.uid || 'guest';
          const previous=localStorage.getItem('gg.auth.identity');
          if (previous !== id) {
            clearAccountCache(); localStorage.setItem('gg.auth.identity',id);
            if (previous !== null || user) { location.reload(); return; }
          }
          if (!first) { location.reload(); return; }
          first=false;
          try { callback(user ? (await request('auth/me')).user : null); }
          catch(e) { auth.error=e.message; callback(null); }
        });
      } catch(e) { auth.error=e.message; callback(null); }
    },
    async login() {
      const fb=await initialize();
      const provider=new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({prompt:'select_account'});
      await fb.signInWithPopup(provider);
    },
    async signOut() {
      if(firebaseAuth) await firebaseAuth.signOut();
      clearAccountCache();
    }
  };
  window.GG = { auth, db: {
    collection: name => new Ref(name),
    batch() { const writes = []; return { update: (ref, data) => writes.push({ path: ref.path, data, merge: true, update: true }), commit: () => request('data/batch', { writes }) }; }
  } };
})();
