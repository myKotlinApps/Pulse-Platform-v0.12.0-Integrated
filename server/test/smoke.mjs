import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'4130',HOST:'127.0.0.1',ALLOW_DEV_AUTH:'1'},stdio:'ignore'});
await new Promise(r=>setTimeout(r,500));
try{const health=await fetch('http://127.0.0.1:4130/health').then(r=>r.json());if(!health.ok)throw new Error('health failed');console.log('server smoke ok')}finally{child.kill()}
