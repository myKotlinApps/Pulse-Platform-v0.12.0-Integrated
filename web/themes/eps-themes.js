const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const fa=v=>String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const fmt=(v,d=0)=>fa((Number(v)||0).toFixed(d));

function sparkPoints(values,width=300,height=80,pad=8){
  const max=Math.max(1,...values),min=Math.min(0,...values),span=Math.max(1,max-min);
  return values.map((v,i)=>{
    const x=pad+i*(width-pad*2)/Math.max(1,values.length-1);
    const y=height-pad-(v-min)/span*(height-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
function ringStyle(value,max,color){
  const p=clamp(value,0,max)/max*100;
  return `--eps-progress:${p}%;--eps-ring-color:${color}`;
}

export class EpsThemeBase{
  constructor(id,titleFa){this.id=id;this.titleFa=titleFa;this.container=null;this.live={};}
  mount(container,live={}){
    this.container=container;
    this.live=live;
    if(!container)return;
    container.hidden=false;
    container.dataset.epsTheme=this.id;
    container.innerHTML=this.template(live);
    this.update(live);
  }
  unmount(){
    if(this.container){this.container.hidden=true;this.container.innerHTML='';delete this.container.dataset.epsTheme;}
    this.container=null;
  }
  template(){return '';}
  update(live={}){this.live=live;}
  text(role,value){const el=this.container?.querySelector(`[data-eps-role="${role}"]`);if(el)el.textContent=value;}
  css(role,name,value){const el=this.container?.querySelector(`[data-eps-role="${role}"]`);if(el)el.style.setProperty(name,value);}
}

export class NeonAnalyticsTheme extends EpsThemeBase{
  constructor(){super('eps-neon','نئون آماری');}
  template(l){
    return `<div class="eps-heading"><div><small>EPS · 6145222</small><h2>Neon Analytics</h2></div><span>کلاس NeonAnalyticsTheme</span></div>
    <div class="eps-grid eps-neon-grid">
      <article class="eps-card eps-neon-chart">
        <header><b>روند داده زنده</b><span data-eps-role="neonSpeed">۰ km/h</span></header>
        <svg viewBox="0 0 340 120" aria-label="نمودار زنده"><g class="eps-grid-lines"><path d="M20 20H325M20 50H325M20 80H325M20 110H325"/><path d="M20 12V110"/></g><polyline data-eps-role="neonLine" points="" class="eps-line-gradient"/><circle data-eps-role="neonDot" cx="315" cy="65" r="5"/></svg>
      </article>
      <article class="eps-card eps-neon-dial">
        <div class="eps-tick-ring"><div><strong data-eps-role="neonRpm">۰</strong><small>RPM</small></div></div>
      </article>
      <article class="eps-card eps-ring-cluster">
        ${[['coolant','آب','#1ee6cb'],['voltage','ولتاژ','#ff872d'],['load','بار','#b576ff'],['fuel','مصرف','#48ff3e']].map(([r,t,c])=>`<div class="eps-ring" data-eps-role="${r}Ring" style="${ringStyle(0,100,c)}"><div><b data-eps-role="${r}Value">--</b><small>${t}</small></div></div>`).join('')}
      </article>
      <article class="eps-card eps-neon-sliders">
        ${[['sliderSpeed','سرعت'],['sliderLoad','بار موتور'],['sliderVoltage','ولتاژ']].map(([r,t])=>`<label><span>${t}</span><i><u data-eps-role="${r}"></u></i></label>`).join('')}
      </article>
    </div>`;
  }
  update(l={}){
    super.update(l);
    const speed=clamp(l.speedKph,0,220),rpm=clamp(l.rpm,0,7000),cool=clamp(l.coolantC??0,0,120),vol=clamp(l.voltage??0,0,16),load=clamp(l.engineLoad??0,0,100);
    this.text('neonSpeed',`${fmt(speed)} km/h`);this.text('neonRpm',fmt(rpm));
    const values=Array.from({length:16},(_,i)=>Math.max(4,speed*.55+25+Math.sin(i*.82+(rpm/900))*24+(i%3)*3));
    const points=sparkPoints(values,340,120,20);const line=this.container?.querySelector('[data-eps-role="neonLine"]');if(line)line.setAttribute('points',points);
    const last=points.split(' ').at(-1)?.split(',');const dot=this.container?.querySelector('[data-eps-role="neonDot"]');if(dot&&last){dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);}
    const ring=(role,val,max,text)=>{this.css(`${role}Ring`,'--eps-progress',`${clamp(val,0,max)/max*100}%`);this.text(`${role}Value`,text)};
    ring('coolant',cool,120,`${fmt(cool)}°`);ring('voltage',vol,16,fmt(vol,1));ring('load',load,100,`${fmt(load)}٪`);ring('fuel',speed>5?5.5+load/20:0,15,speed>5?fmt(5.5+load/20,1):'--');
    this.css('sliderSpeed','width',`${speed/220*100}%`);this.css('sliderLoad','width',`${load}%`);this.css('sliderVoltage','width',`${vol/16*100}%`);
  }
}

export class ColorMetricsTheme extends EpsThemeBase{
  constructor(){super('eps-color','رنگی متریک');}
  template(){
    return `<div class="eps-heading"><div><small>EPS · 6402304</small><h2>Color Metrics</h2></div><span>کلاس ColorMetricsTheme</span></div>
    <div class="eps-grid eps-color-grid">
      <article class="eps-card eps-color-rings">
        ${[['colorSpeed','سرعت','#45cfff'],['colorRpm','RPM','#20f57b'],['colorCool','دما','#ffbc28'],['colorLoad','بار','#ff2b7a']].map(([r,t,c])=>`<div class="eps-flat-ring" data-eps-role="${r}Ring" style="--eps-ring-color:${c};--eps-progress:0%"><strong data-eps-role="${r}Value">۰</strong><small>${t}</small></div>`).join('')}
      </article>
      <article class="eps-card eps-color-bars"><header><b>توزیع عملکرد</b><span>Live</span></header><div class="eps-bar-row" data-eps-role="colorBars"></div></article>
      <article class="eps-card eps-color-line"><svg viewBox="0 0 340 110"><polyline data-eps-role="colorLine" points="" /><circle data-eps-role="colorDot" r="6"/></svg><small>گراف چندرنگ داده خودرو</small></article>
      <article class="eps-card eps-control-stack">
        ${[['controlSpeed','سرعت'],['controlRpm','RPM'],['controlLoad','بار موتور']].map(([r,t])=>`<label><span>${t}</span><i><u data-eps-role="${r}"></u><b data-eps-role="${r}Knob"></b></i></label>`).join('')}
      </article>
    </div>`;
  }
  update(l={}){
    super.update(l);
    const s=clamp(l.speedKph,0,220),r=clamp(l.rpm,0,7000),c=clamp(l.coolantC??0,0,120),load=clamp(l.engineLoad??0,0,100);
    const setRing=(role,val,max,text)=>{this.css(`${role}Ring`,'--eps-progress',`${val/max*100}%`);this.text(`${role}Value`,text)};
    setRing('colorSpeed',s,220,fmt(s));setRing('colorRpm',r,7000,fmt(r/1000,1));setRing('colorCool',c,120,fmt(c));setRing('colorLoad',load,100,fmt(load));
    const bars=this.container?.querySelector('[data-eps-role="colorBars"]');if(bars)bars.innerHTML=Array.from({length:16},(_,i)=>`<i style="height:${18+((i*19+s+r/200)%76)}%;--bar:${['#20f57b','#ffe329','#ff2b7a','#45cfff'][i%4]}"></i>`).join('');
    const vals=Array.from({length:13},(_,i)=>18+s*.18+Math.sin(i*.9+r/1100)*22+(i%4)*5);const pts=sparkPoints(vals,340,110,14),line=this.container?.querySelector('[data-eps-role="colorLine"]');if(line)line.setAttribute('points',pts);
    const last=pts.split(' ').at(-1)?.split(','),dot=this.container?.querySelector('[data-eps-role="colorDot"]');if(dot&&last){dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);}
    [['controlSpeed',s/220],['controlRpm',r/7000],['controlLoad',load/100]].forEach(([role,p])=>{this.css(role,'width',`${p*100}%`);this.css(`${role}Knob`,'right',`calc(${p*100}% - 14px)`)});
  }
}

export class MobileGradientTheme extends EpsThemeBase{
  constructor(){super('eps-mobile','موبایل گرادیانی');}
  template(){
    return `<div class="eps-heading"><div><small>EPS · 5185757</small><h2>Mobile Gradient</h2></div><span>کلاس MobileGradientTheme</span></div>
    <div class="eps-grid eps-mobile-grid">
      <article class="eps-card eps-mobile-radial"><div class="eps-segmented-arc" data-eps-role="mobileArc"><div><small>ENGINE ACTIVITY</small><strong data-eps-role="mobileRpm">۰</strong><span>از ۷۰۰۰</span></div></div><svg viewBox="0 0 340 96"><polyline data-eps-role="mobileMainLine" points=""/></svg></article>
      <article class="eps-card eps-mobile-list">
        ${[['mobileSpeed','سرعت','#253988','#2544a8'],['mobileCool','دمای آب','#1778ac','#2444a4'],['mobileLoad','بار موتور','#18bdd1','#3152cf'],['mobileVolt','ولتاژ','#43ecdf','#5556e5']].map(([r,t,a,b])=>`<div class="eps-mobile-row" style="--row-a:${a};--row-b:${b}"><div><b data-eps-role="${r}Value">--</b><small>${t}</small></div><svg viewBox="0 0 150 55"><polyline data-eps-role="${r}Line" points=""/></svg></div>`).join('')}
      </article>
    </div>`;
  }
  update(l={}){
    super.update(l);
    const s=clamp(l.speedKph,0,220),r=clamp(l.rpm,0,7000),c=clamp(l.coolantC??0,0,120),load=clamp(l.engineLoad??0,0,100),v=clamp(l.voltage??0,0,16);
    this.text('mobileRpm',fmt(r));this.css('mobileArc','--eps-progress',`${r/7000*100}%`);
    const main=Array.from({length:18},(_,i)=>18+s*.22+Math.sin(i*.72+r/1000)*21);const mainLine=this.container?.querySelector('[data-eps-role="mobileMainLine"]');if(mainLine)mainLine.setAttribute('points',sparkPoints(main,340,96,10));
    const rows=[['mobileSpeed',s,`${fmt(s)} km/h`],['mobileCool',c,`${fmt(c)} °C`],['mobileLoad',load,`${fmt(load)}٪`],['mobileVolt',v,`${fmt(v,1)} V`]];
    rows.forEach(([role,val,text],idx)=>{this.text(`${role}Value`,text);const vals=Array.from({length:9},(_,i)=>val*.35+Math.sin(i*.9+idx)*Math.max(2,val*.15)+(i%3)*2);const p=this.container?.querySelector(`[data-eps-role="${role}Line"]`);if(p)p.setAttribute('points',sparkPoints(vals,150,55,5));});
  }
}

export class IndustrialInfographicTheme extends EpsThemeBase{
  constructor(){super('eps-industrial','صنعتی اینفوگرافیک');}
  template(){
    return `<div class="eps-heading"><div><small>EPS · 2323929</small><h2>Industrial Infographic</h2></div><span>کلاس IndustrialInfographicTheme</span></div>
    <div class="eps-grid eps-industrial-grid">
      <article class="eps-card eps-industrial-rings">
        ${[['indSpeed','سرعت','#d6ff52'],['indRpm','RPM','#29f676'],['indCool','دما','#e91455'],['indLoad','بار','#ff6e39']].map(([r,t,c])=>`<div class="eps-bevel-ring" data-eps-role="${r}Ring" style="--eps-ring-color:${c};--eps-progress:0%"><div><strong data-eps-role="${r}Value">۰</strong><small>${t}</small></div></div>`).join('')}
      </article>
      <article class="eps-card eps-industrial-timeline"><header><b>Timeline ECU</b><span>2026</span></header><div class="eps-timeline">${['اتصال','شناسایی','خواندن','تحلیل','گزارش'].map((x,i)=>`<i class="${i<4?'done':''}"><b>${i+1}</b><small>${x}</small></i>`).join('')}</div></article>
      <article class="eps-card eps-industrial-meters">
        ${[['meterSpeed','سرعت','#d6ff52'],['meterRpm','RPM','#126cff'],['meterLoad','بار','#bd10ff'],['meterCool','دما','#ed154f'],['meterVolt','ولت','#ff7635']].map(([r,t,c])=>`<label><i><u data-eps-role="${r}" style="--meter-color:${c}"></u></i><strong data-eps-role="${r}Value">۰</strong><small>${t}</small></label>`).join('')}
      </article>
      <article class="eps-card eps-industrial-steps">${[['01','اتصال'],['02','ECU'],['03','DTC'],['04','PDF']].map(([n,t],i)=>`<div style="--step-color:${['#35fb7a','#0d6cff','#ed1550','#ff732f'][i]}"><b>${n}</b><span><strong>${t}</strong><small>وضعیت آماده</small></span></div>`).join('')}</article>
    </div>`;
  }
  update(l={}){
    super.update(l);
    const s=clamp(l.speedKph,0,220),r=clamp(l.rpm,0,7000),c=clamp(l.coolantC??0,0,120),load=clamp(l.engineLoad??0,0,100),v=clamp(l.voltage??0,0,16);
    const ring=(role,val,max,text)=>{this.css(`${role}Ring`,'--eps-progress',`${val/max*100}%`);this.text(`${role}Value`,text)};
    ring('indSpeed',s,220,fmt(s));ring('indRpm',r,7000,fmt(r/1000,1));ring('indCool',c,120,fmt(c));ring('indLoad',load,100,fmt(load));
    [['meterSpeed',s/220,fmt(s)],['meterRpm',r/7000,fmt(r/1000,1)],['meterLoad',load/100,fmt(load)],['meterCool',c/120,fmt(c)],['meterVolt',v/16,fmt(v,1)]].forEach(([role,p,text])=>{this.css(role,'height',`${Math.max(6,p*100)}%`);this.text(`${role}Value`,text)});
  }
}

export const EPS_THEME_IDS=['eps-neon','eps-color','eps-mobile','eps-industrial'];
export class EpsThemeRegistry{
  constructor(){this.themes=new Map([new NeonAnalyticsTheme(),new ColorMetricsTheme(),new MobileGradientTheme(),new IndustrialInfographicTheme()].map(x=>[x.id,x]));this.active=null;}
  apply(id,container,live={}){
    if(this.active)this.active.unmount();
    this.active=this.themes.get(id)||null;
    if(this.active)this.active.mount(container,live);
    else if(container){container.hidden=true;container.innerHTML='';}
    return this.active;
  }
  update(live){this.active?.update(live);}
  get(id){return this.themes.get(id);}
}
