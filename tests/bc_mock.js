// Headless test harness: loads ../index.html into a fake DOM so bots can play the real app logic.
const fs=require('fs'),path=require('path');
function boot(storeInit){
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const js=html.split('<script>')[1].split('</script>')[0];const els={};
function mk(id){const e={id,_cls:new Set(),style:{},dataset:{},textContent:'',innerHTML:'',value:'',disabled:false,children:[],classList:{add:c=>e._cls.add(c),remove:c=>e._cls.delete(c),toggle:(c,v)=>{(v===undefined?!e._cls.has(c):v)?e._cls.add(c):e._cls.delete(c)},contains:c=>e._cls.has(c)},querySelector(){return mk('q')},querySelectorAll:()=>[],prepend(){},setAttribute(){},closest:()=>null,click(){}};Object.defineProperty(e,'lastChild',{get:()=>({remove(){}})});return e;}
for(const m of html.matchAll(/<[a-z0-9]+([^>]*?)id="([^"]+)"([^>]*)>/g)){const e=mk(m[2]);const cm=(m[1]+' '+m[3]).match(/class="([^"]*)"/);if(cm)cm[1].split(/\s+/).forEach(c=>c&&e._cls.add(c));els[m[2]]=e;}
const store=Object.assign({},storeInit||{});
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
global.document={body:mk('body'),addEventListener(){},getElementById:i=>{if(!els[i])els[i]=mk(i);return els[i];},querySelectorAll:()=>[],createElement:()=>mk('x')};
global.window=Object.assign(global.window||{},{addEventListener(){}});global.location=Object.assign({protocol:'file:'},global.__loc||{});
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'qa'},configurable:true,writable:true});
global.setInterval=()=>{};global.performance=global.performance||{now:()=>0};
global.Blob=function(p){this.parts=p;};global.URL={createObjectURL:b=>{global.__csv=b.parts.join('');return 'x';}};
const api=new Function(require('fs').readFileSync(require('path').join(__dirname,'..','preconnect-core.js'),'utf8')+'\n'+js+';return {KIT_FIXED,kitItems,INJECTS,inject,instOpen,instAct,instClose,instSync,instOn,setInst:v=>{INST=v;instSync();},INSTHOLD:()=>INSTHOLD,rateOf,scFinish,pcCue,pcBuzz,pcFx,ding,showDone,pcDrill,pcDrillStart,pcDrillWho,pcDrillStamp,pcDrillBind,STD_V,pcShuf,pcLessonStart,pcLessonAct,pcQuizStart,pcQuizAct,settings,setSetting,pcSpacing,pcBestPrev,pcDebriefBody,S:()=>S,ST:()=>ST,LS:()=>LS,DR:()=>DR,V:()=>V,DEC,LESSON,SCN,DRILLS,scStart,scTick,stTick,stationOpen,practice,lessonStart,lessonAct,drillMenu,drillAct,act,rateOf,stepsDone:()=>stepsDone,DECO:()=>DEC_OPEN,$,load,setTier:t=>{TIER=t},setForce:f=>{FORCE=f},showHome};')();
return {api,els,store};}
module.exports={boot};
