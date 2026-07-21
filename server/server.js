import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4030);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN_SECRET = process.env.ECUPULSE_TOKEN_SECRET || 'dev-change-me-now';
const ADMIN_PASSWORD = process.env.ECUPULSE_ADMIN_PASSWORD || 'ChangeMe-4030';
const ALLOW_DEV_AUTH = process.env.ALLOW_DEV_AUTH === '1';
const MAX_BODY = 1024 * 1024;
const DATA = path.join(__dirname, 'data');
const PUBLIC = path.join(__dirname, 'public');
const rate = new Map();

function readJson(name, fallback = []) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8')); }
  catch { return fallback; }
}
function writeJson(name, value) {
  const target = path.join(DATA, name);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, target);
}
function send(res, status, payload, headers = {}) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':body.length,'cache-control':'no-store',...headers});
  res.end(body);
}
function safeEqual(a,b){
  const x=Buffer.from(String(a)); const y=Buffer.from(String(b));
  return x.length===y.length && crypto.timingSafeEqual(x,y);
}
function b64url(value){return Buffer.from(value).toString('base64url')}
function signToken(payload, ttlSec = 900) {
  const now=Math.floor(Date.now()/1000);
  const data={...payload,iat:now,exp:now+ttlSec,jti:crypto.randomUUID()};
  const encoded=b64url(JSON.stringify(data));
  const sig=crypto.createHmac('sha256',TOKEN_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}
function verifyToken(token){
  if(!token || !token.includes('.')) return null;
  const [encoded,sig]=token.split('.');
  const expected=crypto.createHmac('sha256',TOKEN_SECRET).update(encoded).digest('base64url');
  if(!safeEqual(sig,expected)) return null;
  try { const data=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8')); if(data.exp < Date.now()/1000) return null; return data; } catch { return null; }
}
function bearer(req){return (req.headers.authorization||'').replace(/^Bearer\s+/i,'')}
function auth(req,res,scope){
  const token=verifyToken(bearer(req));
  if(!token) { send(res,401,{error:{code:'AUTH_REQUIRED',title:'احراز هویت لازم است',detail:'توکن معتبر ارسال نشده است.'}}); return null; }
  if(scope && !token.scopes?.includes(scope)) { send(res,403,{error:{code:'SCOPE_DENIED',title:'دسترسی مجاز نیست',detail:`مجوز ${scope} برای این نشست فعال نیست.`}}); return null; }
  return token;
}
function isPro(token){return token?.plan==='pro' && (!token.entitlementUntil || token.entitlementUntil>Date.now())}
function adminAuth(req,res){
  const token=verifyToken(bearer(req));
  if(!token?.admin){send(res,401,{error:{code:'ADMIN_REQUIRED',title:'ورود ادمین لازم است'}});return null;} return token;
}
async function body(req){
  const chunks=[]; let total=0;
  for await(const chunk of req){total+=chunk.length;if(total>MAX_BODY)throw Object.assign(new Error('payload too large'),{status:413});chunks.push(chunk)}
  const raw=Buffer.concat(chunks).toString('utf8');
  if(!raw) return {};
  try{return JSON.parse(raw)}catch{throw Object.assign(new Error('invalid json'),{status:400})}
}
function applyCors(req,res){
  const origin=req.headers.origin;
  if(origin && (/^https:\/\/([a-z0-9-]+\.)?diageman\.ir$/i.test(origin)||/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin))){
    res.setHeader('access-control-allow-origin',origin);res.setHeader('vary','Origin');
    res.setHeader('access-control-allow-headers','content-type,authorization,x-api-key,x-integrity-token');
    res.setHeader('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');
  }
}
function limited(req,res){
  const key=`${req.socket.remoteAddress}:${req.url.split('?')[0]}`; const now=Date.now();
  const cur=rate.get(key)||{start:now,count:0}; if(now-cur.start>60000){cur.start=now;cur.count=0} cur.count++;rate.set(key,cur);
  if(cur.count>120){send(res,429,{error:{code:'RATE_LIMITED',title:'درخواست بیش از حد',retryAfterSeconds:60}});return true} return false;
}
function entitlementFor(installationId){return readJson('entitlements.json').find(x=>x.installationId===installationId && x.active!==false)}
function quoteCoupon(code,offerId,store){
  const coupons=readJson('coupons.json'); const offers=readJson('offers.json');
  const offer=offers.find(x=>x.id===offerId&&x.active); if(!offer) throw Object.assign(new Error('offer not found'),{status:404,code:'OFFER_NOT_FOUND'});
  const coupon=coupons.find(x=>x.code.toUpperCase()===String(code||'').trim().toUpperCase()&&x.active);
  if(!coupon) throw Object.assign(new Error('coupon invalid'),{status:404,code:'COUPON_INVALID'});
  const now=Date.now(); if(now<Date.parse(coupon.startsAt)||now>Date.parse(coupon.endsAt)||coupon.uses>=coupon.maxUses||!coupon.offerIds.includes(offerId)) throw Object.assign(new Error('coupon unavailable'),{status:409,code:'COUPON_UNAVAILABLE'});
  const finalPrice=Math.max(0,Math.round(offer.basePrice*(100-coupon.percent)/100));
  const quote={quoteId:crypto.randomUUID(),offerId,couponCode:coupon.code,percent:coupon.percent,basePrice:offer.basePrice,finalPrice,currency:offer.currency,store,storeProductId:offer.products?.[store],storeOfferId:coupon.storeOfferIds?.[store]||null,expiresAt:Date.now()+10*60*1000};
  return {...quote,signature:crypto.createHmac('sha256',TOKEN_SECRET).update(JSON.stringify(quote)).digest('hex')};
}
function analyze(input){
  const dtcs=Array.isArray(input.dtcs)?input.dtcs:[]; const live=input.live||{}; const alerts=[];
  if((live.coolantC??0)>105) alerts.push({severity:'high',title:'دمای موتور بالا',detail:'سیستم خنک‌کننده، سطح مایع و عملکرد فن بررسی شود.'});
  if((live.voltage??13)<11.5) alerts.push({severity:'medium',title:'ولتاژ پایین',detail:'باتری و دینام بررسی شود.'});
  dtcs.forEach(d=>alerts.push({severity:d.kind==='PERMANENT'?'high':'medium',title:`کد ${d.code}`,detail:d.description||'برای تشخیص قطعی، داده زنده و شرایط وقوع خطا بررسی شود.'}));
  const score=Math.max(0,100-alerts.reduce((n,a)=>n+(a.severity==='high'?20:9),0));
  return {reportId:crypto.randomUUID(),generatedAt:new Date().toISOString(),vehicle:input.vehicle||null,score,summary:alerts.length?'موارد نیازمند بررسی پیدا شد.':'در داده ارسال‌شده هشدار مهمی یافت نشد.',alerts,recommendations:['پیش از تعویض قطعه، سیم‌کشی و داده زنده بررسی شود.','پاک‌کردن کد به‌تنهایی تعمیر محسوب نمی‌شود.'],source:'ECU Pulse analysis rules v0.9'};
}
function pdfBuffer(report){
  const lines=[`ECU Pulse Diagnostic Report`,`Report: ${report.reportId}`,`Score: ${report.score}/100`,`Generated: ${report.generatedAt}`,report.summary,...report.alerts.map(a=>`- [${a.severity}] ${a.title}: ${a.detail}`)];
  const escaped=lines.map(x=>String(x).replace(/[()\\]/g,'\\$&')).slice(0,35);
  let y=800; const text=escaped.map(x=>`BT /F1 11 Tf 50 ${y-=20} Td (${x.slice(0,110)}) Tj ET`).join('\n');
  const objs=[]; const add=s=>{objs.push(s);return objs.length};
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const stream=add(`<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`);
  const page=add(`<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${stream} 0 R >>`);
  const pages=add(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
  const catalog=add(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
  let out='%PDF-1.4\n'; const offsets=[0]; objs.forEach((o,i)=>{offsets.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${o}\nendobj\n`});
  const xref=Buffer.byteLength(out);out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;out+=`trailer << /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out,'latin1');
}
function serveStatic(req,res,pathname){
  const rel=pathname==='/'?'admin/index.html':pathname.replace(/^\/admin\/?/,'admin/');
  const target=path.resolve(PUBLIC,rel); if(!target.startsWith(PUBLIC)||!fs.existsSync(target)||fs.statSync(target).isDirectory())return false;
  const ext=path.extname(target); const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
  const data=fs.readFileSync(target);res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','content-length':data.length});res.end(data);return true;
}

const server=http.createServer(async(req,res)=>{
  applyCors(req,res); if(req.method==='OPTIONS'){res.writeHead(204);return res.end()} if(limited(req,res))return;
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`); const p=url.pathname;
  try{
    if(req.method==='GET'&&p==='/health')return send(res,200,{ok:true,service:'ecu-pulse-analysis',version:'0.9.0',time:new Date().toISOString()});
    if(req.method==='POST'&&p==='/api/v1/auth/exchange'){
      const x=await body(req); const client=readJson('api-clients.json').find(c=>c.id===x.clientId&&c.active); if(!client)return send(res,403,{error:{code:'CLIENT_DENIED',title:'کلاینت مجاز نیست'}});
      let ent=entitlementFor(x.installationId); let plan=ent?.plan||'free';
      if(x.devMode&&ALLOW_DEV_AUTH)plan=x.requestedPlan==='pro'?'pro':'free';
      // Production adapters must validate Play Integrity / Bazaar / Myket receipt before granting Pro.
      const scopes=client.scopes; return send(res,200,{accessToken:signToken({sub:x.installationId,clientId:client.id,plan,scopes,store:x.store||'unknown',entitlementUntil:ent?.until?Date.parse(ent.until):null},900),plan,expiresIn:900});
    }
    if(req.method==='POST'&&p==='/api/v1/admin/login'){
      const x=await body(req); if(!safeEqual(x.password||'',ADMIN_PASSWORD))return send(res,401,{error:{code:'BAD_LOGIN',title:'رمز عبور نادرست است'}}); return send(res,200,{accessToken:signToken({admin:true,scopes:['admin']},3600)});
    }
    if(req.method==='GET'&&p==='/api/v1/offers'){
      const t=auth(req,res,'offers:read');if(!t)return;return send(res,200,{plan:t.plan,offers:readJson('offers.json').filter(x=>x.active).map(({products,...x})=>x)});
    }
    if(req.method==='POST'&&p==='/api/v1/coupons/quote'){
      const t=auth(req,res,'offers:read');if(!t)return;const x=await body(req);const q=quoteCoupon(x.code,x.offerId,x.store||t.store);return send(res,200,q);
    }
    if(req.method==='GET'&&p==='/api/v1/entitlements/me'){
      const t=auth(req,res,'entitlement:read');if(!t)return;const ent=entitlementFor(t.sub);return send(res,200,{plan:t.plan,pro:isPro(t),clearDtcLimit:t.plan==='pro'?-1:5,clearDtcUsed:ent?.clearDtcUsed||0});
    }
    if(req.method==='POST'&&p==='/api/v1/actions/dtc-clear/authorize'){
      const t=auth(req,res,'actions:write');if(!t)return;const ent=entitlementFor(t.sub);const used=ent?.clearDtcUsed||0;if(t.plan!=='pro'&&used>=5)return send(res,402,{error:{code:'FREE_CLEAR_LIMIT',title:'سقف پنج پاک‌کردن رایگان تمام شده است'}});
      const actionToken=signToken({sub:t.sub,action:'clear_dtc',plan:t.plan,used,scopes:['action:complete']},120);return send(res,200,{authorized:true,actionToken,remaining:t.plan==='pro'?-1:Math.max(0,5-used)});
    }
    if(req.method==='POST'&&p==='/api/v1/actions/dtc-clear/complete'){
      const t=verifyToken(bearer(req));if(!t||t.action!=='clear_dtc'||!t.scopes?.includes('action:complete'))return send(res,401,{error:{code:'ACTION_TOKEN_INVALID',title:'مجوز عملیات نامعتبر یا منقضی است'}});const x=await body(req);if(x.success){const all=readJson('entitlements.json');let ent=all.find(e=>e.installationId===t.sub);if(!ent){ent={installationId:t.sub,plan:'free',active:true,clearDtcUsed:0};all.push(ent)}ent.clearDtcUsed=(ent.clearDtcUsed||0)+1;writeJson('entitlements.json',all)}return send(res,200,{recorded:true});
    }
    if(req.method==='POST'&&p==='/api/v1/analyze'){
      const t=auth(req,res,'analysis:write');if(!t)return;if(!isPro(t))return send(res,402,{error:{code:'PRO_REQUIRED',title:'نسخه پیشرفته لازم است'}});const report=analyze(await body(req));return send(res,200,report);
    }
    if(req.method==='POST'&&p==='/api/v1/reports/pdf'){
      const t=auth(req,res,'analysis:write');if(!t)return;if(!isPro(t))return send(res,402,{error:{code:'PRO_REQUIRED',title:'نسخه پیشرفته لازم است'}});const report=await body(req);const pdf=pdfBuffer(report);res.writeHead(200,{'content-type':'application/pdf','content-length':pdf.length,'content-disposition':`attachment; filename="ecu-pulse-${report.reportId||Date.now()}.pdf"`});return res.end(pdf);
    }
    if(req.method==='POST'&&p==='/api/v1/errors/report'){
      const t=auth(req,res,'errors:write');if(!t)return;const x=await body(req);const items=readJson('error-reports.json');const item={id:crypto.randomUUID(),receivedAt:new Date().toISOString(),installationId:t.sub,appVersion:x.appVersion,platform:x.platform,code:x.code||'UNKNOWN',title:x.title||'خطای ناشناخته',detail:String(x.detail||'').slice(0,2000),context:x.context||{},status:'new'};items.push(item);writeJson('error-reports.json',items.slice(-5000));return send(res,202,{accepted:true,id:item.id});
    }
    if(req.method==='GET'&&p==='/api/v1/admin/state'){
      if(!adminAuth(req,res))return;return send(res,200,{offers:readJson('offers.json'),coupons:readJson('coupons.json'),clients:readJson('api-clients.json'),entitlements:readJson('entitlements.json'),errors:readJson('error-reports.json').slice(-100).reverse()});
    }
    if(req.method==='PUT'&&p.startsWith('/api/v1/admin/')){
      if(!adminAuth(req,res))return;const name=p.split('/').pop();const allowed={offers:'offers.json',coupons:'coupons.json',clients:'api-clients.json',entitlements:'entitlements.json'};if(!allowed[name])return send(res,404,{error:{code:'NOT_FOUND'}});const x=await body(req);if(!Array.isArray(x.items))return send(res,400,{error:{code:'ARRAY_REQUIRED'}});writeJson(allowed[name],x.items);return send(res,200,{saved:true,count:x.items.length});
    }
    if((p==='/'||p.startsWith('/admin'))&&serveStatic(req,res,p))return;
    return send(res,404,{error:{code:'NOT_FOUND',title:'مسیر پیدا نشد'}});
  }catch(e){console.error(e);send(res,e.status||500,{error:{code:e.code||'UNKNOWN_SERVER_ERROR',title:e.status<500?'درخواست نامعتبر':'خطای ناشناخته سرور',detail:e.message,requestId:crypto.randomUUID()}})}
});
server.listen(PORT,HOST,()=>console.log(`ECU Pulse server listening on http://${HOST}:${PORT}`));
