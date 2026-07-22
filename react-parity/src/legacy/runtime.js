'use strict';
/* ========================= APP CORE ========================= */
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const APP_VERSION='0.13.0';
const DEV_PRO_CODE='1234';
const THEME_CYCLE=['mydiag','dark','ivory','eps-neon','eps-color','eps-mobile','eps-industrial'];
const hasSavedVehicle=localStorage.getItem('ecuVehicle')!==null;

const state={
  data:null,tiers:null,logos:null,demo:null,
  plan:localStorage.getItem('ecuDevProUnlocked')==='true'?'pro':'free',
  theme:localStorage.getItem('ecuTheme')||'dark',
  vehicleIndex:Number(localStorage.getItem('ecuVehicle')||0),
  demoMode:localStorage.getItem('ecuDemoMode')!==null?localStorage.getItem('ecuDemoMode')==='true':!hasSavedVehicle,
  customLogo:localStorage.getItem('ecuCustomLogo')||'',
  mockTimer:null,demoTick:0,
  live:{rpm:0,speedKph:0,coolantC:null,voltage:null,engineLoad:null},
  dtcs:[],errors:JSON.parse(localStorage.getItem('ecuErrors')||'[]'),
  token:null,tokenExp:0,offers:[],lastReport:null,
  trip:{watchId:null,startedAt:0,points:[],replayTimer:null,replayFrame:null,replayIndex:0,replaySpeed:1,paused:false,currentTrip:null,projection:null,currentHeading:0},
  map:null,mapLoading:null,routeLine:null,replayMarker:null,stopMarkers:[],activeApi:null
};
const installationId=localStorage.getItem('ecuInstallationId')||crypto.randomUUID();
localStorage.setItem('ecuInstallationId',installationId);
document.documentElement.dataset.theme=state.theme;

/* ========================= FAULTS & ERRORS ========================= */
class AppFault extends Error{constructor(code,title,detail,context={}){super(detail||title);this.name='AppFault';this.code=code;this.title=title;this.detail=detail||title;this.context=context}}
function sanitize(x){const clone=JSON.parse(JSON.stringify(x||{}));for(const k of Object.keys(clone))if(/token|password|secret|vin/i.test(k))clone[k]='[REDACTED]';return clone}
function persistErrors(){localStorage.setItem('ecuErrors',JSON.stringify(state.errors.slice(-100)))}
function reportError(error,context={},show=true){
  if(error?.name==='AbortError')return null;
  const fault=error instanceof AppFault?error:new AppFault(error?.code||'UNKNOWN_ERROR','خطای ناشناخته',`${error?.name||'Error'}: ${error?.message||String(error)}`,context);
  const item={id:crypto.randomUUID(),at:new Date().toISOString(),code:fault.code,title:fault.title,detail:fault.detail,context:sanitize({...context,...fault.context}),sent:false,platform:'web',appVersion:APP_VERSION};
  state.errors.push(item);persistErrors();renderErrors();if(show)showError(item);console.error('[ECU Pulse]',item);return item
}
window.addEventListener('error',e=>reportError(e.error||new Error(e.message),{file:e.filename,line:e.lineno},true));
window.addEventListener('unhandledrejection',e=>reportError(e.reason||new Error('Unhandled rejection'),{source:'promise'},true));

/* ========================= TOAST & DIALOG ========================= */
function toast(text){const n=$('#toast');n.textContent=text;n.classList.add('show');setTimeout(()=>n.classList.remove('show'),2000)}
function fa(v){return String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d])}
function openErrorDialog(){$('#errorDialog').hidden=false;$('#errorDialog').setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('#dismissError')?.focus())}
function closeErrorDialog(){$('#errorDialog').hidden=true;$('#errorDialog').setAttribute('aria-hidden','true')}
function showError(item){$('#errorCode').textContent=item.code||'UNKNOWN_ERROR';$('#errorTitle').textContent=item.title||'خطای ناشناخته';$('#errorDetail').textContent=item.detail||'جزئیات بیشتری از خطا دریافت نشد.';$('#sendError').onclick=()=>sendError(item.id);openErrorDialog()}
$('#dismissError').onclick=closeErrorDialog;
$('#errorDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)closeErrorDialog()});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#errorDialog').hidden)closeErrorDialog()});

/* ========================= API ========================= */
async function fetchTimeout(url,opt={},timeout=10000,retries=1){
  let last;
  for(let i=0;i<=retries;i++){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{const r=await fetch(url,{...opt,signal:controller.signal});clearTimeout(timer);if(!r.ok){let j={};try{j=await r.json()}catch{}throw new AppFault(j.error?.code||`HTTP_${r.status}`,j.error?.title||'خطای ارتباط با سرور',j.error?.detail||`${r.status} ${r.statusText}`,{url})}return r}
    catch(e){clearTimeout(timer);last=e;if(i<retries)await new Promise(r=>setTimeout(r,500*2**i))}
  }
  throw last
}
function apiBases(){const local=localStorage.getItem('ecuLocalApi')||'http://127.0.0.1:4030',remote=localStorage.getItem('ecuRemoteApi')||'https://diageman.ir';return [...new Set([$('#apiBase')?.value,local,remote].filter(Boolean).map(x=>x.replace(/\/$/,'')))]}
async function ensureToken(force=false){
  if(!force&&state.token&&Date.now()<state.tokenExp)return state.token;
  let last;
  for(const base of apiBases()){
    try{const r=await fetchTimeout(`${base}/api/v1/auth/exchange`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clientId:'ecu-pulse-web',installationId,store:'web',devMode:true,requestedPlan:state.plan})},6000,0);const x=await r.json();state.token=x.accessToken;state.tokenExp=Date.now()+(x.expiresIn-30)*1000;state.activeApi=base;return state.token}catch(e){last=e}
  }
  throw last||new AppFault('API_OFFLINE','سرور در دسترس نیست','هیچ‌کدام از آدرس‌های API پاسخ ندادند.')
}
async function api(path,opt={}){const token=await ensureToken();const base=state.activeApi||apiBases()[0];return fetchTimeout(`${base}${path}`,{...opt,headers:{'content-type':'application/json',authorization:`Bearer ${token}`,...opt.headers}},10000,1)}

