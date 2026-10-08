// Plays Bleed Control: the skill stations and the scenarios, at instant or human pace.
const {boot}=require('./bc_mock.js');
// Station helper: completes whatever station is open, the way a competent student would.
function stationStep(api,els,o={}){const s=api.ST();if(!s)return false;const $=api.$;const click=a=>$('st-btns').onclick({target:{closest:()=>({dataset:{s:a}})}});
  if(s.kind==='tq'){if(s.phase==='place'||s.phase==='place2'){if(!s.zones)api.stTick(0);const good=s.phase==='place2'?'abovefirst':s.near?'abovejoint':'above';if(o.wrongZone&&!o._wz){o._wz=1;$('st-art').onclick({target:{closest:()=>({dataset:{z:'joint'}})}});return true;}$('st-art').onclick({target:{closest:()=>({dataset:{z:good}})}});return true;}
    if(s.phase==='pull'){if(s.tension<100)click('pull');else click('totwist');return true;}if(s.phase==='twist'){click('twist');return true;}
    if(s.phase==='lock'){click('lock');return true;}if(s.phase==='decide2'){click('second');return true;}if(s.phase==='time'){click(o.noTime?'notime':'time');if(o.noTime&&api.ST()&&api.ST().phase==='time')click('time');return true;}}
  if(s.kind==='coach'){const k=o.coach&&o.coach[s.ci]&&!(o._c=o._c||{})[s.ci]?(o._c[s.ci]=1,o.coach[s.ci]):'good';click('say-'+k);return true;}
  if(s.kind==='self'){if(s.phase==='first'){click(o.selfFirst||'sit');return true;}if(s.phase==='place'){if(!s.zones)api.stTick(0);$('st-art').onclick({target:{closest:()=>({dataset:{z:'above'}})}});return true;}
    if(s.phase==='pull'){if(o.grip&&!o._g){o._g=1;click('grip');return true;}if(s.tension<100)click('brace');else click('totwist');return true;}if(s.phase==='twist'){click('twist');return true;}
    if(s.phase==='lock'){if(o.letgo&&!o._l){o._l=1;click('letgo');return true;}click('lock');return true;}if(s.phase==='call'){if(o.wait&&!o._w){o._w=1;click('wait');return true;}click('call2');return true;}}
  if(s.kind==='pack'){if(s.phase==='start'){click('pressfirst');return true;}if(s.phase==='packing'){click('pack');return true;}if(s.phase==='hold'&&!s.holding){click('hold');return true;}}
  if(s.kind==='press'){if(s.phase==='cover'){click('cover');return true;}if(s.phase==='soak'){click('addon');return true;}if(s.phase==='hold'&&!s.holding){click('hold');return true;}}
  return false;}
function playStation(id,o={}){const {api,els}=boot();api.setForce(o.force||null);api.practice(id);let t=0,nextTap=0;
  while(api.ST()&&t<240){if(t>=nextTap){if(stationStep(api,els,o))nextTap=t+(o.human?1.1:0);}api.stTick(.25);t+=.25;}
  const m=els['done-s'].textContent;return {ok:!api.ST()&&m!=='',score:+m,detail:els['done-b'].innerHTML.replace(/<[^>]+>/g,' ').trim().slice(0,90)};}
function playScenario(id,tier,choice='good',o={}){const {api,els}=boot();api.setTier(tier);api.setForce(o.force||null);api.scStart(id);const $=api.$;let rt=0,nextTap=0,react={};
  const tap=a=>{if(rt<nextTap)return false;api.act(a);nextTap=rt+(o.human?1.2:0);return true;};
  const after=(k,c,d)=>{if(!c){delete react[k];return false;}if(react[k]===undefined)react[k]=rt;return rt-react[k]>=(o.human?d:0);};
  while(rt<900){const S=api.S();
    if(!els['briefov']._cls.has('hidden')){if(after('b',true,2))$('brief-go').onclick();rt+=.25;continue;}
    if(api.DECO()){if(after('d',true,3)){const d=api.DEC[api.DECO().key];let i=d.o.findIndex(x=>x[1]===choice);if(i<0)i=0;$('dec-opts').onclick({target:{closest:()=>({dataset:{i:String(i)}})}});$('dec-go').onclick();}rt+=.25;continue;}
    if(!S.active)break;
    if(api.ST()){if(rt>=nextTap&&stationStep(api,els,o))nextTap=rt+(o.human?1.1:0);api.scTick(.25);rt+=.25;continue;}
    if(o.slow&&rt<o.slow){api.scTick(.25);rt+=.25;continue;}
    const v=S.vs[S.sel||0],kit=api.hasKit();
    if(!S.safe)tap('safe');else if(!S.alerted)tap('call');
    else if(S.id==='crash'){const[d1,d2]=S.vs;if(!d1.exposed){if(S.sel!==0)tap('sel0');else tap('expose');}else if(!d2.exposed){if(S.sel!==1)tap('sel1');else tap('expose');}
      else if(d1.tq<1){if(S.sel!==0)tap('sel0');else tap('tq');}else if(d2.pressure!=='helper'){if(S.sel!==1)tap('sel1');else tap('helper');}
      else if(!d1.warm){if(S.sel!==0)tap('sel0');else tap('warm');}else if(!d2.warm){if(S.sel!==1)tap('sel1');else tap('warm');}}
    else if(S.id==='vein'&&v.standing&&v.exposed)tap('lie');
    else if(!v.exposed)tap('expose');
    else if(v.firstCompT===null&&!o.noPress)tap('press');
    else if(S.id==='vein'&&(!v.raised||v.standing))tap('lie');
    else if(S.id==='vein'&&!S.askedBT)tap('ask');
    else if(v.type==='groin'&&!v.packed)tap('pack');
    else if(kit&&v.type!=='groin'&&v.tq<v.tqNeeded)tap('tq');
    else if(!v.warm)tap('warm');
    if(!kit&&v.firstCompT!==null&&v.pressure!=='you'&&v.pressure!=='helper')tap('press');
    api.scTick(.25);rt+=.25;}
  const S=api.S();const done=els['done-t'].textContent;const stepsShown=(els['done-b'].innerHTML.match(/✓/g)||[]).length;return {stepsShown,ok:!S.active&&done!=='',died:/didn't make it/.test(done),score:+els['done-s'].textContent,lost:Math.round(S.vs[0].lost),incidents:S.incidents,variant:api.V()};}
module.exports={playStation,playScenario,stationStep};
