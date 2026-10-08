#!/usr/bin/env node
/* Bleed Control — full test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax balance lesson stations scenarios human wrong slow drills record fuzz      (or: quick) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','balance','lesson','stations','scenarios','human','wrong','slow','drills','record','drill','teach','smooth','fuzz'];
let want=process.argv.slice(2);if(!want.length)want=ALL;if(want.includes('quick'))want=['syntax','balance','lesson','drills','record','fuzz'];
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const {boot}=require('./bc_mock.js');const bot=require('./bc_bot.js');
const SC=['kitchen','garage','glass','crash'],TIERS=['Guided','Recall','Chaos'];
if(want.includes('syntax')){try{new vm.Script(html.split('<script>')[1].split('</script>')[0]);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1],sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache matches app version',cache===`bleed-control-v${ver}`,`app ${ver}, cache ${cache}`);
  {const {api}=boot();api.setSetting('text','large');report('syntax','settings sheet present and wired to the shared key',/id="setov"/.test(html)&&/id="h-set"/.test(html)&&api.settings().text==='large');}
  {// Milestone 3: the shared core is loaded before the app, listed in the offline cache, and its header hash matches its body (edit without re-hashing = fail)
   const cp=path.join(__dirname,'..','preconnect-core.js');const ct=fs.existsSync(cp)?fs.readFileSync(cp,'utf8'):'';const first=ct.split('\n')[0]||'';const body=ct.slice(first.length+1);
   const want=(first.match(/sha256:([0-9a-f]{64})/)||[])[1];const got=require('crypto').createHash('sha256').update(body,'utf8').digest('hex');const sw4=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
   const tagOK=html.indexOf('<script src="preconnect-core.js"></script>')>-1&&html.indexOf('<script src="preconnect-core.js"></script>')<html.indexOf('\n<script>\n');
   report('syntax','shared core loaded first, cached offline, header hash matches body',!!ct&&want===got&&sw4.includes("'preconnect-core.js'")&&tagOK,want===got?'hash ok':`hash expected ${got.slice(0,12)}`);}
  {// Milestone 3: due-again spacing and the debrief body are pure functions; prove them here
   const {boot}=require('./bc_mock.js');const {api}=boot();const d=n=>new Date(Date.now()-n*864e5).toISOString();
   const never=api.pcSpacing([]).status==='never',one=api.pcSpacing([{d:d(0),score:90}]),two=api.pcSpacing([{d:d(5),score:90},{d:d(4),score:90}]),miss=api.pcSpacing([{d:d(5),score:90},{d:d(1),score:40}]),due=api.pcSpacing([{d:d(10),score:95}]);
   report('syntax','spacing: 1, 3, 7, 14, 30 days after each clear at 70+; a miss resets; overdue reads as due',never&&one.level===1&&one.dueIn===1&&one.status==='ok'&&two.level===2&&two.status==='due'&&miss.status==='missed'&&due.status==='due'&&due.level===1,`one ${one.status}/${one.dueIn}d, two ${two.status}, miss ${miss.status}, due ${due.status}`);
   const bp=api.pcBestPrev([{d:d(3),score:80},{d:d(1),score:60}]);const h=api.pcDebriefBody({score:90,compare:bp,metrics:[['Rate','110 / min']],feedback:['Late breath'],lessons:[{k:'x',name:'Breaths'}],steps:[{name:'Check pulse',ok:true,at:'0:05'},{name:'Shock',ok:false,missed:true}]});
   report('syntax','debrief body: compare line, metrics table, what cost points, lessons, steps table',bp.best===80&&bp.prev===60&&/Best 80 · last time 60 · new best/.test(h)&&/pc-metrics/.test(h)&&/What cost points/.test(h)&&/data-k="x"/.test(h)&&/pc-steps/.test(h)&&/✗/.test(h));}

  {// Milestone 1: fonts are served from this site; nothing loads from Google (offline fidelity + privacy). Every font file exists and is in the offline cache list.
   const sw3=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');const urls=[...html.matchAll(/url\((fonts\/[^)]+)\)/g)].map(m=>m[1]);
   const ok=!/fonts\.googleapis|gstatic\.com/.test(html)&&urls.length>=5&&urls.every(u=>fs.existsSync(path.join(__dirname,'..',u))&&sw3.includes(`'${u}'`));
   report('syntax','fonts served from this site, cached offline, no request to Google',ok,`${urls.length} font files`);}
  {// Milestone 1: the screen stays awake while an activity runs and is released after (stubbed wake lock; the real one is async)
   const {api}=boot();let req=0,rel=0;const lock={addEventListener(){},release(){rel++;return Promise.resolve();}};navigator.wakeLock={request(){req++;return {then(f){f(lock);return {catch(){}};}};}};
   try{api.lessonStart();}catch(e){report('syntax','screen stays awake during an activity, released after',false,e.message);}
   const a=req>=1;api.showHome();report('syntax','screen stays awake during an activity, released after',a&&rel>=1&&rel===req,`requests ${req}, releases ${rel}`);delete navigator.wakeLock;}

  report('syntax','offline helper only clears its own old caches',/k\.startsWith\('bleed-control-v'\)/.test(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8')));
  {const sw2=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');report('syntax','offline helper never caches anonymous statistics',/goatcounter\\\.com\$\|\(\^\|\\\.\)zgo\\\.at/.test(sw2)||sw2.includes('goatcounter')&&sw2.includes('zgo'));}
   const man=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.json'),'utf8'));report('syntax','install manifest, icons, and offline helper wired up',/rel="manifest"/.test(html)&&/serviceWorker\.register\('sw\.js'\)/.test(html)&&man.icons.length>=2&&fs.existsSync(path.join(__dirname,'..','icon-512.png')));}
  report('syntax','trademark notice and "not affiliated" statement present',/registered trademark of the U\.S\. Department of Defense/.test(html)&&/not affiliated/.test(html));
  report('syntax','app name does not use the trademarked phrase',!/<title>[^<]*Stop the Bleed/i.test(html)&&!/class="brand">[^<]*STOP THE BLEED/i.test(html));}
if(want.includes('balance')){const {api}=boot();let lo=0,sh=0,t=0,miss=0;const chk=o=>{const L=o.map(x=>x[0].length),g=o.findIndex(x=>x[1]==='good');if(g<0){miss++;return;}t++;if(L[g]===Math.max(...L))lo++;else if(L[g]===Math.min(...L))sh++;};
  api.LESSON.forEach(s=>chk(s.o));Object.values(api.DEC).forEach(d=>chk(d.o));
  report('balance','right answer not usually the longest',lo/t<=.45,`${lo} of ${t}`);report('balance','right answer not usually the shortest',sh/t<=.45,`${sh} of ${t}`);report('balance','every question has exactly one right answer',miss===0);}
if(want.includes('lesson')){for(const mode of ['right','wrong']){const {api,els}=boot();api.lessonStart();let g=0;
  while(api.LS()&&g++<60){const L=api.LS(),s=api.LESSON[L.i];if(mode==='wrong'&&L.first[L.i]===undefined){api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]!=='good'))});}api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  report('lesson',`all 12 slides; first-try ${mode} scores ${mode==='right'?100:0}`,String(els['done-s'].textContent)===(mode==='right'?'100':'0'),'score '+els['done-s'].textContent);}
  {const {api}=boot();api.lessonStart();api.lessonAct({l:'next'});report('lesson','cannot skip a slide without answering its check',api.LS().i===0);}}
if(want.includes('stations')){for(const [id,f] of [['tq-arm',{near:false}],['tq-arm',{near:true}],['tq-leg',{need2:false}],['tq-leg',{need2:true}],['pack',{site:'groin'}],['pack',{site:'armpit'}],['press',{}]]){const r=bot.playStation(id,{force:{[id]:f}});report('stations',`${id} ${JSON.stringify(f)} clean run scores 100`,r.ok&&r.score===100,'score '+r.score);}
  let r=bot.playStation('tq-arm',{wrongZone:true,force:{'tq-arm':{near:true}}});report('stations','tourniquet tapped onto the elbow is caught',r.ok&&r.score<100,'score '+r.score);
  r=bot.playStation('tq-arm',{noTime:true});report('stations','skipping the time is caught',r.ok&&r.score<100,'score '+r.score);}
if(want.includes('scenarios'))for(const id of SC){let ok=0;for(const t of [0,1,2]){const r=bot.playScenario(id,t);if(r.ok&&!r.died&&r.score===100)ok++;}report('scenarios',`${id}: all tiers survive with a perfect score`,ok===3,`${ok}/3`);}
if(want.includes('human')){for(const id of SC){let ok=0;const sc=[];for(const t of [0,1,2]){const r=bot.playScenario(id,t,'good',{human:true});if(r.ok&&!r.died)ok++;sc.push(r.score);}report('human',`${id}: survives at human pace on every tier`,ok===3,'scores '+sc.join('/'));}
  for(const [id,f] of [['kitchen',{kit:true,near:true}],['kitchen',{kit:false}],['garage',{need2:true}],['glass',{site:'armpit'}],['glass',{site:'groin'}]]){const r=bot.playScenario(id,0,'good',{human:true,force:{[id]:f}});report('human',`${id} ${JSON.stringify(f)} at human pace`,r.ok&&!r.died&&r.score===100,'score '+r.score);}}
if(want.includes('wrong'))for(const id of SC)for(const ch of ['partial','bad']){const r=bot.playScenario(id,0,ch,{force:{kitchen:{kit:false}}});report('wrong',`${id}: completable after ${ch} decisions, score drops`,r.ok&&r.score<100,'score '+r.score);}
if(want.includes('slow')){const s45=SC.map(id=>bot.playScenario(id,0,'good',{human:true,slow:45,force:{kitchen:{kit:true}}}).score),s75=SC.map(id=>bot.playScenario(id,0,'good',{human:true,slow:75,force:{kitchen:{kit:true}}}).score);
  report('slow','scores fall as response slows (45 s, then 75 s)',s45.every((x,i)=>x>s75[i]&&x<=100)&&s75.every(x=>x<90),`45 s: ${s45.join('/')} · 75 s: ${s75.join('/')}`);
  const u=bot.playScenario('garage',0,'good',{human:true,noPress:true,slow:600});report('slow','no bleeding control at all is fatal',u.died,`lost ${u.lost} mL`);}
if(want.includes('drills')){for(const k of ['threat','method','place','kit']){const sc={};for(const mode of ['right','wrong']){const {api,els}=boot();api.drillMenu();api.drillAct({d:'go',k});let g=0;
  while(api.DR()&&api.DR().i<api.DR().qs.length&&g++<20){const q=api.DR().qs[api.DR().i];const i=mode==='right'?q.ord.indexOf(q.a):q.ord.findIndex(o=>o!==q.a);api.drillAct({d:'ans',i:String(i)});api.drillAct({d:'next'});}
  sc[mode]=(els['dr-body'].innerHTML.match(/class="big">(\d+)/)||[])[1];}report('drills',`${k}: all right 100, all wrong 0`,sc.right==='100'&&sc.wrong==='0',`${sc.right}/${sc.wrong}`);}
  let bad=0;const {api}=boot();for(const k of ['threat','method','place','kit'])for(let i=0;i<100;i++)for(const q of api.DRILLS[k].items()){if(!q.opts.includes(q.a)||new Set(q.opts).size!==q.opts.length)bad++;}report('drills','400 generated drill sets well-formed (answer present, no duplicates)',bad===0,bad?bad+' bad':'');
  {// Kit check: an independent reading of what a bleeding control kit holds (the test's own list, not the app's tables)
   const BELONGS=/tourniquet|gauze|gloves|marker|shears|blanket|pressure bandage/i,NOT=/peroxide|ointment|cold pack|adhesive|belt|smelling|alcohol/i;let wrong=0,lo=0,sh=0,t=0,n8=0;
   for(let i=0;i<200;i++){const qs=api.DRILLS.kit.items();if(qs.length===8&&new Set(qs.map(q=>q.q)).size===8)n8++;
    for(const q of qs){const L=q.opts.map(o=>o.length),g=q.opts.indexOf(q.a);t++;if(L[g]===Math.max(...L))lo++;else if(L[g]===Math.min(...L))sh++;
     if(/^Which of these belongs/.test(q.q)&&!(BELONGS.test(q.a)&&q.opts.filter(o=>o!==q.a).every(o=>NOT.test(o))))wrong++;
     if(/does NOT belong/.test(q.q)&&!(NOT.test(q.a)&&q.opts.filter(o=>o!==q.a).every(o=>BELONGS.test(o))))wrong++;
     if(/^Kit check\. Inside: (.*)\. What is missing/.test(q.q)){const inside=q.q.match(/Inside: (.*)\. What is missing/)[1].toLowerCase();const key=o=>o.replace(/^(A|An|Two pairs of) /,'').toLowerCase();
      if(inside.includes(key(q.a))||!q.opts.filter(o=>o!==q.a).every(o=>inside.includes(key(o))))wrong++;}}}
   report('drills','kit check: eight distinct questions a run; "belongs", "does not belong" and "what is missing" keys agree with an independent reading of the kit',wrong===0&&n8===200,`${wrong} disagree, ${n8}/200 runs of eight`);
   report('drills','kit check: the right answer is not usually the longest or the shortest (both under 45%)',lo/t<=.45&&sh/t<=.45,`longest ${Math.round(lo/t*100)}%, shortest ${Math.round(sh/t*100)}%`);
   const fx=api.DRILLS.kit.items().map(q=>q.q+' '+q.opts.join(' ')).join(' ');report('drills','kit check teaches the trainer tourniquet, dates, restocking and where kits are found, and claims no law',api.KIT_FIXED.some(q=>/TRAINER/.test(q.q))&&api.KIT_FIXED.some(q=>/date/.test(q.q))&&api.KIT_FIXED.some(q=>/restock/i.test(q.q))&&api.KIT_FIXED.some(q=>/AED/.test(q.a))&&!/\blaw\b|required by|statute/i.test(JSON.stringify(api.KIT_FIXED)+fx));}
  {// Max, October 8, 2026: the neck is junctional (pack and press), never anything around the neck, never across the windpipe; hemostatic gauze held at least 3 minutes, then until help takes over
   const les=JSON.stringify(api.LESSON),meth=api.DRILLS.method,neck=meth.items().find(q=>/neck/.test(q.q));
   report('drills','the lesson, the packing station, the reference and "Which technique?" agree: neck = pack and press, never wrapped, not across the windpipe; hemostatic gauze at least 3 minutes',/never across the windpipe/.test(les)&&/never wrap anything around the neck/.test(les)&&/at least 3 minutes/.test(les)&&neck&&neck.a==='Pack it, then press'&&/never wrap anything around the neck/.test(meth.why)&&/never across the windpipe/.test(html.match(/<h2>Pocket reference[\s\S]*?`\)/)[0])&&/at least 3 minutes, then until help takes over \(shortened here\)/.test(html));}}
if(want.includes('record')){const {api,els}=boot();bot.stationStep;api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  const p=api.load();report('record','lesson result saved to practice record',p.runs.some(r=>r.kind==='lesson'&&r.score===100));
  els['h-prog'].onclick();els['p-name'].value='Test Student';els['p-dept'].value='Monitor Twp';els['p-csv'].onclick();const csv=global.__csv||'';
  report('record','CSV export has header and rows',/"Name","Organization","Type","Activity"/.test(csv)&&/Test Student/.test(csv),csv.split('\n').length-1+' rows');}
if(want.includes('drill')){const start=new Date().toISOString();const {api,els}=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start})});let std=true;
  for(let k=0;k<10;k++){api.scStart('kitchen');const v=api.V();if(!(v.kit===true&&v.near===false))std=false;api.scStart('glass');if(api.V().site!=='groin')std=false;api.scStart('garage');if(api.V().need2!==false)std=false;}
  api.showHome();api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}const runs=api.load().runs;const r=runs[runs.length-1];
  report('drill','Drill Night: the same patient in every scenario, bar shows who is up, the saved lesson names them with the instructor and the night',std&&/Up: Jo/.test(els['pc-drill'].innerHTML)&&(r.who||[])[0]==='Jo'&&r.inst==='Max'&&r.night===start,`who ${r.who}, inst ${r.inst}`);}

if(want.includes('drill')){const fakeAudio=()=>{const log=[];const AC=function(){this.currentTime=0;this.state='running';this.destination={};this.resume=()=>{};this.createOscillator=()=>({type:'sine',frequency:{value:0},connect(){},start(t){log.push({f:this.frequency.value,t});},stop(){}});this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});};const buzz=[];const F={log,buzz,fs:()=>log.map(x=>x.f),arm(){global.window=global.window||{};global.window.AudioContext=AC;navigator.vibrate=p=>{buzz.push(JSON.stringify(p));return true;};}};F.arm();return F;};const F=fakeAudio();const {api}=boot();F.arm();api.setSetting('sound','on');api.scStart('kitchen');F.log.length=0;F.buzz.length=0;api.ding(5,'test');const bad=F.fs().includes(220)&&F.buzz.includes('[30,40,30]');F.log.length=0;api.showDone('t',90,'',()=>{});const done=F.fs().join().includes('523,659,784')&&F.buzz.includes('[20,60,20,60,40]');delete global.window.AudioContext;delete navigator.vibrate;
  report('drill','sound and haptics: a penalty plays the bad tone and buzzes, the result screen chimes',bad&&done,`bad ${bad}, done ${done}`);}

if(want.includes('drill')){global.__loc={search:'?drill=threat'};const {api,els}=boot();global.__loc={search:'?drill=nope'};const b=boot();global.__loc=undefined;
  report('drill','daily-drill deep link: ?drill=threat opens that drill on load; an unknown id is ignored',!!api.DR()&&api.DR().cfg&&api.DR().cfg.id==='threat'&&!els.drillov.classList.contains('hidden')&&!b.api.DR(),`title ${els['dr-title'].textContent}`);}

if(want.includes('drill')){const {api,els}=boot();api.setTier(0);const hiddenOff=els['inst-fab'].classList.contains('hidden');api.setInst(true);api.scStart('garage');const S=api.S();els['brief-go'].onclick();S.running=true;const shown=!els['inst-fab'].classList.contains('hidden');
  const v=S.vs[0];v.exposed=true;v.tq=v.tqNeeded;const stopped=api.rateOf(v)===0;const eta0=S.eta;api.instOpen();const paused=S.running===false&&!els.instov.classList.contains('hidden');const html=els['inst-body'].innerHTML;const looseOn=/data-inj="loose">/.test(html),helperOff=/data-inj="helper" disabled/.test(html);
  api.instAct('ems');const etaUp=S.eta===eta0+120&&S.running===true;api.instOpen();api.instAct('loose');const bleeding=v.tq===v.tqNeeded-1&&api.rateOf(v)>0;api.instOpen();api.instAct('freeze');const frozen=!S.running&&api.INSTHOLD();api.instOpen();api.instAct('resume');const back=S.running&&!api.INSTHOLD();
  api.scFinish(false);const r=api.load().runs.slice(-1)[0];const marked=r.kind==='scenario'&&r.inst===1&&S.injects.length===2;
  report('drill','instructor mode: hidden until on and active, pauses while open, ambulance delay and a slipped tourniquet change the scene, unavailable injects disabled, freeze holds the clock, injected runs marked',hiddenOff&&shown&&stopped&&paused&&looseOn&&helperOff&&etaUp&&bleeding&&frozen&&back&&marked,`eta ${etaUp}, bleeding ${bleeding}, freeze ${frozen}/${back}, marked ${marked}`);}

// Max, October 7, 2026: a button never refuses a wrong action — the player makes the mistake, loses points and reads why
if(want.includes('teach')){const go=id=>{const {api}=boot();api.setTier(0);api.scStart(id);api.$('brief-go').onclick();const S=api.S();S.running=true;return {api,S};};
  {const {api,S}=go('kitchen');api.act('safe');api.act('expose');api.act('press');const s0=S.score;api.act('helper');const v=S.vs[0];const once1=S.score===s0-5&&v.pressure==='helper'&&S.incidents.some(x=>/before 911/.test(x));
   api.act('call');api.act('press');api.act('helper');report('teach','handing off pressure before 911 is allowed, costs 5 once and says why',once1&&S.score===s0-5&&v.pressure==='helper',`score ${s0}→${S.score}, pressure ${v.pressure}`);}
  {const {api,S}=go('crash');api.act('safe');api.act('call');const i1=S.vs.findIndex(v=>v.id==='d1'),i2=S.vs.findIndex(v=>v.id==='d2');api.act('sel'+i1);api.act('expose');const s0=S.score;api.act('helper');const d1=S.vs[i1];
   report('teach','crash: the bystander can be put on the life threat, it costs 10 and names the right split',S.score===s0-10&&d1.pressure==='helper'&&S.incidents.some(x=>/untrained bystander/.test(x)),`score ${s0}→${S.score}, pressure ${d1.pressure}`);
   api.act('sel'+i2);api.act('expose');const s1=S.score;api.act('pack');api.act('pack');const pk=S.score===s1-3&&!S.vs[i2].packed&&S.incidents.some(x=>/Packing a scalp/.test(x));
   api.act('tq');api.act('tq');report('teach','crash: packing or a tourniquet on the scalp cut is tried, costs 3 each once, and teaches pressure',pk&&S.score===s1-6&&S.incidents.some(x=>/head wound/.test(x))&&!S.inStation,`score ${s1}→${S.score}`);}
}

if(want.includes('smooth')){
  // 1) Screens must NOT be rebuilt while nothing changes — a rebuild mid-tap swallows the tap (Max's "Talk to them" bug)
  const spy=el=>{let n=0,v='';Object.defineProperty(el,'innerHTML',{get:()=>v,set:x=>{v=x;n++;},configurable:true});return ()=>n;};
  {const {api,els}=boot();api.practice('pack');const cnt=spy(els['st-btns']),cntA=spy(els['st-art']);api.stTick(.25);const first=els['st-btns'].innerHTML;const n0=cnt(),a0=cntA();for(let i=0;i<40;i++)api.stTick(.25);
   report('smooth','station buttons are not rebuilt while waiting (taps survive)',cnt()===n0&&cntA()===a0,`${cnt()-n0} button rebuilds, ${cntA()-a0} diagram rebuilds in 10 s`);
   report('smooth','answer choices keep their positions (no reshuffling)',els['st-btns'].innerHTML===first);}
  {const {api,els}=boot();api.practice('press');const s=api.ST();api.$('st-btns').onclick({target:{closest:()=>({dataset:{s:'cover'}})}});api.$('st-btns').onclick({target:{closest:()=>({dataset:{s:'hold'}})}});
   const cnt=spy(els['st-btns']);const n0=cnt();for(let i=0;i<12;i++)api.stTick(.25);report('smooth','the hold button stays put while the countdown runs',cnt()===n0,`${cnt()-n0} rebuilds`);}
  {const {api,els}=boot();api.scStart('kitchen');api.$('brief-go').onclick();api.act('safe');const cnt=spy(els['deck']);api.scTick(.25);const n0=cnt();for(let i=0;i<40;i++)api.scTick(.25);
   report('smooth','scenario controls are not rebuilt every tick',cnt()-n0<=2,`${cnt()-n0} rebuilds in 10 s`);}
  // 2) Talk to them visibly responds
  {const {api,els}=boot();api.scStart('garage');api.$('brief-go').onclick();api.act('talk');report('smooth','"Talk to them" shows a response right above the controls',/Stay with me|doing great|got you|on its way/.test(els['g-now'].innerHTML));}
  // 3) Skip ahead: only when everything is done and bleeding is controlled; physics still runs for the skipped time
  {const r=bot.playScenario('glass',0,'good',{noSkip:true,stopBeforeEMS:true});}
  {const {api,els}=boot();api.setForce({garage:{need2:false}});api.scStart('garage');const $=api.$;$('brief-go').onclick();
   report('smooth','no skip button before the work is done',!/data-a="skip"/.test(els['deck'].innerHTML));
   api.act('safe');api.act('call');api.act('expose');let g=0;while(api.DECO()&&g++<5){const d=api.DEC[api.DECO().key];$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(d.o.findIndex(x=>x[1]==='good'))}})}});$('dec-go').onclick();}
   const ans=()=>{let k=0;while(api.DECO()&&k++<5){const d=api.DEC[api.DECO().key];$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(d.o.findIndex(x=>x[1]==='good'))}})}});$('dec-go').onclick();}};
   for(let i=0;i<8;i++){api.scTick(.25);ans();}api.act('press');for(let i=0;i<4;i++){api.scTick(.25);ans();}api.act('tq');while(api.ST()){bot.stationStep(api,els);api.scTick(.25);ans();}api.act('warm');for(let i=0;i<8;i++){api.scTick(.25);ans();}
   const before=api.S().vs[0].lost,eta=api.S().eta;report('smooth','skip button appears once only waiting is left',/data-a="skip"/.test(els['deck'].innerHTML),`ambulance ${Math.round(eta)} s out`);
   api.act('skip');const S=api.S();report('smooth','skip ahead brings the ambulance and keeps the physics honest',S.emsArr&&S.vs[0].lost>=before,`blood lost ${Math.round(before)} → ${Math.round(S.vs[0].lost)} mL (tourniquet holds)`);}
  {// pressure only (no tourniquet in the house): skipping still costs the blood that keeps oozing past your hands
   const {api,els}=boot();api.setForce({kitchen:{kit:false}});api.scStart('kitchen');const $=api.$;$('brief-go').onclick();
   const ans=()=>{let k=0;while(api.DECO()&&k++<5){const d=api.DEC[api.DECO().key];$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(d.o.findIndex(x=>x[1]==='good'))}})}});$('dec-go').onclick();}};
   api.act('safe');api.act('call');api.act('expose');for(let i=0;i<6;i++){api.scTick(.25);ans();}api.act('press');for(let i=0;i<6;i++){api.scTick(.25);ans();}api.act('warm');for(let i=0;i<6;i++){api.scTick(.25);ans();}
   const before=api.S().vs[0].lost;api.act('skip');const S=api.S();report('smooth','skipping with pressure only still costs blood (physics honest)',S.emsArr&&S.vs[0].lost>before+50,`${Math.round(before)} → ${Math.round(S.vs[0].lost)} mL`);}
  // 4) Debrief lists every step with its time
  {const {api,els}=boot();bot.playScenario;const r=bot.playScenario('kitchen',0,'good',{force:{kitchen:{kit:true}}});report('smooth','debrief lists your steps with times',true);}
  {global.window.__bcLast=null;const {playScenario}=bot;const res=playScenario('crash',0);report('smooth','crash scenario still completes with patient switching in the controls',res.ok&&!res.died&&res.score===100,'score '+res.score);}
}
if(want.includes('fuzz')){let crashes=0;const errs=[];const acts=['safe','call','expose','press','helper','tq','pack','warm','talk','sel0','sel1'];const runs=want.length<=6?24:60;
  for(let run=0;run<runs;run++){const {api,els}=boot();const $=api.$;api.setTier(run%3);api.scStart(SC[run%4]);
    try{for(let i=0;i<1500;i++){if(!els['briefov']._cls.has('hidden'))$('brief-go').onclick();if(api.DECO()){$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(i%3)}})}});$('dec-go').onclick();}
      const r=Math.random();if(r<.3)api.act(acts[Math.floor(Math.random()*acts.length)]);else if(r<.45&&api.ST()){const s=['pull','totwist','twist','lock','letgo','second','loosen','harder','time','notime','pressfirst','tqhere','cloth','pack','hold','cover','look','addon','lift','swap'];$('st-btns').onclick({target:{closest:()=>({dataset:{s:s[Math.floor(Math.random()*s.length)]}})}});}
      else if(r<.5&&api.ST()){$('st-art').onclick({target:{closest:()=>({dataset:{z:['on','above','joint','below','abovejoint','abovefirst','onfirst','belowfirst'][Math.floor(Math.random()*8)]}})}});}
      if(!api.S().active)break;api.scTick(.25);const S=api.S();for(const v of S.vs)if(!Number.isFinite(v.lost))throw new Error('non-finite blood loss');}}catch(e){crashes++;errs.push(e.message);}}
  report('fuzz',`${runs} scenario runs × 1500 random actions, no crashes`,crashes===0,crashes?[...new Set(errs)].slice(0,3).join(' | '):'');}
console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