/* ========================= NAVIGATION ========================= */
function go(page){
  $$('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  $$('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  const meta={mydiag:['SMART VEHICLE','خانه خودرو'],drivingstyle:['DRIVING STYLE','سبک رانندگی'],parking:['PARKING MEMORY','محل پارک'],dashcam:['DASHCAM','دوربین خودرو'],dashboard:['LIVE VEHICLE','داشبورد خودرو'],vehicles:['VEHICLE PROFILE','انتخاب خودرو'],trips:['GPS TRIP LOGGER','سفرها'],analysis:['DIAGEMAN API','تحلیل ماشین من'],procenter:['ADVANCED CENTER','مرکز نسخه پیشرفته'],store:['UPGRADE','خرید و فعال‌سازی'],errors:['FAULT CENTER','خطا و پشتیبانی'],scanner:['ELM327 CONSOLE','اسکنر و کنسول ECU'],settings:['SETTINGS','تنظیمات']};
  const selected=meta[page]||meta.dashboard;$('#eyebrow').textContent=selected[0];$('#title').textContent=selected[1];
  $('aside').classList.remove('open');
  if(page==='trips')setTimeout(async()=>{await initMap();previewSelectedTrip();state.map?.invalidateSize?.(true)},80);
  if(page==='store')loadOffers();
  if(page==='mydiag')syncMyDiagHome();
}
$$('button[data-page], [role="button"][data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
$$('.mydiag-menu-card[data-target]').forEach(b=>b.onclick=()=>{go(b.dataset.target);if(b.dataset.anchor)setTimeout(()=>document.getElementById(b.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'center'}),120)});
$$('.mydiag-menu-card[data-special]').forEach(b=>b.onclick=()=>go(b.dataset.special.replace('-','')));
$('#menuBtn').onclick=()=>$('aside').classList.toggle('open');

/* ========================= THEME ========================= */
function applyTheme(v){
  state.theme=THEME_CYCLE.includes(v)?v:'dark';
  document.documentElement.dataset.theme=state.theme;
  localStorage.setItem('ecuTheme',state.theme);
  if($('#themeSelect'))$('#themeSelect').value=state.theme;
}
$('#themeBtn').onclick=()=>{const i=THEME_CYCLE.indexOf(state.theme);applyTheme(THEME_CYCLE[(i+1)%THEME_CYCLE.length])};

/* ========================= BRAND RULES ========================= */
const brandRules=[
  ['parskhodro',/پارس.?خودرو/],['ikcodiesel',/ایران.?خودرو دیزل/],['bahmandiesel',/بهمن دیزل/],
  ['fownix',/فونیکس|FOWNIX|تیگو 7|تیگو 8|FX/],['mvm',/MVM|X22|X33|X55|آریزو/],['modirankhodro',/مدیران خودرو/],
  ['kmc',/KMC/],['jac',/جک|JAC/],['kermanmotor',/کرمان موتور/],['lamari',/آرین پارس|لاماری/],
  ['farda',/فردا موتور|FMC|SUBA/],['diar',/دیار خودرو/],['mammut',/ماموت خودرو/],['zamyad',/زامیاد|پادرا|کارون/],
  ['bahman',/بهمن موتور|فیدلیتی|دیگنیتی|ریسپکت|کاپرا/],['ikco',/ایران.?خودرو|رانا|سمند|سورن|دنا|تارا|ری.?را/],
  ['saipa',/سایپا|پراید|تیبا|ساینا|کوییک|اطلس|شاهین/],['lexus',/لکسوس|Lexus|RX|NX/],['audi',/آئودی|Audi|A3|A4|Q5/],
  ['skoda',/اشکودا|اوکتاویا/],['volkswagen',/فولکس|Volkswagen|گلف|پاسات|تیگوان/],['citroen',/سیتروئن|C3|C5/],
  ['peugeot',/پژو|Peugeot|۲۰۶|۲۰۷|۳۰۱|۲۰۰۸/],['renault',/رنو|Renault|تندر|ساندرو|لوگان|داستر|کپچر|مگان/],
  ['mercedesbenz',/مرسدس|بنز|Actros|Axor|Atego/],['bmw',/BMW|ب.?ام.?و/],['mini',/MINI/],
  ['toyota',/تویوتا|Toyota|کرولا|کمری|پریوس|RAV4|لندکروزر|هایلوکس/],
  ['hyundaicommercial',/هیوندای تجاری|HD65|HD78|Xcient/],['hyundai',/هیوندای|Hyundai|اکسنت|النترا|سوناتا|آزرا|توسان|سانتافه/],
  ['kia',/کیا|Kia|ریو|سراتو|اپتیما|اسپورتیج|سورنتو/],['nissan',/نیسان|Nissan|ماکسیما|مورانو|قشقایی|جوک|تیانا/],
  ['mitsubishi',/میتسوبیشی|Mitsubishi|لنسر|اوتلندر|پاجرو/],['mazda',/مزدا|Mazda/],['suzuki',/سوزوکی|Suzuki|ویتارا/],
  ['honda',/هوندا|Honda|سیویک|آکورد/],['opel',/اوپل|Opel|آسترا|کورسا/],['ford',/فورد|Ford/],['chevrolet',/شورولت|Chevrolet/],
  ['subaru',/سابارو|Subaru/],['mg',/(^|\s)MG/],['geely',/جیلی|Geely/],['changan',/چانگان|Changan/],['byd',/BYD/],
  ['haval',/هاوال|Haval/],['greatwall',/گریت.?وال|وینگل|Great Wall/],['dongfeng',/دانگ.?فنگ|Dongfeng/],['faw',/فاو|FAW|بسترن|Bestune/],
  ['brilliance',/برلیانس|Brilliance/],['baic',/BAIC/],['scania',/اسکانیا|Scania/],['volvotrucks',/ولوو تراکس|FH|FMX/],
  ['volvo',/ولوو|Volvo/],['isuzu',/ایسوزو|Isuzu/],['iveco',/ایویکو|Iveco/],['daf',/داف|DAF/],
  ['man',/(^|\s)مان(\s|$)|MAN|TGX|TGS/],['foton',/فوتون|آومان|Foton|Auman/],['shacman',/شاکمن|Shacman/],
  ['kamaz',/کاماز|Kamaz/],['dayun',/دایون|Dayun/],['generic',/.*/]
];
function brandKey(v){const text=`${v?.make||''} ${v?.model||''}`;return brandRules.find(x=>x[1].test(text))?.[0]||'generic'}
function logoPath(v){const key=brandKey(v);return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="var(--panel)"/><text x="50" y="56" text-anchor="middle" font-size="14" fill="var(--text)" font-weight="bold">${v?.make?.slice(0,8)||'?'}</text></svg>`)}`}
function logoSrc(v){return state.customLogo||logoPath(v)}

function activeVehicle(){return state.demoMode?state.demo?.vehicle:(state.data?.vehicles?.[state.vehicleIndex]||availableVehicles()[0])}
function availableVehicles(){const all=state.data.vehicles.map((v,index)=>({...v,index}));if(state.plan==='pro')return all;const allow=new Set(state.tiers.freeVehicleIndexes);return all.filter(v=>allow.has(v.index)&&v.segment==='passenger')}

function syncDemoButtons(){const primary=state.mockTimer?'توقف دمو':state.demoMode?'اجرای دوباره دمو':'شروع دمو';$('#mockToggle').textContent=primary;const start=$('#activateDemo');if(start)start.textContent=state.demoMode?'اجرای دوباره دمو':'شروع دمو'}
function activeLogo(v){return state.customLogo||logoPath(v)}

/* ========================= VEHICLES RENDER ========================= */
function renderVehicles(){
  const list=availableVehicles(),makes=[...new Set(list.map(v=>v.make))];
  $('#makeSelect').innerHTML=makes.map(x=>`<option>${x}</option>`).join('');
  const current=state.data.vehicles[state.vehicleIndex];
  if(makes.includes(current?.make))$('#makeSelect').value=current.make;
  renderModels();
  const demoCard=state.demo?`<article class="vehicle-card demo-card ${state.demoMode?'selected':''}" data-demo="true"><img src="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#e5e7eb"/><text x="50" y="60" text-anchor="middle" font-size="30" fill="#374151" font-weight="bold">?</text></svg>')}"><strong>${state.demo.vehicle.model}</strong><small>بدون اتصال واقعی</small></article>`:'';
  $('#vehicleGrid').innerHTML=demoCard+list.map(v=>`<article class="vehicle-card ${!state.demoMode&&v.index===state.vehicleIndex?'selected':''}" data-index="${v.index}"><img src="${logoPath(v)}"><strong>${v.model}</strong><small>${v.make}</small></article>`).join('');
  $$('.vehicle-card[data-index]').forEach(c=>c.onclick=()=>{$('#makeSelect').value=state.data.vehicles[c.dataset.index].make;renderModels();$('#modelSelect').value=c.dataset.index});
  document.querySelector('.demo-card')?.addEventListener('click',activateDemo);
  syncDemoButtons()
}
function renderModels(){const list=availableVehicles().filter(v=>v.make===$('#makeSelect').value);$('#modelSelect').innerHTML=list.map(v=>`<option value="${v.index}">${v.model}</option>`).join('');if(!state.demoMode&&list.some(v=>v.index===state.vehicleIndex))$('#modelSelect').value=state.vehicleIndex}
$('#makeSelect').onchange=renderModels;
$('#activateVehicle').onclick=()=>{state.vehicleIndex=Number($('#modelSelect').value);state.demoMode=false;state.customLogo='';localStorage.removeItem('ecuCustomLogo');localStorage.setItem('ecuVehicle',state.vehicleIndex);localStorage.setItem('ecuDemoMode','false');stopDemo();renderActiveVehicle();renderVehicles();toast('پروفایل خودرو و لوگوی کارخانه فعال شد')};

function renderActiveVehicle(){
  const v=activeVehicle();if(!v)return;
  $('#vehicleName').textContent=`${v.make} ${v.model}`;
  $('#vehicleProtocol').textContent=(v.protocols||[]).join(' · ')||v.profile;
  const hero=$('#vehicleLogo');hero.onerror=()=>{hero.onerror=null;hero.src=logoPath(v)};
  hero.src=logoSrc(v);
  $('#demoBadge').hidden=!state.demoMode;$('#dataModeLabel').textContent=state.demoMode?'داده آزمایشی':'داده خودرو';
  syncDemoButtons()
}
$('#logoInput').onchange=e=>{const file=e.target.files[0];if(!file)return;if(file.size>1024*1024)return reportError(new AppFault('LOGO_TOO_LARGE','فایل لوگو بزرگ است','حداکثر اندازه لوگوی سفارشی یک مگابایت است.'));const r=new FileReader();r.onload=()=>{state.customLogo=r.result;localStorage.setItem('ecuCustomLogo',state.customLogo);renderActiveVehicle()};r.readAsDataURL(file)};

/* ========================= GAUGE / LIVE DATA ========================= */
function setNeedle(id,value,max,minAngle=-135,maxAngle=135){
  const needle=document.getElementById(id);if(!needle)return;
  const pct=Math.max(0,Math.min(1,value/max));
  const angle=minAngle+(maxAngle-minAngle)*pct;
  needle.setAttribute('transform',`rotate(${angle},140,240)`);
  const arc=document.getElementById(id==='speedNeedle'?'speedArc':'rpmArc');
  if(arc){const circ=2*Math.PI*120*.5;arc.setAttribute('stroke-dashoffset',circ-circ*pct)}
}
function renderLive(){
  const l=state.live;
  $('#speedValue').textContent=`${fa(Math.round(l.speedKph||0))} km/h`;
  $('#rpmValue').textContent=`${fa(Math.round(l.rpm||0))} rpm`;
  $('#coolant').textContent=l.coolantC==null?'--':`${fa(l.coolantC)} °C`;
  $('#voltage').textContent=l.voltage==null?'--':`${fa(l.voltage.toFixed(1))} V`;
  $('#engineLoad').textContent=l.engineLoad==null?'--':`${fa(Math.round(l.engineLoad))}٪`;
  $('#fuelUse').textContent=l.speedKph>5?`${fa((5.5+l.engineLoad/20).toFixed(1))} L/100`:'--';
  setNeedle('speedNeedle',l.speedKph,220);setNeedle('rpmNeedle',l.rpm,7000);
}
function demoSnapshot(tick){
  const phase=(tick%112)/112,drive=Math.sin(phase*Math.PI);
  const stop=(tick%42>30&&tick%42<37);
  const speed=stop?0:Math.max(0,8+104*Math.pow(Math.max(0,drive),1.25)+8*Math.sin(phase*Math.PI*7));
  const rpm=stop?780:820+speed*22+420*Math.abs(Math.sin(phase*Math.PI*9));
  return{rpm,speedKph:speed,coolantC:82+Math.round(12*Math.min(1,tick/80)),voltage:13.5+0.35*Math.sin(phase*Math.PI*4),engineLoad:18+Math.min(54,speed*.42+18*Math.abs(Math.sin(phase*Math.PI*5)))}
}
function startDemo(){state.demoMode=true;localStorage.setItem('ecuDemoMode','true');if(state.mockTimer)clearInterval(state.mockTimer);state.demoTick=0;const step=()=>{state.live=demoSnapshot(state.demoTick++);renderLive()};step();state.mockTimer=setInterval(step,state.demo?.scenario?.sampleIntervalMs||800);renderActiveVehicle();renderVehicles();syncDemoButtons();seedDemoTrip()}
function stopDemo(){if(state.mockTimer){clearInterval(state.mockTimer);state.mockTimer=null}syncDemoButtons()}
function activateDemo(){state.customLogo='';localStorage.removeItem('ecuCustomLogo');startDemo();toast('پروفایل نمایشی فعال شد')}
$('#activateDemo').onclick=activateDemo;$('#mockToggle').onclick=()=>state.mockTimer?stopDemo():startDemo();

/* ========================= DTC ========================= */
$('#readDtcBtn').onclick=()=>{state.dtcs=(state.demoMode?state.demo.scenario.dtcs:[{code:'P0133',kind:'STORED',description:'پاسخ کند سنسور اکسیژن بانک ۱'},{code:'P0420',kind:'PENDING',description:'بازده کاتالیست پایین‌تر از آستانه'}]).map(x=>({...x}));renderDtcs()};
function renderDtcs(){$('#dtcList').innerHTML=state.dtcs.length?state.dtcs.map(x=>`<article class="dtc-item"><strong>${x.code}</strong><p>${x.description}<br>${x.kind}</p></article>`).join(''):'<p class="note">هنوز کدی خوانده نشده است.</p>'}
async function clearDtcs(){if(!state.dtcs.length)return toast('خطایی برای پاک‌کردن وجود ندارد');if(!confirm('موتور خاموش و سوییچ باز است؟'))return;if(state.demoMode){await new Promise(r=>setTimeout(r,450));state.dtcs=[];renderDtcs();return toast('خطاهای دمو پاک شدند')}try{const a=await api('/api/v1/actions/dtc-clear/authorize',{method:'POST',body:'{}'}).then(r=>r.json());await new Promise(r=>setTimeout(r,500));state.dtcs=[];renderDtcs();await fetchTimeout(`${state.activeApi}/api/v1/actions/dtc-clear/complete`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${a.actionToken}`},body:JSON.stringify({success:true})});toast('خطاها پاک شدند');await refreshEntitlement()}catch(e){reportError(e,{feature:'clear-dtc'})}}
$('#clearDtcBtn').onclick=clearDtcs;
async function refreshEntitlement(){try{const x=await api('/api/v1/entitlements/me').then(r=>r.json());const left=x.clearDtcLimit<0?'نامحدود':Math.max(0,x.clearDtcLimit-x.clearDtcUsed);$('#clearQuota').textContent=x.pro?'نسخه پیشرفته: نامحدود':`نسخه رایگان: ${fa(left)} بار باقی مانده`;$('#clearQuotaSide').textContent=x.pro?'پاک‌کردن نامحدود':`${fa(left)} پاک‌کردن باقی مانده`}catch(e){$('#clearQuota').textContent='برای بررسی سهمیه، سرور را اجرا کن'}}

/* ========================= TRIPS ========================= */
function seedDemoTrip(){
  if(!state.demo?.demoTrip)return;
  const demo=state.demo.demoTrip,key=`ecuDemoTripSeeded:${demo.id}`;
  if(localStorage.getItem(key)==='1'&&trips().some(x=>x.id===demo.id))return;
  const now=Date.now()-(demo.points.at(-1)?.offsetSeconds||0)*1000;
  const points=demo.points.map(p=>({lat:p.lat,lon:p.lon,t:now+p.offsetSeconds*1000,speed:p.speedKph,accuracy:6,rpm:p.rpm,label:p.label||null,stop:!!p.stop}));
  const all=trips().filter(x=>!x.demo);
  all.push({id:demo.id,titleFa:demo.titleFa,descriptionFa:demo.descriptionFa,startedAt:now,endedAt:now+(points.at(-1)?.t-now||0),points,demo:true,stops:demo.stops||[],checkpoints:demo.checkpoints||[]});
  saveTrips(all);localStorage.setItem(key,'1')
}
function trips(){return JSON.parse(localStorage.getItem('ecuTrips')||'[]')}
function saveTrips(x){localStorage.setItem('ecuTrips',JSON.stringify(x.slice(-100)));renderTripSelect()}
function hav(a,b){const r=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180;const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*r*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function startTrip(){if(!navigator.geolocation)return reportError(new AppFault('GEO_UNAVAILABLE','موقعیت مکانی پشتیبانی نمی‌شود','مرورگر Geolocation API ندارد.'));state.trip.startedAt=Date.now();state.trip.points=[];$('#startTrip').disabled=true;$('#stopTrip').disabled=false;state.trip.watchId=navigator.geolocation.watchPosition(pos=>{const p={lat:pos.coords.latitude,lon:pos.coords.longitude,t:pos.timestamp,speed:Math.max(0,(pos.coords.speed||0)*3.6),accuracy:pos.coords.accuracy,rpm:state.live.rpm||0};if(p.accuracy>100)return;state.trip.points.push(p);updateTripStats(state.trip.points);drawRoute(state.trip.points,true)},e=>reportError(new AppFault(`GEO_${e.code}`,'خطای موقعیت مکانی',e.message,{permission:e.code===1}),{feature:'trip'}),{enableHighAccuracy:true,maximumAge:3000,timeout:15000})}
function stopTrip(){if(state.trip.watchId!=null)navigator.geolocation.clearWatch(state.trip.watchId);state.trip.watchId=null;$('#startTrip').disabled=false;$('#stopTrip').disabled=true;if(state.trip.points.length<2)return toast('نقطه کافی ثبت نشد');const all=trips();all.push({id:crypto.randomUUID(),startedAt:state.trip.startedAt,endedAt:Date.now(),points:state.trip.points});saveTrips(all);toast('سفر ذخیره شد')}
$('#startTrip').onclick=startTrip;$('#stopTrip').onclick=stopTrip;

function tripSummary(points){let distance=0,moving=0,stopped=0,max=0;for(let i=1;i<points.length;i++){const dt=Math.max(0,(points[i].t-points[i-1].t)/1000),d=hav(points[i-1],points[i]);if(d<1000)distance+=d;const speed=points[i].speed||d/dt*3.6||0;max=Math.max(max,speed);if(speed<2)stopped+=dt;else moving+=dt}return{distance,moving,stopped,max}}
function time(sec){const m=Math.floor(sec/60),s=Math.floor(sec%60);return `${fa(String(m).padStart(2,'0'))}:${fa(String(s).padStart(2,'0'))}`}
function updateTripStats(points){const x=tripSummary(points);$('#tripDistance').textContent=`${fa((x.distance/1000).toFixed(2))} km`;$('#tripMoving').textContent=time(x.moving);$('#tripStopped').textContent=time(x.stopped);$('#tripMaxSpeed').textContent=fa(Math.round(x.max))}
function renderTripSelect(){const all=trips();$('#tripSelect').innerHTML=all.length?all.map(x=>`<option value="${x.id}">${x.titleFa||new Date(x.startedAt).toLocaleString('fa-IR')} · ${fa((tripSummary(x.points).distance/1000).toFixed(1))} km</option>`).join(''):'<option>سفری ذخیره نشده</option>';if(all.length&&!$('#tripSelect').value)$('#tripSelect').value=all.at(-1).id}

/* ========================= MAP ========================= */
const LEAFLET_CDNS=[{js:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',css:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'},{js:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',css:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'},{js:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',css:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'}];
function loadScript(src,timeout=4500){return new Promise((resolve,reject)=>{const s=document.createElement('script'),timer=setTimeout(()=>{s.remove();reject(new Error('timeout'))},timeout);s.src=src;s.async=true;s.onload=()=>{clearTimeout(timer);resolve()};s.onerror=()=>{clearTimeout(timer);s.remove();reject(new Error('load failed'))};document.head.appendChild(s)})}
function loadCss(href){if([...document.styleSheets].some(x=>x.href===href))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
async function ensureLeaflet(){if(window.L)return true;for(const c of LEAFLET_CDNS){try{loadCss(c.css);await loadScript(c.js);if(window.L)return true}catch{}}return false}
async function initMap(){if(state.map)return true;if(state.mapLoading)return state.mapLoading;state.mapLoading=(async()=>{$('#mapStatus').textContent='نقشه آفلاین آماده؛ تلاش برای نقشه آنلاین…';const ok=await ensureLeaflet();if(!ok){$('#mapStatus').textContent='نقشه آنلاین در دسترس نیست';$('#mapProvider').textContent='Offline SVG';return false}try{state.map=L.map('leafletMap',{zoomControl:true,preferCanvas:true}).setView([35.6892,51.389],12);let tileErrors=0;const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap',crossOrigin:true});tiles.on('tileerror',()=>{tileErrors++;if(tileErrors===4){$('#mapStatus').textContent='کاشی‌های آنلاین مسدودند';$('#leafletMap').classList.remove('ready');$('#mapProvider').textContent='Offline SVG'}});tiles.on('load',()=>{$('#leafletMap').classList.add('ready');$('#mapStatus').textContent='نقشه آنلاین و مسیر آفلاین آماده‌اند';$('#mapProvider').textContent='OpenStreetMap + Offline'});tiles.addTo(state.map);setTimeout(()=>{state.map?.invalidateSize?.(true);if(tileErrors===0)$('#leafletMap').classList.add('ready')},250);return true}catch(e){reportError(e,{feature:'map-init'},false);$('#mapStatus').textContent='خطا در نقشه آنلاین';return false}})().finally(()=>state.mapLoading=null);return state.mapLoading}

function tripCarIconHtml(){return `<svg viewBox="0 0 58 58" width="52" height="52"><rect x="6" y="10" width="46" height="30" rx="10" fill="#ff9a54" stroke="#fff" stroke-width="2"/><rect x="12" y="4" width="14" height="14" rx="4" fill="#ffd7ba" stroke="#fff" stroke-width="1.5"/><rect x="42" y="4" width="4" height="10" rx="2" fill="#fff"/><circle cx="16" cy="42" r="7" fill="#0f2030" stroke="#fff" stroke-width="1.5"/><circle cx="42" cy="42" r="7" fill="#0f2030" stroke="#fff" stroke-width="1.5"/></svg>`}
function ensureReplayMarker(lat,lon,angle=0){if(!(state.map&&window.L))return;const position=[lat,lon];if(!state.replayMarker){state.replayMarker=L.marker(position,{icon:L.divIcon({className:'trip-car-div-icon',html:tripCarIconHtml(),iconSize:[52,52],iconAnchor:[26,26]})}).addTo(state.map)}else state.replayMarker.setLatLng(position);const el=state.replayMarker?.getElement?.();el?.style?.setProperty('--car-heading',`${angle}deg`);state.trip.currentHeading=angle}

function projectOffline(points){const minLat=Math.min(...points.map(p=>p.lat)),maxLat=Math.max(...points.map(p=>p.lat)),minLon=Math.min(...points.map(p=>p.lon)),maxLon=Math.max(...points.map(p=>p.lon));const pad=58,w=884,h=504;return points.map(p=>({x:pad+(p.lon-minLon)/(maxLon-minLon||1)*w,y:560-(p.lat-minLat)/(maxLat-minLat||1)*h}))}
function routeHeading(a,b,offset=90){if(!a||!b)return state.trip.currentHeading||0;return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+offset}
function shortestAngle(from,to){return ((to-from+540)%360)-180}
function lerpHeading(from,to,t){return from+shortestAngle(from,to)*t}

function renderOfflineRoute(points,trip=null,trailIndex=points.length-1,markerPoint=null,angle=null){
  if(!points.length)return;
  const routeChanged=state.trip.projectionSource!==points||state.trip.projection?.length!==points.length;
  const xy=routeChanged?projectOffline(points):state.trip.projection;
  if(routeChanged){state.trip.projection=xy;state.trip.projectionSource=points;$('#fallbackRoute').setAttribute('points',xy.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));const g=$('#fallbackStops');g.innerHTML='';(trip?.stops||[]).forEach(s=>{let nearest=0,best=Infinity;points.forEach((p,i)=>{const d=Math.abs(p.lat-s.lat)+Math.abs(p.lon-s.lon);if(d<best){best=d;nearest=i}});const q=xy[nearest];g.innerHTML+=`<circle class="fallback-stop" cx="${q.x}" cy="${q.y}" r="8"/>`;g.innerHTML+=`<text class="fallback-stop-label" x="${q.x+12}" y="${q.y-10}">${s.nameFa||'توقف'}</text>`})}
  const limit=Math.max(1,Math.min(xy.length,trailIndex+1)),trail=xy.slice(0,limit);
  if(markerPoint)trail.push(markerPoint);
  $('#fallbackTrail').setAttribute('points',trail.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  const car=markerPoint||xy[Math.max(0,Math.min(trailIndex,xy.length-1))];
  const heading=angle??routeHeading(xy[Math.max(0,trailIndex-1)],xy[Math.min(xy.length-1,trailIndex+1)]);
  $('#fallbackCar').setAttribute('transform',`translate(${car.x.toFixed(1)} ${car.y.toFixed(1)}) rotate(${heading.toFixed(1)})`);
  state.trip.currentHeading=heading
}
function fitTripMap(points=null,animate=true){const route=points||state.trip.currentTrip?.points||selectedTrip()?.points||state.trip.points;if(!route?.length)return false;if(state.map&&window.L){const bounds=L.latLngBounds(route.map(p=>[p.lat,p.lon]));if(bounds.isValid()){state.map.invalidateSize(false);state.map.fitBounds(bounds,{paddingTopLeft:[42,58],paddingBottomRight:[42,72],maxZoom:13,animate,duration:animate?.45:0});return true}}return false}
function drawRoute(points,fit=false,trip=null,trailIndex=points.length-1){if(!points.length)return;renderOfflineRoute(points,trip,trailIndex);if(state.map&&window.L){const latlngs=points.map(p=>[p.lat,p.lon]);if(state.routeLine)state.routeLine.setLatLngs(latlngs);else state.routeLine=L.polyline(latlngs,{color:'#55dff6',weight:5}).addTo(state.map);const target=latlngs[Math.max(0,Math.min(trailIndex,latlngs.length-1))];ensureReplayMarker(target[0],target[1],state.trip.currentHeading||0);if(fit)fitTripMap(points,false);state.map.invalidateSize(false)}}
function selectedTrip(){return trips().find(x=>x.id===$('#tripSelect').value)}
function previewSelectedTrip(){const trip=selectedTrip();if(!trip)return;stopReplay(false);state.trip.currentTrip=trip;updateTripStats(trip.points);$('#timeline').max=Math.max(0,trip.points.length-1);$('#timeline').value=0;drawRoute(trip.points,true,trip,0);renderStops(trip);updateReplayPoint(0,false)}
function renderStops(trip){$('#stopList').innerHTML=(trip.stops||[]).length?(trip.stops||[]).map(s=>`<article><strong>${s.nameFa||'توقف'}</strong><small>${fa(Math.max(1,Math.round((s.durationSeconds||0)/60)))} دقیقه</small></article>`).join(''):'<p class="note">توقف ثبت‌شده‌ای وجود ندارد.</p>';if(state.map&&window.L){state.stopMarkers.forEach(m=>m.remove());state.stopMarkers=[];(trip.stops||[]).forEach(s=>state.stopMarkers.push(L.marker([s.lat,s.lon]).addTo(state.map).bindPopup(`<b>${s.nameFa||'توقف'}</b><br>${fa(Math.round((s.durationSeconds||0)/60))} دقیقه توقف`)))}}
$('#tripSelect').onchange=previewSelectedTrip;
$('#loadDemoTrip').onclick=()=>{seedDemoTrip();renderTripSelect();const d=trips().find(x=>x.demo);if(d){$('#tripSelect').value=d.id;previewSelectedTrip();toast('سفر نمایشی تهران بارگذاری شد')}};

$$('.speed-buttons button').forEach(b=>b.onclick=()=>{const v=Number(b.dataset.speed);if(state.plan!=='pro'&&v>2)return go('store');state.trip.replaySpeed=v;$$('.speed-buttons button').forEach(x=>x.classList.toggle('active',x===b));if(state.trip.replayTimer||state.trip.replayFrame){stopReplay(false);state.trip.paused=false;replay(false)}});
function stopReplay(resetButton=true){if(state.trip.replayTimer){clearTimeout(state.trip.replayTimer);state.trip.replayTimer=null}if(state.trip.replayFrame){cancelAnimationFrame(state.trip.replayFrame);state.trip.replayFrame=null}if(resetButton)$('#replayTrip').textContent='پخش'}
function updateReplayPoint(index,follow=true){const trip=state.trip.currentTrip||selectedTrip();if(!trip?.points?.length)return;const i=Math.max(0,Math.min(index,trip.points.length-1)),p=trip.points[i];state.trip.replayIndex=i;$('#timeline').value=i;const elapsed=Math.max(0,((p.t||0)-(trip.points[0].t||0))/1000);$('#replayInfo').textContent=`${p.label?`${p.label} · `:''}سرعت ${fa(Math.round(p.speed||p.speedKph||0))} km/h · RPM ${fa(Math.round(p.rpm||0))}${p.stop?' · توقف':''} · زمان ${time(elapsed)}`;const xy=state.trip.projection||projectOffline(trip.points);const current=xy[i],next=xy[Math.min(xy.length-1,i+1)]||current;const angle=routeHeading(current,next);renderOfflineRoute(trip.points,trip,i,null,angle);if(state.map&&window.L){ensureReplayMarker(p.lat,p.lon,angle);if(follow)fitTripMap(trip.points,false)}}
function animateReplaySegment(i){const trip=state.trip.currentTrip||selectedTrip();if(!trip?.points?.length)return;if(i>=trip.points.length-1){updateReplayPoint(trip.points.length-1,false);stopReplay();toast('بازپخش تمام شد');return}const points=trip.points,xy=state.trip.projection||projectOffline(points),from=points[i],to=points[i+1],fromXY=xy[i],toXY=xy[i+1],targetAngle=routeHeading(fromXY,toXY),startAngle=state.trip.currentHeading||targetAngle,started=performance.now(),recordedDelta=Math.max(0,(to.t||0)-(from.t||0)),duration=Math.max(240,Math.min(1600,(recordedDelta||850)/state.trip.replaySpeed));const step=now=>{if(state.trip.paused)return;const t=Math.min(1,(now-started)/duration),marker={x:fromXY.x+(toXY.x-fromXY.x)*t,y:fromXY.y+(toXY.y-fromXY.y)*t},lat=from.lat+(to.lat-from.lat)*t,lon=from.lon+(to.lon-from.lon)*t,speed=(from.speed||0)+((to.speed||0)-(from.speed||0))*t,rpm=(from.rpm||0)+((to.rpm||0)-(from.rpm||0))*t,elapsed=Math.max(0,(((from.t||0)+((to.t||from.t||0)-(from.t||0))*t)-(points[0].t||0))/1000),angle=lerpHeading(startAngle,targetAngle,Math.min(1,t*2.2));state.trip.replayIndex=i;$('#timeline').value=(i+t).toFixed(3);$('#replayInfo').textContent=`${(t<.5?from.label:to.label)?`${t<.5?from.label:to.label} · `:''}سرعت ${fa(Math.round(speed))} km/h · RPM ${fa(Math.round(rpm))}${t>.6&&to.stop?' · توقف':''} · زمان ${time(elapsed)}`;renderOfflineRoute(points,trip,i,marker,angle);if(state.map&&window.L)ensureReplayMarker(lat,lon,angle);if(t<1)state.trip.replayFrame=requestAnimationFrame(step);else{state.trip.replayIndex=i+1;animateReplaySegment(i+1)}};state.trip.replayFrame=requestAnimationFrame(step)}
function replay(fromStart=false){const trip=selectedTrip();if(!trip)return toast('سفری انتخاب نشده');state.trip.currentTrip=trip;if(fromStart||state.trip.replayIndex>=trip.points.length-1)state.trip.replayIndex=0;state.trip.paused=false;stopReplay(false);fitTripMap(trip.points,true);$('#replayTrip').textContent='در حال پخش';animateReplaySegment(Math.floor(state.trip.replayIndex))}
$('#fitTripMap').onclick=()=>{const trip=state.trip.currentTrip||selectedTrip();if(trip?.points?.length)fitTripMap(trip.points,true);else if(state.trip.points.length)fitTripMap(state.trip.points,true);else toast('هنوز مسیری برای نمایش وجود ندارد')};
$('#replayTrip').onclick=()=>replay(false);$('#pauseTrip').onclick=()=>{state.trip.paused=true;stopReplay();$('#replayInfo').textContent+=' · مکث'};
$('#restartTrip').onclick=()=>replay(true);
$('#timeline').oninput=e=>{stopReplay();state.trip.paused=true;updateReplayPoint(Math.round(Number(e.target.value)),false)};
$('#exportTrip').onclick=()=>{const t=selectedTrip();if(!t)return toast('سفری انتخاب نشده');const a=document.createElement('a'),blob=new Blob([JSON.stringify(t,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`ecu-pulse-trip-${t.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)};
$('#deleteTrip').onclick=()=>{const t=selectedTrip();if(!t||t.demo)return toast('سفر نمایشی حذف نمی‌شود');if(!confirm('این سفر حذف شود؟'))return;saveTrips(trips().filter(x=>x.id!==t.id));previewSelectedTrip()};

/* ========================= ANALYSIS ========================= */
function localAnalyze(){const alerts=[];let score=94;for(const d of state.dtcs){score-=d.kind==='PERMANENT'?14:d.kind==='STORED'?10:6;alerts.push({severity:d.kind==='PERMANENT'?'high':'medium',title:`کد ${d.code}`,detail:d.description||'کد خطای ECU نیازمند بررسی مرحله‌ای است.'})}if((state.live.coolantC||0)>105){score-=18;alerts.push({severity:'high',title:'دمای موتور بالا',detail:'دمای آب بالاتر از محدوده عادی مشاهده شد.'})}if(state.live.voltage!=null&&state.live.voltage<12){score-=10;alerts.push({severity:'medium',title:'ولتاژ پایین',detail:'باتری، دینام و اتصالات بررسی شوند.'})}return{reportId:`local-${crypto.randomUUID()}`,generatedAt:new Date().toISOString(),score:Math.max(0,score),summary:alerts.length?'در داده‌های فعلی مواردی برای بررسی پیدا شد.':'در داده‌های فعلی هشدار مهمی مشاهده نشد.',alerts,recommendations:['کدها را همراه Freeze Frame و داده زنده بررسی کنید.','پاک‌کردن کد به‌تنهایی تعمیر محسوب نمی‌شود.'],source:'local-development-analysis-v0.9.0'}}
function renderAnalysis(report){state.lastReport=report;$('#analysisResult').className='report';$('#analysisResult').innerHTML=`<strong class="report-score">${fa(report.score)}</strong><h2>${report.summary}</h2>${(report.alerts||[]).map(a=>`<article><strong>${a.title}</strong><p>${a.detail}</p></article>`).join('')||'<p>هشدار فعالی ثبت نشده است.</p>'}`;$('#analysisSource').textContent=report.source?.startsWith('local')?'تحلیل محلی آزمایشی؛ سرور Node در دسترس نبود.':'تحلیل توسط سرور Diageman دریافت شد.';$('#pdfBtn').disabled=false}
async function analyze(){if(state.plan!=='pro')return go('store');$('#analysisResult').className='report-empty';$('#analysisResult').textContent='در حال تحلیل…';try{const v=activeVehicle();const report=await api('/api/v1/analyze',{method:'POST',body:JSON.stringify({vehicle:v,live:state.live,dtcs:state.dtcs,trip:trips().at(-1)||null})}).then(r=>r.json());renderAnalysis(report)}catch(e){const report=localAnalyze();renderAnalysis(report);reportError(e,{feature:'analysis-server-fallback'},false);toast('سرور در دسترس نبود؛ تحلیل محلی آزمایشی نمایش داده شد')}}
function printLocalReport(report){const w=window.open('','_blank');if(!w)throw new AppFault('POPUP_BLOCKED','پنجره گزارش مسدود شد','اجازه بازشدن پنجره جدید را در مرورگر فعال کنید.');w.document.write(`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>گزارش ECU Pulse</title><style>body{font-family:Tahoma,sans-serif;max-width:850px;margin:40px auto;line-height:1.9;color:#172235}h1{color:#087b96}.score{font-size:52px;font-weight:bold}.item{border:1px solid #ccd5df;border-radius:12px;padding:12px;margin:10px 0}@media print{button{display:none}}</style><h1>گزارش تحلیل ECU Pulse</h1><div class="score">${report.score}/100</div><h2>${report.summary}</h2>${(report.alerts||[]).map(a=>`<div class="item"><b>${a.title}</b><p>${a.detail}</p></div>`).join('')}<p>شناسه: ${report.reportId}</p><button onclick="print()">چاپ / ذخیره PDF</button></html>`);w.document.close()}
$('#analyzeBtn').onclick=analyze;
$('#pdfBtn').onclick=async()=>{if(!state.lastReport)return;try{if(state.lastReport.source?.startsWith('local'))return printLocalReport(state.lastReport);const r=await api('/api/v1/reports/pdf',{method:'POST',body:JSON.stringify(state.lastReport)});const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ecu-pulse-${state.lastReport.reportId}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}catch(e){reportError(e,{feature:'pdf-server'},false);printLocalReport(state.lastReport)}};

/* ========================= STORE ========================= */
async function loadOffers(){try{state.offers=await api('/api/v1/offers').then(r=>r.json()).then(x=>x.offers);$('#offers').innerHTML=state.offers.map(o=>`<article class="offer-card"><strong>${o.titleFa}</strong><span class="price">${fa(o.basePrice.toLocaleString())} ${o.currency}</span><button disabled>خرید از اپ Android</button></article>`).join('');$('#couponOffer').innerHTML=state.offers.map(o=>`<option value="${o.id}">${o.titleFa}</option>`).join('')}catch(e){reportError(e,{feature:'offers'},false);$('#offers').innerHTML='<p class="note">سرور فروش در دسترس نیست.</p>'}}
$('#applyCoupon').onclick=async()=>{try{const q=await api('/api/v1/coupons/quote',{method:'POST',body:JSON.stringify({code:$('#couponCode').value,offerId:$('#couponOffer').value,store:'googlePlay'})}).then(r=>r.json());$('#quoteResult').innerHTML=`تخفیف ${fa(q.percent)}٪ · مبلغ نهایی سرور: <strong>${fa(q.finalPrice.toLocaleString())} ${q.currency}</strong> · اعتبار تا ${new Date(q.expiresAt).toLocaleTimeString('fa-IR')}`}catch(e){reportError(e,{feature:'coupon'})}};

/* ========================= ERRORS ========================= */
function renderErrors(){$('#errorList').innerHTML=state.errors.length?[...state.errors].reverse().map(e=>`<article class="error-card"><strong>${e.code} — ${e.title}</strong><small> · ${new Date(e.at).toLocaleString('fa-IR')} · ${e.sent?'ارسال شد':'محلی'}</small><p>${e.detail}</p><button data-error="${e.id}">ارسال به سرور</button></article>`).join(''):'<p class="note">خطایی ثبت نشده است.</p>';$$('[data-error]').forEach(b=>b.onclick=()=>sendError(b.dataset.error))}
async function sendError(id){const item=state.errors.find(x=>x.id===id);if(!item)return;try{await api('/api/v1/errors/report',{method:'POST',body:JSON.stringify(item)});item.sent=true;persistErrors();renderErrors();closeErrorDialog();toast('گزارش برای سرور ارسال شد')}catch(e){toast(`ارسال ناموفق: ${e.message}`)}}
$('#sendAllErrors').onclick=async()=>{for(const e of state.errors.filter(x=>!x.sent))await sendError(e.id)};

/* ========================= SETTINGS ========================= */
$('#saveSettings').onclick=()=>{localStorage.setItem('ecuRemoteApi',$('#remoteApi').value.trim());localStorage.setItem('ecuLocalApi',$('#localApi').value.trim());applyTheme($('#themeSelect').value);state.token=null;applyPlan();toast('تنظیمات ذخیره شد')};

/* ========================= PRO PLAN ========================= */
function setDevelopmentPlan(pro){state.plan=pro?'pro':'free';localStorage.setItem('ecuDevProUnlocked',String(pro));state.token=null;applyPlan();toast(pro?'نسخه پیشرفته آزمایشی فعال شد':'نسخه رایگان فعال شد')}
function tryUnlockPro(raw){const code=String(raw||'').trim();if(code!==DEV_PRO_CODE){toast('کد فعال‌سازی نادرست است');return false}setDevelopmentPlan(true);return true}
$('#unlockProBtn').onclick=()=>{if(tryUnlockPro($('#devProCode').value))$('#devProCode').value=''};
$('#storeUnlockProBtn').onclick=()=>{if(tryUnlockPro($('#storeDevProCode').value)){$('#storeDevProCode').value='';go('procenter')}};
$('#disableProBtn').onclick=()=>setDevelopmentPlan(false);
function activateAdvancedCard(card){if(state.plan!=='pro')return toast('ابتدا نسخه پیشرفته را با کد ۱۲۳۴ فعال کن');if(card.dataset.open)return go(card.dataset.open);if(card.dataset.action==='dtc-clear'){go('dashboard');setTimeout(()=>$('#clearDtcBtn')?.scrollIntoView({behavior:'smooth',block:'center'}),100)}if(card.dataset.action==='pdf'){go('analysis');setTimeout(()=>state.lastReport?$('#pdfBtn').click():analyze(),100)}}
$$('.pro-feature').forEach(card=>{card.addEventListener('click',e=>{if(e.target.closest('button')||e.currentTarget===card)activateAdvancedCard(card)});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateAdvancedCard(card)}})});
function applyPlan(){const pro=state.plan==='pro';$('#sidePlan').textContent=pro?'PRO DEV':'FREE';$('#catalogBadge').textContent=pro?'کاتالوگ کامل':'فهرست رایگان ۱۰٪';$$('.pro-only').forEach(x=>x.classList.toggle('locked',!pro));$$('.pro-feature').forEach(x=>x.classList.toggle('locked',!pro));$('.advanced-nav')?.classList.toggle('unlocked',pro);if($('#proNavBadge'))$('#proNavBadge').textContent=pro?'فعال':'قفل';if($('#proCenterBadge'))$('#proCenterBadge').textContent=pro?'PRO فعال':'قفل';if($('#proUnlockStatus'))$('#proUnlockStatus').textContent=pro?'نسخه پیشرفته آزمایشی فعال است':'نسخه رایگان فعال است';$('.dev-unlock')?.classList.toggle('unlocked',pro);if($('#unlockProBtn'))$('#unlockProBtn').hidden=pro;if($('#disableProBtn'))$('#disableProBtn').hidden=!pro;if($('#planStatusInput'))$('#planStatusInput').value=pro?'پیشرفته آزمایشی':'رایگان';renderVehicles();renderActiveVehicle();refreshEntitlement()}

