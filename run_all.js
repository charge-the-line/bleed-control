#!/usr/bin/env node
/* Bleed Control — full test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax balance lesson stations scenarios human wrong slow drills record fuzz      (or: quick) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','balance','lesson','stations','scenarios','human','wrong','slow','drills','record','fuzz'];
let want=process.argv.slice(2);if(!want.length)want=ALL;if(want.includes('quick'))want=['syntax','balance','lesson','drills','record','fuzz'];
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const {boot}=require('./bc_mock.js');const bot=require('./bc_bot.js');
const SC=['kitchen','garage','glass','crash'],TIERS=['Guided','Recall','Chaos'];
if(want.includes('syntax')){try{new vm.Script(html.split('<script>')[1].split('</script>')[0]);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const ver=(html.match(/APP_VERSION='([^']+)'/)||[])[1],sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache matches app version',cache===`bleed-control-v${ver}`,`app ${ver}, cache ${cache}`);
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
if(want.includes('drills')){for(const k of ['threat','method','place']){const sc={};for(const mode of ['right','wrong']){const {api,els}=boot();api.drillMenu();api.drillAct({d:'go',k});let g=0;
  while(api.DR()&&api.DR().i<api.DR().qs.length&&g++<20){const q=api.DR().qs[api.DR().i];const i=mode==='right'?q.ord.indexOf(q.a):q.ord.findIndex(o=>o!==q.a);api.drillAct({d:'ans',i:String(i)});api.drillAct({d:'next'});}
  sc[mode]=(els['dr-body'].innerHTML.match(/class="big">(\d+)/)||[])[1];}report('drills',`${k}: all right 100, all wrong 0`,sc.right==='100'&&sc.wrong==='0',`${sc.right}/${sc.wrong}`);}
  let bad=0;const {api}=boot();for(const k of ['threat','method','place'])for(let i=0;i<100;i++)for(const q of api.DRILLS[k].items()){if(!q.opts.includes(q.a)||new Set(q.opts).size!==q.opts.length)bad++;}report('drills','300 generated drill sets well-formed (answer present, no duplicates)',bad===0,bad?bad+' bad':'');}
if(want.includes('record')){const {api,els}=boot();bot.stationStep;api.lessonStart();while(api.LS()){const s=api.LESSON[api.LS().i];api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
  const p=api.load();report('record','lesson result saved to practice record',p.runs.some(r=>r.kind==='lesson'&&r.score===100));
  els['h-prog'].onclick();els['p-name'].value='Test Student';els['p-dept'].value='Monitor Twp';els['p-csv'].onclick();const csv=global.__csv||'';
  report('record','CSV export has header and rows',/"Name","Organization","Type","Activity"/.test(csv)&&/Test Student/.test(csv),csv.split('\n').length-1+' rows');}
if(want.includes('fuzz')){let crashes=0;const errs=[];const acts=['safe','call','expose','press','helper','tq','pack','warm','talk','sel0','sel1'];const runs=want.length<=6?24:60;
  for(let run=0;run<runs;run++){const {api,els}=boot();const $=api.$;api.setTier(run%3);api.scStart(SC[run%4]);
    try{for(let i=0;i<1500;i++){if(!els['briefov']._cls.has('hidden'))$('brief-go').onclick();if(api.DECO()){$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(i%3)}})}});$('dec-go').onclick();}
      const r=Math.random();if(r<.3)api.act(acts[Math.floor(Math.random()*acts.length)]);else if(r<.45&&api.ST()){const s=['pull','totwist','twist','lock','letgo','second','loosen','harder','time','notime','pressfirst','tqhere','cloth','pack','hold','cover','look','addon','lift','swap'];$('st-btns').onclick({target:{closest:()=>({dataset:{s:s[Math.floor(Math.random()*s.length)]}})}});}
      else if(r<.5&&api.ST()){$('st-art').onclick({target:{closest:()=>({dataset:{z:['on','above','joint','below','abovejoint','abovefirst','onfirst','belowfirst'][Math.floor(Math.random()*8)]}})}});}
      if(!api.S().active)break;api.scTick(.25);const S=api.S();for(const v of S.vs)if(!Number.isFinite(v.lost))throw new Error('non-finite blood loss');}}catch(e){crashes++;errs.push(e.message);}}
  report('fuzz',`${runs} scenario runs × 1500 random actions, no crashes`,crashes===0,crashes?[...new Set(errs)].slice(0,3).join(' | '):'');}
console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
