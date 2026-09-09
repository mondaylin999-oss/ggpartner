import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApp } from '../src/app.js';
let db, server, base;
const clients = {};
async function api(route, data, name='a') {
 const r=await fetch(base+'/api/'+route,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-GG-Request':'1',Authorization:clients[name]?.token?'Bearer '+clients[name].token:''},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await r.json();return {status:r.status,...result,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
before(async()=>{
 db=new PGlite();await db.exec(await readFile(new URL('../../database/001_init.sql',import.meta.url),'utf8'));
 // PGlite is single-connection; advisory locking is a no-op in this sequential test adapter.
 const query=(sql,args)=>sql.includes('pg_advisory_xact_lock')?Promise.resolve({rows:[]}):db.query(sql,args);
 const pool={query,connect:async()=>({query,release(){}})};
 server=createApp(pool,{firebaseConfig:{projectId:'test-project'},verifyToken:async token=>{
   if (!/^test-[abc]$/.test(token)) throw new Error('Invalid token');
   const name=token.slice(-1);return {uid:'firebase-'+name,email:name+'@example.test',name,firebase:{sign_in_provider:'google.com'}};
 }});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await new Promise(r=>server.close(r));await db.close();});
test('verified identity, directory, chat, event and privacy flow',async()=>{
 assert.equal((await api('health')).ok,true);
 assert.equal((await fetch(base+'/')).status,200);
 assert.equal((await api('data/read',{path:'profiles'})).status,401);
 for(const name of ['a','b','c']) {
  clients[name]={token:'test-'+name};
  const account=await api('auth/me',undefined,name);
  assert.equal(account.status,200);clients[name].id=account.user.uid;
 }
 const a=clients.a.id,b=clients.b.id,c=clients.c.id;
 clients.bad={token:'forged-token'};
 assert.equal((await api('auth/me',undefined,'bad')).status,401);
 assert.equal((await api('auth/login',{})).status,404);
 assert.equal((await api('auth/me')).user.uid,a);
 assert.equal((await api('data/write',{path:'users/'+a,data:{me:{name:'A'},matches:[b]}})).status,200);
 assert.equal((await api('data/read',{path:'users/'+a,document:true},'b')).status,403);
 assert.equal((await api('data/write',{path:'profiles/'+a,data:{uid:b,name:'Alice',phoneVerified:true}})).status,200);
 const profile=await api('data/read',{path:'profiles/'+a,document:true},'b');
 assert.equal(profile.data.uid,a);assert.equal(profile.data.phoneVerified,false);
 assert.equal((await api('data/write',{path:'profiles/'+a,data:{name:'Hacked'}},'b')).status,403);
 await api('data/write',{path:'precise/'+a,data:{lat:16.8,lng:96.1,allowed:[b]}});
 assert.equal((await api('data/read',{path:'precise/'+a,document:true},'b')).status,200);
 assert.equal((await api('data/read',{path:'precise'},'c')).rows.length,0);
 const thread=[a,b].sort().join('__');const path='threads/'+thread+'/messages/m1';
 assert.equal((await api('data/write',{path,data:{from:a,to:b,kind:'text',text:'Study at 5?',t:1}})).status,200);
 assert.equal((await api('data/read',{path:'threads/'+thread+'/messages'},'c')).rows.length,0);
 assert.equal((await api('data/write',{path,merge:true,data:{text:'Edited'}},'b')).status,403);
 assert.equal((await api('data/write',{path,merge:true,data:{seen:true,delivered:true}},'b')).status,200);
 const event={id:'e1',host:{uid:a,name:'A'},members:[{uid:a,name:'A'}],slots:2,phase:'recruiting',visibility:'public',title:'Study'};
 assert.equal((await api('data/write',{path:'events/e1',data:event})).status,200);
 assert.equal((await api('data/write',{path:'events/e1',data:{...event,title:'Hijack',members:[...event.members,{uid:b,name:'B'}]}},'b')).status,200);
 const joined=(await api('data/read',{path:'events/e1',document:true})).data;
 assert.equal(joined.title,'Study');assert.equal(joined.phase,'live');assert.equal(joined.members.length,2);
 assert.equal((await api('data/write',{path:'events/e1',data:{...event,members:[...event.members,{uid:c,name:'C'}]}},'c')).status,409);
 assert.equal((await api('data/write',{path:'events/e1',remove:true},'b')).status,403);
 assert.equal((await api('data/batch',{writes:[{path:'profiles/'+a,data:{name:'Wrong'}},{path:'profiles/'+b,data:{name:'Wrong'}}]})).status,403);
 assert.equal((await api('data/read',{path:'profiles/'+a,document:true})).data.name,'Alice');
 await api('data/write',{path:'profiles/'+a,merge:true,data:{blocked:[b]}});
 assert.equal((await api('data/read',{path:'precise/'+a,document:true},'b')).status,403);
 assert.equal((await api('data/write',{path:'threads/'+thread+'/messages/m2',data:{from:b,to:a,kind:'text',text:'blocked'}},'b')).status,403);
 const oldId=clients.a.id;
 assert.equal((await api('auth/me')).user.uid,oldId);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM google_accounts')).rows[0].n,3);
 assert.equal((await api('data/read',{path:'users/'+a,document:true})).data.me.name,'A');
});

test('unconfigured backend fails closed and exposes no credentials',async()=>{
 const app=createApp({query:(...args)=>db.query(...args)});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 try {
   const url='http://127.0.0.1:'+app.address().port;
   assert.deepEqual(await (await fetch(url+'/api/config')).json(),{firebase:null,configured:false});
   assert.equal((await fetch(url+'/api/auth/me')).status,503);
   assert.equal((await fetch(url+'/api/data/read',{method:'POST',headers:{'Content-Type':'application/json','X-GG-Request':'1'},body:'{"path":"profiles"}'})).status,503);
 }finally{await new Promise(r=>app.close(r));}
});
test('non-Google Firebase providers are rejected',async()=>{
 const app=createApp({query:(...args)=>db.query(...args)},{verifyToken:async()=>({uid:'password-user',firebase:{sign_in_provider:'password'}})});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 try { assert.equal((await fetch('http://127.0.0.1:'+app.address().port+'/api/auth/me',{headers:{Authorization:'Bearer valid-other-provider'}})).status,403); }
 finally{await new Promise(r=>app.close(r));}
});