/* ========================= MYDIAG HOME ========================= */
function syncMyDiagHome(){const v=activeVehicle();if(!v)return;$('#mydiagVehicleName').textContent=`${v.make} ${v.model}`;$('#mydiagVehicleLogo').src=logoSrc(v);$('#mydiagSpeed').textContent=`${fa(Math.round(state.live.speedKph||0))} km/h`;$('#mydiagRpm').textContent=`${fa(Math.round(state.live.rpm||0))} rpm`;$('#mydiagDtcCount').textContent=fa(state.dtcs.length);$('#mydiagConnectionState').textContent=state.demoMode?'اتصال شبیه‌ساز فعال است':'منتظر اتصال ELM327'}

/* ========================= DRIVING STYLE ========================= */
function selectedTripForStyle(){return selectedTrip?.()||trips?.().at(-1)||null}
$('#recalculateStyle').onclick=()=>{const trip=selectedTripForStyle();if(!trip?.points?.length)return toast('سفری برای تحلیل انتخاب نشده است');const speeds=trip.points.map(p=>Number(p.speedKph||p.speed||0));let accel=0,brake=0;for(let i=1;i<speeds.length;i++){const d=speeds[i]-speeds[i-1];if(d>12)accel++;if(d<-14)brake++}const idle=(trip.stops||[]).length;const max=Math.max(0,...speeds);const score=Math.max(35,100-accel*4-brake*5-idle*2-Math.max(0,max-100)*.4);$('#styleScore').textContent=fa(Math.round(score));$('#rapidAccelCount').textContent=fa(accel);$('#rapidBrakeCount').textContent=fa(brake);$('#idleEventCount').textContent=fa(idle);$('#styleMaxSpeed').textContent=fa(Math.round(max));$('#mydiagDriveScore').textContent=fa(Math.round(score))};

/* ========================= PARKING ========================= */
$('#saveParking').onclick=()=>{if(!navigator.geolocation)return toast('موقعیت مکانی در دسترس نیست');navigator.geolocation.getCurrentPosition(pos=>{localStorage.setItem('ecuParking',JSON.stringify({lat:pos.coords.latitude,lon:pos.coords.longitude,at:new Date().toISOString()}));$('#parkingStatus').textContent=`موقعیت در ${new Date().toLocaleTimeString('fa-IR')} ذخیره شد.`;toast('موقعیت پارک ذخیره شد')},()=>toast('خطا در دریافت موقعیت'),{enableHighAccuracy:true,timeout:10000})};
$('#clearParking').onclick=()=>{localStorage.removeItem('ecuParking');$('#parkingStatus').textContent='هنوز موقعیتی ذخیره نشده است.';toast('موقعیت پارک پاک شد')};

/* ========================= DASHCAM ========================= */
$('#dashcamInput').onchange=e=>{const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);const video=$('#dashcamVideo');video.src=url;video.play().catch(()=>{})};

/* ========================= ECU CONSOLE ========================= */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
class CommandGuard{
  static normalize(value){return String(value||'').toUpperCase().replace(/\s+/g,'').replace(/[\r\n]/g,'')}
  static isAllowed(value,extended=false){const command=this.normalize(value);if(!command)return false;if(command.startsWith('AT'))return !/^(ATPP|ATCV|ATSD|AT@3|ATWM|ATBI|ATFI|ATSI)/.test(command);if(/^(04|08|10|11|14|27|28|2E|2F|31|34|35|36|37|3D|85)/.test(command))return false;if(/^(01|02|03|06|07|09|0A)[0-9A-F]*$/.test(command))return true;return extended&&/^(19|1A|21|22)[0-9A-F]+$/.test(command)}
}
class SessionLogger{
  constructor(){this.entries=[];this.writer=null;this.fileName='';this.writeChain=Promise.resolve();this.maxEntries=200000;this.lineBuffers={RX:'',MON:''};this.render()}
  record(direction,data,meta={}){const entry={ts:new Date().toISOString(),direction,data:String(data),...meta};this.entries.push(entry);if(this.entries.length>this.maxEntries)this.entries.splice(0,this.entries.length-this.maxEntries);const line=JSON.stringify(entry)+'\n';if(this.writer){this.writeChain=this.writeChain.then(()=>this.writer.write(line)).catch(error=>{this.writer=null;this.fileName='';this.render();scannerToast(`ثبت فایل متوقف شد: ${error.message}`)})}appendLog('#ecuRawLog',`${entry.ts} [${direction}] ${entry.data}`,1600);this.render();return entry}
  raw(direction,chunk){let buffer=(this.lineBuffers[direction]||'')+String(chunk||'').replace(/\0/g,'');let start=0;for(let i=0;i<buffer.length;i+=1){const char=buffer[i];if(char==='\r'||char==='\n'||char==='>'){const part=buffer.slice(start,i).trim();if(part)this.record(direction,part);if(char==='>')this.record(direction,'>');while(i+1<buffer.length&&/[\r\n]/.test(buffer[i+1]))i+=1;start=i+1}}this.lineBuffers[direction]=buffer.slice(start)}
  async chooseFile(){if(!window.showSaveFilePicker){scannerToast('مرورگر ثبت مستقیم فایل ندارد؛ خروجی JSONL را دانلود کن.');return}const handle=await window.showSaveFilePicker({suggestedName:`ecu-pulse-${new Date().toISOString().replace(/[:.]/g,'-')}.jsonl`,types:[{description:'ECU Pulse JSONL',accept:{'application/x-ndjson':['.jsonl']}}]});this.writer=await handle.createWritable();this.fileName=handle.name;await this.writer.write(JSON.stringify({ts:new Date().toISOString(),direction:'SYS',data:'SESSION_START',format:'ECU_PULSE_JSONL_V1'})+'\n');this.render();scannerToast('ثبت مستقیم روی فایل شروع شد.')}
  async closeFile(){if(!this.writer)return;await this.writeChain;await this.writer.close();this.writer=null;this.fileName='';this.render()}
  download(format){if(!this.entries.length)return scannerToast('هنوز رکوردی ثبت نشده است.');let content,type,fileName;if(format==='csv'){const quote=v=>`"${String(v).replace(/"/g,'""')}"`;content='timestamp,direction,data\n'+this.entries.map(e=>[quote(e.ts),quote(e.direction),quote(e.data)].join(',')).join('\n');type='text/csv;charset=utf-8';fileName='ecu-pulse-session.csv'}else{content=this.entries.map(e=>JSON.stringify(e)).join('\n')+'\n';type='application/x-ndjson';fileName='ecu-pulse-session.jsonl'}const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
  clear(){this.entries=[];$('#ecuRawLog').textContent='';this.render()}
  render(){$('#ecuLogCount').textContent=`${this.entries.length.toLocaleString('fa-IR')} رکورد`;$('#ecuActiveLogFile').textContent=this.fileName||'ندارد';$('#ecuCloseLogFile').disabled=!this.writer}
}
function appendLog(sel,text,max=1600){const el=$(sel);if(!el)return;const existing=el.textContent.split('\n');existing.push(text);while(existing.length>max)existing.shift();el.textContent=existing.join('\n');el.scrollTop=el.scrollHeight}
function scannerToast(text){toast(text)}
function setConnectionState(state,msg){const pill=$('#scannerConnectionPill');pill.className='scanner-pill '+state;pill.textContent=msg||state;$('#ecuConnect').disabled=state==='online';$('#ecuDisconnect').disabled=state!=='online';$('#ecuInitialize').disabled=state!=='online';$('#ecuCommandInput').disabled=state!=='online';$('#ecuSendCommand').disabled=state!=='online'}
const sessionLogger=new SessionLogger();
let ecuTransport=null;
$$('.scanner-tabs button').forEach(b=>b.onclick=()=>{$$('.scanner-tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.scanner-panel').forEach(p=>p.classList.toggle('active',p.dataset.scannerPanel===b.dataset.scannerTab))});
const scannerProfiles=[{id:'generic',name:'Generic OBD-II',init:['ATZ','ATE0','ATL0','ATH0','ATS0','ATSP0']},{id:'iso14230',name:'ISO 14230-4 KWP2000 Fast',init:['ATZ','ATE0','ATL0','ATH0','ATS0','ATSP3']},{id:'iso15765',name:'ISO 15765-4 CAN 11b/500k',init:['ATZ','ATE0','ATL0','ATH0','ATS0','ATSP6']}];
$('#ecuProfile').innerHTML=scannerProfiles.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
function renderInitSteps(profile){const p=scannerProfiles.find(x=>x.id===profile)||scannerProfiles[0];$('#ecuInitSteps').innerHTML=p.init.map((cmd,i)=>`<div><code>${cmd}</code><span>مرحله ${fa(i+1)}</span></div>`).join('')}
function renderQuickCommands(){const groups=[{title:'Mode 01 — داده زنده',items:[{cmd:'010C',label:'RPM'},{cmd:'010D',label:'سرعت'},{cmd:'0105',label:'دمای آب'},{cmd:'0111',label:'TPS'},{cmd:'010B',label:'MAP'},{cmd:'010F',label:'دمای هوا'}]},{title:'Mode 03/07/09',items:[{cmd:'03',label:'DTC ذخیره'},{cmd:'07',label:'DTC معلق'},{cmd:'09',label:'اطلاعات خودرو'},{cmd:'0902',label:'VIN'}]},{title:'تشخیص',items:[{cmd:'ATI',label:'شناسه ELM'},{cmd:'ATRV',label:'ولتاژ'},{cmd:'ATDP',label:'پروتکل'},{cmd:'AT@1',label:'توضیحات'}]}];$('#ecuQuickCommands').innerHTML=groups.map(g=>`<section><h3>${g.title}</h3><div>${g.items.map(x=>`<button onclick="ecuSendQuick('${x.cmd}')"><small>${x.cmd}</small>${x.label}</button>`).join('')}</div></section>`).join('')}
renderInitSteps('generic');renderQuickCommands();
$('#ecuProfile').onchange=()=>{renderInitSteps($('#ecuProfile').value);renderQuickCommands()};
async function ecuRunInit(profileId){const profile=scannerProfiles.find(x=>x.id===profileId)||scannerProfiles[0];const steps=$('#ecuInitSteps').children;for(let i=0;i<profile.init.length;i++){if(ecuTransport?.closed)break;steps[i].classList.add('running');try{const r=await ecuTransport.transact(profile.init[i],3000);steps[i].classList.remove('running');steps[i].classList.add('ok');steps[i].querySelector('span').textContent+=' ✓'}catch(e){steps[i].classList.remove('running');steps[i].classList.add('fail');steps[i].querySelector('span').textContent+=' ✗';throw e}}}
async function ecuConnect(){try{const baud=Number($('#ecuBaud').value);ecuTransport=new WebSerialTransport(baud,sessionLogger);await ecuTransport.connect();setConnectionState('online','متصل');appendLog('#ecuConnectionLog','پورت سریال باز شد.',800)}catch(e){appendLog('#ecuConnectionLog',`خطا: ${e.message}`,800);setConnectionState('error','خطا')}}
async function ecuMockConnect(){try{ecuTransport=new MockTransport(0.08);setConnectionState('online','شبیه‌ساز');appendLog('#ecuConnectionLog','اتصال شبیه‌ساز ELM327 فعال شد.',800);$('#ecuConnectionLog').textContent='اتصال آزمایشی فعال است. در این حالت، فرمان‌ها پاسخ‌های از پیش تعریف‌شده دریافت می‌کنند.'}catch(e){appendLog('#ecuConnectionLog',`خطا: ${e.message}`,800)}}
async function ecuSendCommand(){if(!ecuTransport||ecuTransport.closed)return scannerToast('ابتدا متصل شو');const raw=$('#ecuCommandInput').value.trim();if(!raw)return;const extended=$('#ecuExtendedRead').checked;if(!CommandGuard.isAllowed(raw,extended)){scannerToast('فرمان مسدود شد (حفاظت نوشتن)');appendLog('#ecuTerminalLog',`BLOCKED: ${raw}`,600);return}try{appendLog('#ecuTerminalLog',`> ${raw}`,600);const r=await ecuTransport.transact(raw,5000);appendLog('#ecuTerminalLog',r.replace(/\r/g,''),600)}catch(e){appendLog('#ecuTerminalLog',`ERR: ${e.message}`,600);}$('#ecuCommandInput').value=''}
async function ecuStartMonitor(){if(!ecuTransport||ecuTransport.closed)return;try{ecuTransport.monitoring=true;ecuTransport.monitorCallback=line=>{$('#ecuMonitorLog').textContent+='\n'+line;const frames=($('#ecuMonitorLog').textContent.match(/\n/g)||[]).length+1;$('#ecuMonitorFrames').textContent=frames};$('#ecuMonitorState').className='scanner-pill busy';$('#ecuMonitorState').textContent='در حال شنود';await ecuTransport.writeRaw('ATMA\r');}catch(e){scannerToast(e.message)}}
async function ecuStopMonitor(){if(!ecuTransport||ecuTransport.closed)return;ecuTransport.monitoring=false;ecuTransport.monitorCallback=null;$('#ecuMonitorState').className='scanner-pill idle';$('#ecuMonitorState').textContent='خاموش';try{await ecuTransport.writeRaw('\r')}catch{}}
async function ecuDisconnect(){if(ecuTransport&&!ecuTransport.closed){try{await ecuTransport.disconnect()}catch{}}ecuTransport=null;setConnectionState('idle','قطع');appendLog('#ecuConnectionLog','ارتباط قطع شد.',800)}
class WebSerialTransport{
  constructor(baudRate,logger){this.baudRate=baudRate;this.logger=logger;this.port=null;this.reader=null;this.writer=null;this.pending=null;this.monitoring=false;this.monitorCallback=null;this.monitorBuffer='';this.closed=false;this.readTask=null;this.decoder=new TextDecoder()}
  async connect(){if(!('serial' in navigator))throw new Error('Web Serial فقط در Chrome یا Edge دسکتاپ پشتیبانی می‌شود.');this.port=await navigator.serial.requestPort();await this.port.open({baudRate:this.baudRate});this.reader=this.port.readable.getReader();this.writer=this.port.writable.getWriter();this.closed=false;this.readTask=this.readLoop()}
  async readLoop(){try{while(!this.closed){const{value,done}=await this.reader.read();if(done)break;if(!value)continue;const text=this.decoder.decode(value,{stream:true}).replace(/\0/g,'');this.logger.raw(this.monitoring?'MON':'RX',text);if(this.monitoring){this.monitorBuffer+=text;const lines=this.monitorBuffer.split(/\r\n|\r|\n/);this.monitorBuffer=lines.pop()||'';for(const line of lines){const clean=line.replace(/>/g,'').trim();if(clean)this.monitorCallback?.(clean)}}else if(this.pending){this.pending.buffer+=text;if(this.pending.buffer.includes('>')){const pending=this.pending;this.pending=null;clearTimeout(pending.timer);pending.resolve(pending.buffer)}}}}catch(error){if(!this.closed){this.pending?.reject(error);this.pending=null;setConnectionState('error','ارتباط قطع شد');this.logger.record('SYS',`SERIAL_READ_ERROR: ${error.message}`)}}}
  async writeRaw(text,direction='TX'){if(!this.writer)throw new Error('پورت باز نیست.');this.logger.record(direction,text.replace(/\r/g,'<CR>'));await this.writer.write(new TextEncoder().encode(text))}
  async transact(command,timeoutMs=6000){if(this.monitoring)throw new Error('ابتدا شنود Bus را متوقف کن.');if(this.pending)throw new Error('فرمان قبلی هنوز در حال اجراست.');return new Promise(async(resolve,reject)=>{const pending={buffer:'',resolve,reject,timer:null};pending.timer=setTimeout(()=>{if(this.pending===pending)this.pending=null;reject(new Error(`Timeout ${timeoutMs}ms waiting for ELM327 prompt`))},timeoutMs);this.pending=pending;try{await this.writeRaw(`${command.trim()}\r`)}catch(error){clearTimeout(pending.timer);this.pending=null;reject(error)}})}
  async disconnect(){this.closed=true;if(this.pending){this.pending.reject(new Error('منقطع شد'));this.pending=null}try{this.reader?.cancel()}catch{}try{this.reader?.releaseLock()}catch{}try{this.writer?.close()}catch{}try{this.writer?.releaseLock()}catch{}try{this.port?.close()}catch{}this.port=null;this.reader=null;this.writer=null}
}
class MockTransport{
  constructor(responseDelaySeconds=0.08){this.delayMs=responseDelaySeconds*1000;this.logger=sessionLogger;this.closed=false;this.monitoring=false;this.monitorCallback=null}
  async transact(command,timeoutMs=6000){await sleep(this.delayMs);const cmd=CommandGuard.normalize(command);let response='';if(cmd==='ATZ')response='ELM327 v2.1\r>';else if(cmd==='ATI')response='ELM327 v2.1\r>';else if(cmd==='ATE0')response='OK\r>';else if(cmd==='ATL0')response='OK\r>';else if(cmd==='ATH0')response='OK\r>';else if(cmd==='ATS0')response='OK\r>';else if(cmd==='ATSP0')response='OK\r>';else if(cmd.startsWith('ATSP'))response='OK\r>';else if(cmd==='ATDP')response='AUTO,ISO 15765-4 (CAN 11/500)\r>';else if(cmd==='ATRV')response=`${(13.9+Math.random()*.3).toFixed(1)}V\r>`;else if(cmd==='AT@1')response='OBDII compatible\r>';else if(cmd==='0100')response='41 00 BE 3E B8 11\r>';else if(cmd==='010C')response=`41 0C ${(800+Math.round(Math.random()*2200)).toString(16).toUpperCase().padStart(4,'0')}\r>`;else if(cmd==='010D')response=`41 0D ${Math.min(120,Math.floor(Math.random()*80)).toString(16).toUpperCase().padStart(2,'0')}\r>`;else if(cmd==='0105')response=`41 05 ${(80+Math.floor(Math.random()*15)).toString(16).toUpperCase().padStart(2,'0')}\r>`;else if(cmd==='0111')response=`41 11 ${Math.floor(15+Math.random()*40).toString(16).toUpperCase().padStart(2,'0')}\r>`;else if(cmd==='010B')response=`41 0B ${Math.floor(30+Math.random()*60).toString(16).toUpperCase().padStart(2,'0')}\r>`;else if(cmd==='010F')response=`41 0F ${(20+Math.floor(Math.random()*30)).toString(16).toUpperCase().padStart(2,'0')}\r>`;else if(cmd==='03')response='NO DATA\r>';else if(cmd==='07')response='NO DATA\r>';else if(cmd==='0902')response='49 02 01 00 00 00 31\r>';else if(cmd==='09')response='49 0A 00 00 00 00 00 00\r>';else if(cmd===command.toUpperCase().trim())response='NO DATA\r>';else response='?\r>';this.logger.record('TX',command);this.logger.record('RX',response.replace(/\r/g,''));return response}
  async writeRaw(text,direction='TX'){this.logger.record(direction,text.replace(/\r/g,'<CR>'))}
  async disconnect(){this.closed=true}
}
window.ecuSendQuick=function(cmd){$('#ecuCommandInput').value=cmd;ecuSendCommand()};

$('#ecuConnect').onclick=ecuConnect;$('#ecuMockConnect').onclick=ecuMockConnect;$('#ecuDisconnect').onclick=ecuDisconnect;
$('#ecuInitialize').onclick=()=>{if(!ecuTransport||ecuTransport.closed)return scannerToast('ابتدا متصل شو');ecuRunInit($('#ecuProfile').value).then(()=>scannerToast('راه‌اندازی کامل شد')).catch(e=>scannerToast(`خطا: ${e.message}`))};
$('#ecuSendCommand').onclick=ecuSendCommand;$('#ecuCommandInput').addEventListener('keydown',e=>{if(e.key==='Enter')ecuSendCommand()});
$('#ecuClearTerminal').onclick=()=>{$('#ecuTerminalLog').textContent=''};
$('#ecuStartMonitor').onclick=ecuStartMonitor;$('#ecuStopMonitor').onclick=ecuStopMonitor;$('#ecuClearMonitor').onclick=()=>{$('#ecuMonitorLog').textContent='';$('#ecuMonitorFrames').textContent='0'};
$('#ecuApplyFilter').onclick=async()=>{if(!ecuTransport||ecuTransport.closed)return scannerToast('ابتدا متصل شو');const addr=$('#ecuCraFilter').value.trim();if(!addr)return scannerToast('آدرس فیلتر را وارد کن');try{await ecuTransport.writeRaw(`ATCRA ${addr}\r`);scannerToast(`فیلتر روی ${addr} اعمال شد`)}catch(e){scannerToast(e.message)}};
$('#ecuChooseLogFile').onclick=()=>sessionLogger.chooseFile();$('#ecuCloseLogFile').onclick=()=>sessionLogger.closeFile();
$('#ecuDownloadJsonl').onclick=()=>sessionLogger.download('jsonl');$('#ecuDownloadCsv').onclick=()=>sessionLogger.download('csv');$('#ecuClearLogs').onclick=()=>sessionLogger.clear();

/* ========================= INIT ========================= */
async function loadData(){
  try{
    state.demo=await fetchTimeout('./data/demo-profile.json',{},5000,0).then(r=>r.json());
    state.data=await fetchTimeout('./data/core-data.json',{},5000,0).then(r=>r.json());
    state.tiers=await fetchTimeout('./data/entitlements.json',{},5000,0).then(r=>r.json());
    state.logos=await fetchTimeout('./data/brand-logos.json',{},5000,0).then(r=>r.json());
  }catch(e){
    state.data={vehicles:[{make:'پژو',model:'۲۰۶',year:1398,protocols:['ISO 15765-4 CAN 11bit/500k'],profile:'OBD-II (PID 01-0A)',segment:'passenger'},{make:'سمند',model:'سورن',year:1400,protocols:['ISO 15765-4 CAN 11bit/500k'],profile:'OBD-II',segment:'passenger'},{make:'پراید',model:'۱۳۱',year:1395,protocols:['ISO 9141-2'],profile:'OBD-II',segment:'passenger'},{make:'پژو',model:'پارس',year:1399,protocols:['ISO 15765-4 CAN 11bit/500k'],profile:'OBD-II',segment:'passenger'},{make:'تویوتا',model:'کرولا',year:2019,protocols:['ISO 15765-4'],profile:'OBD-II',segment:'passenger'},{make:'هیوندای',model:'النترا',year:2020,protocols:['ISO 15765-4'],profile:'OBD-II',segment:'passenger'}]};
    state.tiers={freeVehicleIndexes:[0,1,2,3]};
    state.demo={vehicle:{make:'ایران خودرو',model:'ECU Pulse Demo',protocols:['Generic OBD-II','ELM327'],profile:'DEMO',segment:'passenger'},scenario:{sampleIntervalMs:800,dtcs:[{code:'P0133',kind:'STORED',description:'پاسخ کند سنسور اکسیژن بانک ۱'},{code:'P0420',kind:'PENDING',description:'بازده کاتالیست پایین‌تر از آستانه'}]},demoTrip:{id:'demo-tehran-west-east',titleFa:'تهران: غرب به شرق و بازگشت',descriptionFa:'مسیر نمایشی از میدان آزادی به تهرانپارس و بازگشت از شمال',stops:[{lat:35.7037,lon:51.4195,nameFa:'توقف ۱ - میدان ولیعصر',durationSeconds:120},{lat:35.7292,lon:51.4396,nameFa:'توقف ۲ - پمپ بنزین',durationSeconds:90}],points:[{lat:35.7005,lon:51.3382,offsetSeconds:0,speedKph:0,rpm:800},{lat:35.7008,lon:51.3507,offsetSeconds:12,speedKph:45,rpm:1900},{lat:35.7021,lon:51.3724,offsetSeconds:28,speedKph:72,rpm:2400},{lat:35.7037,lon:51.3990,offsetSeconds:44,speedKph:58,rpm:2100},{lat:35.7037,lon:51.4195,offsetSeconds:60,speedKph:0,rpm:800,label:'میدان ولیعصر',stop:true},{lat:35.7052,lon:51.4298,offsetSeconds:80,speedKph:38,rpm:1750},{lat:35.7201,lon:51.4350,offsetSeconds:96,speedKph:55,rpm:2200},{lat:35.7292,lon:51.4396,offsetSeconds:108,speedKph:0,rpm:800,label:'پمپ بنزین',stop:true},{lat:35.7348,lon:51.4210,offsetSeconds:128,speedKph:42,rpm:1950},{lat:35.7203,lon:51.3957,offsetSeconds:140,speedKph:68,rpm:2350},{lat:35.7245,lon:51.3823,offsetSeconds:152,speedKph:52,rpm:2100},{lat:35.7098,lon:51.3650,offsetSeconds:168,speedKph:60,rpm:2250},{lat:35.7005,lon:51.3382,offsetSeconds:184,speedKph:0,rpm:800,label:'پایان مسیر'}]}};
  }
  renderVehicles();renderActiveVehicle();renderTripSelect();applyPlan();
  if(state.plan==='pro')applyPlan();
  const setVal=()=>{$('#themeSelect').value=state.theme;$('#remoteApi').value=localStorage.getItem('ecuRemoteApi')||'https://diageman.ir';$('#localApi').value=localStorage.getItem('ecuLocalApi')||'http://127.0.0.1:4030'};setVal();
  if(state.demoMode||!localStorage.getItem('ecuVehicle'))startDemo();else syncDemoButtons();
  const parking=localStorage.getItem('ecuParking');if(parking){try{const p=JSON.parse(parking);$('#parkingStatus').textContent=`آخرین موقعیت: ${new Date(p.at).toLocaleString('fa-IR')}`}catch{}}
  renderErrors();refreshEntitlement().catch(()=>{});
  return true;
}
loadData();