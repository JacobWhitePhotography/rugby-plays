"use strict";
/* Rugby Plays: animated team playbook. */
/* ---------- Helpers ---------- */
const SVGNS="http://www.w3.org/2000/svg";
function h(tag,attrs,...kids){const el=document.createElement(tag);for(const[k,v] of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==="class")el.className=v;else if(k==="text")el.textContent=v;else if(k.startsWith("on")&&typeof v==="function")el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?"":v)}for(const kid of kids.flat(9)){if(kid==null||kid===false)continue;el.append(kid.nodeType?kid:document.createTextNode(String(kid)))}return el}
function sv(tag,attrs,...kids){const el=document.createElementNS(SVGNS,tag);for(const[k,v] of Object.entries(attrs||{}))if(v!=null)el.setAttribute(k,v);for(const kid of kids.flat(9))if(kid)el.append(kid.nodeType?kid:document.createTextNode(String(kid)));return el}
const clone=o=>JSON.parse(JSON.stringify(o));
const lerp=(a,b,f)=>a+(b-a)*f;
const ease=f=>f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const ICON={
  play:'<path d="M7 4.5v15l12-7.5z"/>',pause:'<path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/>',
  prev:'<path d="M6 5h2.5v14H6zM20 5v14L9.5 12z"/>',next:'<path d="M15.5 5H18v14h-2.5zM4 5v14l10.5-7z"/>',
  restart:'<path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/>'
};
function icon(name){const s=document.createElementNS(SVGNS,"svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");s.innerHTML=ICON[name];return s}
const reduceMotion=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Rugby knowledge ---------- */
const CATS=["Lineout","Scrum","Backs","Defence","Kick-off","Open play"];
const POS={1:"Loosehead prop",2:"Hooker",3:"Tighthead prop",4:"Lock",5:"Lock",6:"Blindside flanker",7:"Openside flanker",8:"Number 8",9:"Scrum-half",10:"Fly-half",11:"Left wing",12:"Inside centre",13:"Outside centre",14:"Right wing",15:"Full-back"};
const NUMS=["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];

/* Coordinates in metres: x 0 = left touchline → 70; y 0 = opposition try line, 100 = our try line. We attack up the screen. */
function scrumAt(sx,sy){return{"1":[sx-1.2,sy+1],"2":[sx,sy+1],"3":[sx+1.2,sy+1],"4":[sx-.6,sy+2.2],"5":[sx+.6,sy+2.2],"6":[sx-1.8,sy+2.4],"7":[sx+1.8,sy+2.4],"8":[sx,sy+3.4]}}
const BASE={
  lineout:{"2":[-1,60],"1":[6,60],"4":[7.5,60],"3":[9,60],"6":[10.5,60],"5":[12,60],"8":[13.5,60],"7":[15,60],"9":[14,63],"10":[22,66],"12":[29,68],"13":[36,69],"11":[4,72],"14":[62,70],"15":[40,80]},
  scrum:{...scrumAt(30,55),"9":[28,56.5],"10":[36,62],"12":[42,63],"13":[49,64],"14":[63,65],"11":[14,62],"15":[42,71]},
  open:{"4":[18,50],"5":[18.8,50.7],"6":[17.2,50.7],"9":[18,52.3],"1":[23,53],"3":[26,53.5],"2":[29,54],"7":[33,54],"8":[12,54],"10":[24,56],"12":[30,57],"13":[37,58],"15":[40,64],"14":[54,60],"11":[7,61]},
  kickoff:{"10":[35,50.5],"6":[20,52],"7":[15,52],"4":[24,52],"5":[27,52],"8":[30,52],"1":[41,53],"2":[45,53],"3":[49,53],"9":[32,55],"12":[54,53],"13":[59,53],"14":[65,53],"11":[9,52],"15":[35,62]}
};

/* Built-in moves library. Each step lists only what changes; b = ball holder or [x,y] in the air. */
function build(id,meta,base,opp,steps){
  let cur=Object.assign(clone(base),clone(opp||{}));const tokens=Object.keys(cur);let ball={h:"9"};const out=[];
  for(const st of steps){if(st.p)for(const[k,v] of Object.entries(st.p))cur[k]=v.slice();if(st.b!=null)ball=typeof st.b==="string"?{h:st.b}:{x:st.b[0],y:st.b[1]};out.push({pos:clone(cur),ball:clone(ball),note:st.n||""})}
  return Object.assign({id,kind:"library",tokens,steps:out},meta);
}
const LIB=[
  build("lib-front-strike",{title:"Front ball strike",cat:"Lineout",call:"Red 4 · Strike 12"},BASE.lineout,{o1:[22,55],o2:[29,56],o3:[36,56],o4:[44,57]},[
    {b:"2",n:"Hooker throws to 4 at the front."},
    {p:{"4":[7.5,59.4]},b:"4",n:"4 catches and gives it straight off the top to 9."},
    {p:{"9":[13,62]},b:"9",n:"9 moves it flat to 10."},
    {p:{"10":[22,64],"12":[27,64],o1:[22,58],o2:[28,59]},b:"10",n:"10 attacks the line. 12 runs hard off his inside shoulder."},
    {p:{"12":[25,57],"10":[21,61],"13":[33,62],o1:[22,59],o2:[29,59.5]},b:"12",n:"12 hits the gap between their 10 and 12."},
    {p:{"12":[24,50],"13":[30,54],"15":[34,62]},b:"12",n:"Support: 13 and 15 trail inside and outside for the offload."}
  ]),
  build("lib-maul",{title:"Middle ball maul",cat:"Lineout",call:"Black 5 · Drive"},BASE.lineout,null,[
    {b:"2",n:"Throw to 5 in the middle of the line."},
    {p:{"5":[12,59.4]},b:"5",n:"5 catches. Lifters 6 and 8 hold him and bring him down safely."},
    {p:{"5":[12,60.6],"6":[11,60.4],"8":[13,60.4],"1":[11,61.6],"3":[13,61.6],"4":[11.8,62.4],"2":[12.6,62.6],"7":[12.2,63.4]},b:"7",n:"Ball goes to the back of the maul. Bind tight, hips low."},
    {p:{"5":[12,54.6],"6":[11,54.4],"8":[13,54.4],"1":[11,55.6],"3":[13,55.6],"4":[11.8,56.4],"2":[12.6,56.6],"7":[12.2,57.4],"9":[14,58.5]},b:"7",n:"Drive straight up the pitch. 9 stays at the back ready to use it."},
    {p:{"5":[12,50.6],"6":[11,50.4],"8":[13,50.4],"1":[11,51.6],"3":[13,51.6],"4":[11.8,52.4],"2":[12.6,52.6],"7":[12.2,53.4],"9":[13.5,54.5],"10":[22,58],"12":[29,60],"13":[36,61]},b:"9",n:"When it slows, 9 takes it off the back and the backs are set to go."}
  ]),
  build("lib-89-blind",{title:"8-9 blindside",cat:"Scrum",call:"Scrum · 89 Blind"},Object.assign({},scrumAt(20,55),{"9":[17.5,56.5],"10":[28,62],"12":[35,63],"13":[42,64],"14":[60,64],"11":[8,61],"15":[32,71]}),{o1:[17,53.5],o2:[7,48]},[
    {b:"9",n:"9 feeds the scrum."},
    {b:"8",n:"Ball comes back to 8's feet. Hold it there."},
    {p:{"8":[18.5,59.5],"9":[16.5,60]},b:"8",n:"8 picks up and goes left, to the short side."},
    {p:{"8":[15,58],"9":[13,59.5],o1:[15,56]},b:"9",n:"8 draws their 9 and pops to our 9 on his outside."},
    {p:{"9":[11,56],"11":[7,57],o2:[8,52]},b:"11",n:"9 gives to 11 hitting the line at pace."},
    {p:{"11":[6,46],"9":[10,50]},b:"11",n:"11 runs the touchline. 9 follows on the inside for the return."}
  ]),
  build("lib-loop",{title:"10 loop round 12",cat:"Scrum",call:"Loop 12"},BASE.scrum,{o1:[37,53],o2:[44,53],o3:[51,54],o4:[60,54]},[
    {b:"9",n:"9 puts in."},
    {p:{"9":[30,59.5]},b:"9",n:"9 collects from the base of the scrum."},
    {p:{"10":[38,61]},b:"10",n:"9 passes to 10."},
    {p:{"10":[40,60],"12":[43,59]},b:"12",n:"10 gives to 12 early and loops round behind him."},
    {p:{"10":[46,59.5],"12":[44,57],o1:[39,56],o2:[44,55.5]},b:"12",n:"12 holds his defender. 10 arrives on his outside."},
    {p:{"10":[50,55],"13":[54,58],"14":[62,58],o3:[51,56]},b:"10",n:"12 gives it back to 10. We now have an extra man outside."},
    {p:{"10":[53,53],"14":[64,50],o4:[59,52]},b:"14",n:"10 draws the last man and puts 14 into space."}
  ]),
  build("lib-switch",{title:"Switch 12",cat:"Backs",call:"Switch"},BASE.open,{o1:[21,46],o2:[28,47],o3:[35,48]},[
    {b:"9",n:"9 at the ruck. 10 and 12 set."},
    {p:{"10":[25,54]},b:"10",n:"9 passes to 10."},
    {p:{"10":[30,52],"12":[28,54],o1:[25,48],o2:[31,49]},b:"10",n:"10 drifts across, taking his man wide. 12 cuts a switch line back inside."},
    {p:{"12":[27,49],"10":[32,51],o2:[32,48]},b:"12",n:"Switch. 12 takes it on an angle into the gap behind their 10."},
    {p:{"12":[24,40],"9":[22,46]},b:"12",n:"12 breaks. 9 tracks on the inside for the offload."}
  ]),
  build("lib-miss13",{title:"Miss to 13, 15 in",cat:"Backs",call:"Miss 13"},BASE.open,{o1:[24,47],o2:[31,47],o3:[38,48],o4:[47,49]},[
    {b:"9",n:"9 at the ruck."},
    {p:{"10":[25,55]},b:"10",n:"9 passes to 10."},
    {p:{"10":[27,53],"15":[37,60]},b:"10",n:"10 straightens to fix his man. 15 starts his run."},
    {p:{"12":[32,54],"13":[38,55],"15":[42,57],o2:[33,49],o3:[40,50]},b:"13",n:"Miss pass over 12 to 13. 12 runs as a decoy."},
    {p:{"13":[42,52],"15":[46,52],"14":[56,54],o3:[42,49],o4:[48,49]},b:"15",n:"13 draws and feeds 15 entering the line."},
    {p:{"15":[50,48],"14":[60,44]},b:"14",n:"15 gives to 14 with a clear overlap."}
  ]),
  build("lib-blitz",{title:"Line speed",cat:"Defence",call:"Blitz"},{"1":[17,62],"3":[23,62],"6":[12,63],"4":[27,63],"10":[33,63.5],"12":[39,64],"13":[46,64.5],"14":[54,65],"2":[29,67],"5":[22,67],"8":[15,68],"7":[19,66],"9":[20,72],"11":[5,66],"15":[35,82]},{o9:[20,58],o10:[27,54],o12:[33,53],o13:[40,52],o14:[50,51]},[
    {b:"o9",n:"Their ruck. Set the line, everyone onside, eyes up."},
    {p:{"4":[27,59],"10":[32,58],"12":[37,57.5],"13":[43,57],"14":[50,57],o10:[27,55]},b:"o10",n:"On the pass the whole line goes together, outside in."},
    {p:{"10":[28.5,56],"4":[26,57],"12":[34,54.5],"13":[40,54],"14":[47,54],o10:[27.5,56]},b:"o10",n:"10 hits their 10 behind the gainline. Outside men shut the space."},
    {p:{"1":[24,59],"3":[27,60],"9":[25,64]},b:"o10",n:"Guards and 9 fold round to the next breakdown."}
  ]),
  build("lib-short-ko",{title:"Short kick-off left",cat:"Kick-off",call:"Short left"},BASE.kickoff,{o1:[20,35],o2:[28,33],o3:[45,30],o4:[55,32]},[
    {b:"10",n:"Everyone onside behind the kicker."},
    {p:{"4":[23,46],"5":[25,46],"6":[19,45],"7":[15,46],"10":[34,48]},b:[27,42],n:"10 kicks short to the left. Chasers go on the strike of the ball."},
    {p:{"5":[21,38.5],"4":[19.5,39.5],"6":[18,40],"7":[15,41],o1:[20,37]},b:"5",n:"5 competes in the air just past the 10m line. 4 and 6 support him."},
    {p:{"5":[20,40],"9":[22,43]},b:"9",n:"Win it back. 9 gets to the ball and we attack."}
  ])
];
/* ---------- More moves (own versions of common set plays) ---------- */
function shift(o,dx,dy){const r={};for(const[k,v] of Object.entries(o))r[k]=[v[0]+dx,v[1]+dy];return r}
/* Lineout on our left touchline inside their 22 (lineout line 15m from their try line) */
const LO22=shift(BASE.lineout,0,-45);
const DEF22={o1:[16,11],o2:[22,10],o3:[29,9.5],o4:[36,9.5],o5:[45,10],o6:[56,10.5]};
/* Scrum 12m out, 20m in from left touch */
const SC22=Object.assign({},scrumAt(20,12),{"9":[17.6,13.5],"10":[27,18],"12":[33,19],"13":[40,20],"14":[60,21],"11":[7,18],"15":[36,28]});
const DEFSC22={o9:[18,10.5],o1:[26,9],o2:[33,8.5],o3:[40,8.5],o4:[50,9],o5:[9,9]};
/* Midfield scrum on the right, used for "scrum right" moves */
const SCR=Object.assign({},scrumAt(46,14),{"9":[48.4,15.5],"10":[40,20],"12":[34,21],"13":[27,22],"11":[12,23],"14":[60,20],"15":[32,30]});

const LIB2=[
  build("lib-scrum-right-13x",{title:"Scrum right, 13 cross",cat:"Scrum",call:"Scrum · 13 X",level:"Intermediate"},SCR,{o9:[46,11.5],o1:[39,10],o2:[33,9.5],o3:[26,9.5],o4:[14,10]},[
    {b:"9",n:"Scrum close to their line, feeding from the right. Backs line up to the left."},
    {p:{"9":[47,18]},b:"9",n:"9 picks up from the base of the scrum."},
    {p:{"10":[39,18]},b:"10",n:"9 passes to 10, who runs across the face of the defence."},
    {p:{"10":[35,17],"12":[31,18],"13":[30,16],o1:[37,12],o2:[33,12]},b:"10",n:"10 drifts left, taking their 10 and 12 with him. 13 cuts back on a hard inside line."},
    {p:{"13":[33,12],"10":[34,16.5],o2:[31,11]},b:"13",n:"Cross. 10 pops to 13 coming back against the drift."},
    {p:{"13":[36,1],"12":[30,6]},b:"13",n:"13 goes through the gap behind their 10 to score."}
  ]),
  build("lib-lo-false",{title:"Lineout false options",cat:"Lineout",call:"Black · Decoys",level:"Intermediate"},LO22,DEF22,[
    {b:"2",n:"Lineout in their 22. Throw to 5 in the middle."},
    {p:{"5":[12,14.4]},b:"5",n:"5 catches and gives it straight off the top to 9."},
    {p:{"9":[13,17.5],"10":[21,19.5]},b:"10",n:"9 passes flat to 10."},
    {p:{"10":[23,17.5],"6":[17,12.5],"12":[25,13],"13":[30,19],o1:[17,12],o2:[23,12]},b:"10",n:"Two decoys. 6 peels off the lineout and 12 runs hard at their 12. Both must sell it."},
    {p:{"13":[29,14],"10":[24,16.5],o3:[27,11.5]},b:"13",n:"10 skips both decoys and hits 13 running into the space they've made."},
    {p:{"13":[31,3],"15":[36,9]},b:"13",n:"13 breaks. 15 supports on the outside for the last pass."}
  ]),
  build("lib-lo-inside-11",{title:"Lineout inside ball to blind wing",cat:"Lineout",call:"Red · Blind 11",level:"Beginner"},BASE.lineout,{o1:[22,55],o2:[29,55.5],o3:[36,56],o4:[45,56.5]},[
    {b:"2",n:"Throw to 4 at the front."},
    {p:{"4":[7.5,59.4]},b:"4",n:"4 catches and gives it off the top to 9."},
    {p:{"9":[13,62],"10":[21,64]},b:"10",n:"9 passes to 10. 11 starts his run from the blindside."},
    {p:{"10":[24,61],"12":[30,61],"11":[15,63],o1:[24,57],o2:[30,58]},b:"10",n:"10 runs at the line with 12 outside him. 11 comes round behind the lineout on an angle."},
    {p:{"11":[21,58],"10":[25,60]},b:"11",n:"Inside pass. 10 holds his man and turns the ball back to 11 coming through at pace."},
    {p:{"11":[19,46],"9":[16,52]},b:"11",n:"11 is through the gap between their 9 and 10. 9 follows for support."}
  ]),
  build("lib-maul-fake-9",{title:"Fake maul, inside to 9",cat:"Lineout",call:"Black · Show maul",level:"Intermediate"},LO22,DEF22,[
    {b:"2",n:"Throw to 5 in the middle. Everyone shows the maul."},
    {p:{"5":[12,14.4]},b:"5",n:"5 catches. Lifters bring him down."},
    {p:{"5":[12,15.6],"6":[11,15.4],"8":[13,15.4],"1":[11,16.6],"3":[13,16.6],"4":[12,17.2],"7":[12.6,17.8],"2":[13.8,17.6]},b:"8",n:"Bind as if to drive. The ball is moved to 8 at the back."},
    {p:{"8":[17,15],"9":[15,18.5],o1:[17,12.5],o2:[22,12]},b:"8",n:"Instead of driving, 8 breaks off the back towards the open side and draws their defenders."},
    {p:{"9":[16,13.8],"8":[18.5,14.5]},b:"9",n:"8 turns the ball back inside to 9, who has run round the back of the maul."},
    {p:{"9":[13,4],"2":[11,10]},b:"9",n:"9 goes through the gap next to the maul. Hooker follows for support."}
  ]),
  build("lib-maul-blind-options",{title:"Maul, then three blindside options",cat:"Lineout",call:"Drive · Blind triple",level:"Advanced"},LO22,DEF22,[
    {b:"2",n:"Throw to 5 in the middle."},
    {p:{"5":[12,14.4]},b:"5",n:"5 catches and the maul forms."},
    {p:{"5":[12,15.6],"6":[11,15.4],"8":[13,15.4],"1":[11,16.6],"3":[13,16.6],"4":[12,17.2],"7":[12.6,17.8],"2":[11.4,17.8],"9":[13,19.5],"11":[5,20]},b:"2",n:"Bind and set. 11 comes in off his wing to stand blind, between the maul and the touchline."},
    {p:{"5":[12,10.6],"6":[11,10.4],"8":[13,10.4],"1":[11,11.6],"3":[13,11.6],"4":[12,12.2],"7":[12.6,12.8],"2":[11.4,12.8],"9":[12.5,14.5],"11":[5,16],"15":[8,20],o1:[14,8]},b:"2",n:"Drive 5 metres. Their defence gets sucked into the maul."},
    {p:{"9":[9,13.5],"7":[8,11],o1:[10,9]},b:"9",n:"9 takes it off the back and goes blind. Option 1: 7 peels off short."},
    {p:{"9":[7.5,12],"11":[6,11],"15":[5,14]},b:"11",n:"Option 2: 9 draws the last man and gives it to 11 on an inside line."},
    {p:{"11":[4,4],"15":[3,10]},b:"11",n:"Option 3: if 11 is tackled, 15 is trailing on the touchline for the offload."}
  ]),
  build("lib-hooker-loop",{title:"Hooker loop maul",cat:"Lineout",call:"Red · Hooker round",level:"Intermediate"},LO22,DEF22,[
    {b:"2",n:"Throw to 4 at the front."},
    {p:{"4":[7.5,14.4]},b:"4",n:"4 catches. The pod brings him down quickly."},
    {p:{"4":[7.5,15.6],"1":[6.5,15.4],"3":[8.5,15.4],"6":[7.5,16.6],"2":[5,17],"11":[3,21]},b:"4",n:"Front maul sets. The hooker loops round the back as soon as he has thrown."},
    {p:{"4":[7.5,12.6],"1":[6.5,12.4],"3":[8.5,12.4],"6":[7.5,13.6],"2":[7.5,15],"11":[4,17]},b:"2",n:"Short drive. The ball is fed back to the hooker at the tail."},
    {p:{"2":[4.5,12],o1:[6,9]},b:"2",n:"Hooker breaks off the back, down the touchline side."},
    {p:{"11":[7,9],"2":[3.5,10]},b:"11",n:"Their last defender commits to the hooker. Inside pass to 11."},
    {p:{"11":[9,0]},b:"11",n:"11 scores."}
  ]),
  build("lib-maul-10-inside",{title:"Maul, then 10 inside to the wing",cat:"Lineout",call:"Drive · Wing in",level:"Intermediate"},LO22,DEF22,[
    {b:"2",n:"Throw to 5. Set the maul."},
    {p:{"5":[12,15.6],"6":[11,15.4],"8":[13,15.4],"1":[11,16.6],"3":[13,16.6],"4":[12,17.2],"7":[12.6,17.8],"2":[11.4,17.8],"9":[13,19.5]},b:"7",n:"Maul set. Backs stay deep and patient."},
    {p:{"5":[12,12.6],"6":[11,12.4],"8":[13,12.4],"1":[11,13.6],"3":[13,13.6],"4":[12,14.2],"7":[12.6,14.8],"2":[11.4,14.8],"9":[13.5,16],"10":[21,18],"12":[27,19],"11":[6,20]},b:"9",n:"Drive. When it stops, 9 takes it off the back. 11 leaves the blindside and runs behind the maul."},
    {p:{"10":[23,15],"12":[28,15],"11":[16,17],o2:[23,11],o3:[28,11]},b:"10",n:"9 to 10, who attacks flat with 12 outside. 11 keeps coming on the inside."},
    {p:{"11":[21,12],"10":[23.5,14]},b:"11",n:"10 checks and gives it inside to 11 hitting the hole between their 9 and 10."},
    {p:{"11":[20,0]},b:"11",n:"11 runs through to score."}
  ]),
  build("lib-two-crash-otb",{title:"Two crash runners, out the back",cat:"Lineout",call:"Double crash",level:"Beginner"},BASE.lineout,{o1:[22,55],o2:[29,55.5],o3:[36,56],o4:[44,56.5],o5:[55,57]},[
    {b:"2",n:"Throw to 4 at the front. Quick ball off the top to 9."},
    {p:{"4":[7.5,59.4],"9":[13,62]},b:"9",n:"9 has the ball."},
    {p:{"10":[22,63],"9":[14,61.5]},b:"10",n:"9 passes to 10."},
    {p:{"10":[24,62],"6":[23,58],"12":[29,59],"13":[32,63],o1:[23,57],o2:[29,57.5]},b:"10",n:"Two crash runners: 6 and 12 run hard at their 10 and 12. 13 sits behind them."},
    {p:{"13":[34,61],"10":[25,61.5]},b:"13",n:"Option 1 is either crash runner. Option 2: 10 goes out the back to 13."},
    {p:{"13":[40,57],"14":[52,57],"15":[45,60],o3:[38,56],o4:[45,56]},b:"13",n:"13 attacks the outside shoulder with 15 and 14 wide."},
    {p:{"14":[56,46],"13":[42,55]},b:"14",n:"13 draws and passes. 14 is away down the wing."}
  ]),
  build("lib-skip-10",{title:"Skip 10, two out-the-back options",cat:"Backs",call:"Skip · 12 tree",level:"Beginner"},BASE.open,{o1:[24,48],o2:[31,48],o3:[38,48.5],o4:[47,49],o5:[57,50]},[
    {b:"9",n:"9 at the ruck. 10 stands flat as a decoy."},
    {p:{"10":[25,54],"12":[31,56]},b:"12",n:"9 skips 10 and passes long to 12. 10 runs at their 10 to hold him."},
    {p:{"12":[33,53],"13":[37,51],"15":[38,56],o2:[32,50],o3:[37,50]},b:"12",n:"12 attacks. 13 runs a hard front line. 15 sits behind as the out-the-back option."},
    {p:{"15":[40,54],"12":[34,52.5]},b:"15",n:"Their 13 bites on the front runner, so 12 goes out the back to 15."},
    {p:{"15":[45,51],"11":[52,53],"14":[55,55],o4:[46,49],o5:[55,50]},b:"15",n:"15 runs with two wide options outside him."},
    {p:{"14":[58,44],"15":[48,48]},b:"14",n:"15 draws their last man. 14 finishes on the outside."}
  ]),
  build("lib-pod-otb",{title:"Forward pod, out the back",cat:"Open play",call:"Pod · Back door",level:"Intermediate"},BASE.open,{o1:[22,48],o2:[27,48],o3:[32,48],o4:[38,48.5],o5:[46,49]},[
    {b:"9",n:"9 at the ruck. A three-man pod of 1, 2 and 3 sets up flat. 10 sits behind them."},
    {p:{"1":[24,52],"2":[27,51.5],"3":[30,52],"10":[27,55]},b:"9",n:"Pod moves onto the ball together. 10 stays hidden behind it."},
    {p:{"2":[27,50],"1":[25.5,50.5],"3":[28.5,50.5],o2:[27,49],o1:[24,49],o3:[30,49]},b:"2",n:"9 hits the hooker in the middle of the pod. Their defenders fold in to stop the carry."},
    {p:{"10":[30,53]},b:"10",n:"Hooker passes out the back of the pod to 10."},
    {p:{"10":[34,50],"12":[38,51],"13":[43,52],o4:[37,49]},b:"10",n:"10 attacks the space left by their folded defenders with backs outside."},
    {p:{"13":[47,44],"10":[36,48]},b:"13",n:"10 to 13 via 12. Overlap on the outside."}
  ]),
  build("lib-left-scrum-11",{title:"Left scrum, inside to the wing",cat:"Scrum",call:"Scrum · Wing in",level:"Beginner"},Object.assign({},scrumAt(18,50),{"9":[15.6,51.5],"10":[25,56],"12":[31,57],"13":[38,58],"14":[58,59],"11":[6,57],"15":[34,66]}),{o9:[16,48.5],o1:[24,47],o2:[31,46.5],o3:[38,47],o4:[48,48]},[
    {b:"9",n:"Scrum on the left. Open side is to the right."},
    {p:{"9":[17,54]},b:"9",n:"9 picks up from the base."},
    {p:{"10":[26,55]},b:"10",n:"9 to 10. 11 leaves the blindside wing."},
    {p:{"10":[29,53],"12":[33,54],"11":[18,56],o1:[27,49],o2:[32,49]},b:"10",n:"10 runs across with 12 outside. Their defence drifts with him. 11 comes in behind on a straight line."},
    {p:{"11":[25,50],"10":[30,52.5]},b:"11",n:"Inside ball to 11, hitting the gap in the middle of the field."},
    {p:{"11":[24,38],"9":[21,45]},b:"11",n:"11 is through. 9 tracks inside for the offload."}
  ]),
  build("lib-otb-screen",{title:"Out the back",cat:"Open play",call:"Screen",level:"Intermediate"},BASE.open,{o1:[24,48],o2:[30,48],o3:[37,48.5],o4:[45,49]},[
    {b:"9",n:"The most used shape in rugby. 9 at the ruck."},
    {p:{"10":[25,54]},b:"10",n:"9 passes to 10. 12 lines up flat outside him. 13 sits deeper behind 12."},
    {p:{"10":[27,52],"12":[32,51],"13":[31,55],o2:[31,49.5]},b:"10",n:"10 attacks the line. 12 runs flat and hard as the screen, calling for the ball."},
    {p:{"13":[34,53],"10":[28,51.5]},b:"13",n:"Their 12 commits to the screen runner. 10 passes behind him to 13."},
    {p:{"13":[40,49],"14":[52,50],o3:[39,48],o4:[46,48]},b:"13",n:"13 now has their 13 isolated with 14 outside him."},
    {p:{"14":[56,40],"13":[42,47]},b:"14",n:"Draw and pass. 14 scores in the corner."}
  ]),
  build("lib-3-pod",{title:"Three-man pod",cat:"Open play",call:"Pod",level:"Intermediate"},BASE.open,{o1:[25,48],o2:[29,48],o3:[33,48],o4:[39,48.5]},[
    {b:"9",n:"Three forwards side by side, about a metre apart, a few metres from the ruck."},
    {p:{"1":[26,51.5],"2":[29,51],"3":[32,51.5]},b:"9",n:"Pod gets flat and square, ready to move onto the ball."},
    {p:{"2":[29,49.5],"1":[27.8,50],"3":[30.2,50]},b:"2",n:"Variation 1: 9 hits the middle man. The two outside him bind on and drive him over the gainline."},
    {p:{"2":[29,51],"1":[26,51.5],"3":[32,51.5],"10":[29,55]},b:"9",n:"Reset. Variation 2: the middle man gets it and tips it on to a pod player at the line."},
    {p:{"2":[29,50.5],"3":[31.5,49.5],o3:[32,49]},b:"3",n:"The tip pass shifts the point of contact and catches their defence flat-footed."},
    {p:{"3":[31.5,51],"2":[29,51.5],"10":[32,53.5]},b:"10",n:"Variation 3: the middle man passes out the back to 10, sitting behind the pod."}
  ]),
  build("lib-simple-scrum-22",{title:"Simple scrum play in their 22",cat:"Scrum",call:"Scrum · Three options",level:"Beginner"},SC22,DEFSC22,[
    {b:"9",n:"Scrum just inside their 22. Three options from one call."},
    {p:{"9":[19,15.5]},b:"9",n:"Ball at the base. 9 picks up."},
    {p:{"8":[18.5,10],o9:[18,9]},b:"8",n:"Option 1: if their 9 is slow, 8 picks and drives close to the scrum."},
    {p:{"8":[20,15.4],"9":[19,15.5],"10":[26,17],"12":[30,15],"13":[35,17]},b:"10",n:"Reset to show option 2: 9 to 10, and 12 crashes a hard line."},
    {p:{"12":[30,11],o1:[28,10],o2:[31,10]},b:"12",n:"12 carries hard at their 12. That sets up the next phase if nothing's on."},
    {p:{"12":[30,15],"10":[27,15],"13":[36,13],o2:[33,10]},b:"13",n:"Option 3: 10 fakes to 12 and goes wide to 13 running at the outside shoulder."},
    {p:{"13":[40,1]},b:"13",n:"13 scores in the wide channel."}
  ]),
  build("lib-5-fake-front",{title:"Five-man lineout, fake front",cat:"Lineout",call:"5 · Front show, back throw",level:"Beginner"},Object.assign({},BASE.lineout,{"1":[7,60],"4":[8.5,60],"3":[10,60],"5":[12.5,60],"6":[14,60],"8":[16,64],"7":[18,65]}),{o1:[7,61.2],o2:[8.5,61.2],o3:[10,61.2],o4:[12.5,61.2],o5:[14,61.2]},[
    {b:"2",n:"Five-man lineout. 8 and 7 stand off it as receivers."},
    {p:{"4":[8,59.5],"1":[7,59.7],"3":[9,59.7]},b:"2",n:"Front pod shows hard. 4 dips and makes as if to jump at the front."},
    {p:{o2:[8.5,60.8],o1:[7.5,61],o3:[9.5,61]},b:"2",n:"Their front pod goes up to contest. That's what we want."},
    {p:{"5":[13,59.4],"6":[14,59.8]},b:[13,59.4],n:"Hooker throws over the top to 5 at the back, lifted by 6."},
    {p:{"5":[13,60.6],"8":[15,62],"9":[14,63]},b:"5",n:"5 lands and the ball goes off the top or down to 9."},
    {p:{"9":[15,62.5],"10":[22,65]},b:"10",n:"Clean ball to 10, with their lineout tied up at the front."}
  ]),
  build("lib-4-double-loop",{title:"Four-man double loop",cat:"Lineout",call:"4 · Double loop",level:"Advanced"},Object.assign({},BASE.lineout,{"1":[7,60],"4":[8.5,60],"5":[10.5,60],"6":[12,60],"3":[20,66],"8":[18,64],"7":[16,65]}),{o1:[7,61.2],o2:[8.5,61.2],o3:[10.5,61.2],o4:[12,61.2]},[
    {b:"2",n:"Four-man lineout. 3, 7 and 8 stand off as a pod."},
    {p:{"4":[9,59.6],"1":[7.5,59.7]},b:"2",n:"4 and 1 show for a front ball."},
    {p:{"5":[7,59.5],"6":[8,58.8],"4":[11,59.8],"1":[12.5,59.8]},b:"2",n:"First loop: 5 and 6 run round the front. 4 and 1 slide back. Their jumpers follow to the front."},
    {p:{"4":[12,59.4],"1":[13,59.7],o2:[7.5,60.8],o1:[6.5,61]},b:"2",n:"Second loop: 4 and 1 reset at the back. Their pod is now committed at the front."},
    {p:{"4":[12,59.2]},b:[12,59.2],n:"Throw to 4 at the back."},
    {p:{"4":[12,60.6],"9":[13,62.5]},b:"9",n:"4 delivers to 9."},
    {p:{"10":[22,64],"9":[14,62]},b:"10",n:"9 to 10. The forward pod is free to carry on the next phase."}
  ]),
  build("lib-5-back-loop",{title:"Five-man back loop",cat:"Lineout",call:"5 · Back loop",level:"Beginner"},Object.assign({},BASE.lineout,{"1":[7,60],"4":[8.5,60],"3":[10,60],"5":[12.5,60],"6":[14,60],"8":[16,64],"7":[18,65]}),{o1:[7,61.2],o2:[8.5,61.2],o3:[10,61.2],o4:[12.5,61.2],o5:[14,61.2]},[
    {b:"2",n:"Five-man lineout. The aim is to show a back ball and throw to the front."},
    {p:{"5":[13,59.5],"6":[14,59.7]},b:"2",n:"5 and 6 at the back show hard for the throw."},
    {p:{o4:[13,60.8],o5:[14,61]},b:"2",n:"Their jumpers at the back mark them."},
    {p:{"5":[7.5,59.5],"6":[11,59.7],"4":[8.5,59.8]},b:"2",n:"5 loops round to the front as the hooker sets. 6 slides forward to lift."},
    {p:{"5":[7.5,59.2],"1":[6.5,59.8]},b:"5",n:"Quick, flat throw to 5 at the front."},
    {p:{"5":[7.5,60.6],"9":[11,62.5]},b:"9",n:"Ball to 9. Front ball won against a defence set for the back."}
  ]),
  build("lib-centre-scrum",{title:"Centre scrum overlap",cat:"Scrum",call:"Scrum · 15 in",level:"Intermediate"},Object.assign({},scrumAt(35,50),{"9":[32.6,51.5],"10":[29,57],"12":[24,58],"13":[18,59],"11":[8,60],"14":[50,59],"15":[30,66]}),{o9:[33,48.5],o1:[28,47],o2:[22,46.5],o3:[16,47],o4:[8,48]},[
    {b:"9",n:"Scrum in the middle of the field. Backs set to the left."},
    {p:{"9":[33,54]},b:"9",n:"9 picks up."},
    {p:{"10":[28,56],"15":[27,62]},b:"10",n:"9 to 10. 15 starts running to join the line."},
    {p:{"10":[25,54],"12":[21,55],"15":[23,58]},b:"12",n:"10 to 12. 15 hits the line between 12 and 13."},
    {p:{"15":[19,54],"12":[20,53],"13":[14,56],o2:[21,49],o3:[16,49]},b:"15",n:"12 to 15. That gives us an extra player against their last two defenders."},
    {p:{"13":[12,52],"11":[6,52],"15":[16,51]},b:"13",n:"15 to 13, with 11 still outside."},
    {p:{"11":[5,40],"13":[10,48]},b:"11",n:"13 draws the last man. 11 is clear down the wing."}
  ]),
  build("lib-fake-cross-otb",{title:"Fake cross, out the back",cat:"Backs",call:"Fake X",level:"Beginner"},BASE.open,{o1:[24,48],o2:[31,48],o3:[38,48.5],o4:[47,49]},[
    {b:"9",n:"Four players: 10, 12, 13 and 15. Works from almost anywhere."},
    {p:{"10":[25,54]},b:"10",n:"9 passes to 10."},
    {p:{"10":[29,53],"12":[28,51],"13":[34,55],"15":[30,57],o1:[27,49],o2:[30,49]},b:"10",n:"10 runs across. 12 cuts back on a cross line behind him, and their 10 and 12 watch for the switch."},
    {p:{"12":[27,50],"10":[31,52.5],"13":[36,54]},b:"10",n:"10 fakes the switch to 12 and keeps the ball."},
    {p:{"15":[35,55],"10":[32,52]},b:"15",n:"10 goes out the back to 15, who has run round behind 13."},
    {p:{"15":[41,49],"14":[54,52],o3:[40,48]},b:"15",n:"15 attacks the edge with 14 outside."},
    {p:{"14":[58,42],"15":[43,47]},b:"14",n:"Draw and pass. 14 is away."}
  ])
];
LIB.push(...LIB2);
const LEVELS={"lib-front-strike":"Beginner","lib-maul":"Beginner","lib-89-blind":"Intermediate","lib-loop":"Intermediate","lib-switch":"Beginner","lib-miss13":"Intermediate","lib-blitz":"Intermediate","lib-short-ko":"Intermediate"};
LIB.forEach(p=>{if(!p.level)p.level=LEVELS[p.id]||"Intermediate"});
const TEMPLATES={
  open:{label:"Open play",cat:"Backs",base:BASE.open,ball:"9"},
  lineout:{label:"Lineout",cat:"Lineout",base:BASE.lineout,ball:"2"},
  scrum:{label:"Scrum",cat:"Scrum",base:BASE.scrum,ball:"9"},
  kickoff:{label:"Kick-off",cat:"Kick-off",base:BASE.kickoff,ball:"10"}
};
function blankPlay(key){const t=TEMPLATES[key];return{id:null,kind:"draft",title:"",cat:t.cat,call:"",tokens:Object.keys(t.base),steps:[{pos:clone(t.base),ball:{h:t.ball},note:""}]}}

/* ---------- Geometry ---------- */
function ballAt(step){const b=step.ball||{};if(b.h&&step.pos[b.h]){const p=step.pos[b.h];return[p[0]+1.15,p[1]-1.15]}return[b.x??35,b.y??50]}
function frameAt(play,t){
  const n=play.steps.length;t=Math.max(0,Math.min(n-1,t));const i=Math.floor(t),j=Math.min(n-1,i+1),f=ease(t-i);
  const A=play.steps[i],B=play.steps[j];const pos={};
  for(const id of play.tokens){const a=A.pos[id]||B.pos[id];const b=B.pos[id]||a;if(!a)continue;pos[id]=[lerp(a[0],b[0],f),lerp(a[1],b[1],f)]}
  let ball,air=0;
  if(A.ball&&B.ball&&A.ball.h&&A.ball.h===B.ball.h&&pos[A.ball.h]){ball=[pos[A.ball.h][0]+1.15,pos[A.ball.h][1]-1.15]}
  else{const ba=ballAt(A),bb=ballAt(B);ball=[lerp(ba[0],bb[0],f),lerp(ba[1],bb[1],f)];if(i!==j)air=Math.sin(Math.PI*f)}
  return{pos,ball,air};
}
function boundsOf(play,aspect,pad=5,minW=30){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const st of play.steps){for(const id of play.tokens){const p=st.pos[id];if(!p)continue;x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}const b=ballAt(st);x0=Math.min(x0,b[0]);x1=Math.max(x1,b[0]);y0=Math.min(y0,b[1]);y1=Math.max(y1,b[1])}
  if(x0>x1){x0=0;x1=70;y0=40;y1=70}
  x0-=pad;x1+=pad;y0-=pad;y1+=pad;let w=Math.max(minW,x1-x0),hh=y1-y0;const cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(w/hh>aspect)hh=w/aspect;else w=hh*aspect;
  return[cx-w/2,cy-hh/2,w,hh];
}

/* ---------- Pitch drawing ---------- */
function pitchLayer(){
  const g=sv("g",{});
  g.append(sv("rect",{x:-60,y:-60,width:190,height:230,fill:"var(--grass-edge)"}));
  g.append(sv("rect",{x:0,y:-7,width:70,height:114,fill:"var(--grass)"}));
  for(let y=0;y<100;y+=20)g.append(sv("rect",{x:0,y,width:70,height:10,fill:"var(--grass-2)"}));
  const L={stroke:"var(--chalk)","stroke-width":.28,opacity:.85,fill:"none"};
  g.append(sv("rect",Object.assign({x:0,y:-7,width:70,height:114},L)));
  for(const y of [0,100,22,78,50])g.append(sv("line",Object.assign({x1:0,x2:70,y1:y,y2:y},L,y===0||y===100?{"stroke-width":.4}:{})));
  for(const y of [40,60])g.append(sv("line",Object.assign({x1:0,x2:70,y1:y,y2:y,"stroke-dasharray":"1.6 1.6"},L)));
  for(const y of [5,95])g.append(sv("line",Object.assign({x1:5,x2:65,y1:y,y2:y,"stroke-dasharray":"1.6 3.4"},L,{opacity:.55})));
  for(const x of [5,15,55,65])g.append(sv("line",Object.assign({x1:x,x2:x,y1:3,y2:97,"stroke-dasharray":"1 4"},L,{opacity:.4})));
  for(const y of [0,100]){g.append(sv("line",Object.assign({x1:32.2,x2:37.8,y1:y,y2:y},L,{"stroke-width":.7,opacity:1})));for(const x of [32.2,37.8])g.append(sv("circle",{cx:x,cy:y,r:.45,fill:"var(--chalk)"}))}
  g.append(sv("line",Object.assign({x1:35,x2:35,y1:49.3,y2:50.7},L)));
  const lab=(y,t)=>sv("text",{x:68.6,y:y-.7,"font-size":2.2,"text-anchor":"end",fill:"var(--chalk)",opacity:.55,"font-family":"Saira Condensed, Arial Narrow, sans-serif","font-weight":700},t);
  g.append(lab(22,"22"),lab(40,"10"),lab(50,"HALFWAY"),lab(60,"10"),lab(78,"22"),lab(0,"TRY LINE"));
  return g;
}

class Pitch{
  constructor(opts={}){
    this.mini=!!opts.mini;this.editable=!!opts.editable;this.aspect=opts.aspect||.8;
    this.svg=sv("svg",{xmlns:SVGNS,role:"img","aria-label":"Rugby pitch"});
    this.svg.append(pitchLayer());
    this.trails=sv("g",{});this.toks=sv("g",{});this.ballG=sv("g",{});
    this.svg.append(this.trails,this.toks,this.ballG);
    this.shadow=sv("ellipse",{rx:.8,ry:.4,fill:"rgba(0,0,0,.35)"});
    this.ball=sv("ellipse",{rx:.95,ry:.62,fill:"#F3E9CC",stroke:"#3B2A0E","stroke-width":.22});
    this.ballG.append(this.shadow,this.ball);
    this.nodes={};this.selected=null;
  }
  setView(vb){this.vb=vb;this.svg.setAttribute("viewBox",vb.map(n=>n.toFixed(2)).join(" "))}
  fit(play){this.setView(boundsOf(play,this.aspect,this.mini?3:5,this.mini?24:30))}
  ensureTokens(tokens){
    for(const id of Object.keys(this.nodes))if(!tokens.includes(id)){this.nodes[id].remove();delete this.nodes[id]}
    for(const id of tokens){if(this.nodes[id])continue;const opp=id.startsWith("o");
      const r=this.mini?2:1.8;
      const g=sv("g",{class:"tok","data-id":id});
      g.append(sv("circle",{r,fill:opp?"var(--opp)":"var(--attack)",stroke:"#fff","stroke-width":this.mini?.5:.32}));
      if(!opp&&!this.mini)g.append(sv("text",{y:.68,"text-anchor":"middle","font-size":id.length>1?1.75:1.95,"font-family":"Saira Condensed, Arial Narrow, sans-serif","font-weight":800,fill:"#fff","pointer-events":"none"},id));
      if(opp&&!this.mini)g.append(sv("path",{d:"M-.6 -.6L.6 .6M.6 -.6L-.6 .6",stroke:"#fff","stroke-width":.3,"pointer-events":"none",opacity:.8}));
      this.toks.append(g);this.nodes[id]=g}
  }
  draw(play,fr){
    this.ensureTokens(play.tokens);
    for(const id of play.tokens){const p=fr.pos[id];const n=this.nodes[id];if(!p||!n){if(n)n.setAttribute("visibility","hidden");continue}n.removeAttribute("visibility");n.setAttribute("transform",`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`);
      const c=n.firstChild;if(this.selected===id){c.setAttribute("stroke","var(--accent)");c.setAttribute("stroke-width",.6)}else{c.setAttribute("stroke","#fff");c.setAttribute("stroke-width",this.mini?.5:.32)}}
    const lift=fr.air*1.4,sc=1+fr.air*.45;
    this.shadow.setAttribute("cx",fr.ball[0]);this.shadow.setAttribute("cy",fr.ball[1]+.4);this.shadow.setAttribute("opacity",fr.air?.6:.35);
    this.ball.setAttribute("transform",`translate(${fr.ball[0].toFixed(2)} ${(fr.ball[1]-lift).toFixed(2)}) rotate(-35) scale(${sc.toFixed(2)})`);
    if(this.mini){this.ball.setAttribute("rx",1.3);this.ball.setAttribute("ry",.9)}
  }
  drawTrails(play,k){
    this.trails.replaceChildren();if(k<1)return;const A=play.steps[k-1],B=play.steps[k];
    for(const id of play.tokens){const a=A.pos[id],b=B.pos[id];if(!a||!b)continue;if(Math.hypot(a[0]-b[0],a[1]-b[1])<.8)continue;
      this.trails.append(sv("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:id.startsWith("o")?"rgba(170,195,235,.65)":"rgba(255,255,255,.6)","stroke-width":this.mini?.6:.32,"stroke-linecap":"round"}))}
    const ha=A.ball&&A.ball.h,hb=B.ball&&B.ball.h;
    if(!(ha&&ha===hb)){const a=ballAt(A),b=ballAt(B);this.trails.append(sv("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:"var(--accent)","stroke-width":this.mini?.8:.42,"stroke-dasharray":this.mini?"1.4 1":"1 .7","stroke-linecap":"round"}))}
  }
}
function miniPitch(play){
  const p=new Pitch({mini:true,aspect:1});p.fit(play);const k=play.steps.length-1;
  const fr=frameAt(play,k);p.draw(play,fr);
  /* show every pass across the whole play on the thumbnail */
  for(let i=1;i<=k;i++){const A=play.steps[i-1],B=play.steps[i];const ha=A.ball&&A.ball.h,hb=B.ball&&B.ball.h;if(ha&&ha===hb)continue;const a=ballAt(A),b=ballAt(B);p.trails.append(sv("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:"var(--accent)","stroke-width":.8,"stroke-dasharray":"1.4 1","stroke-linecap":"round"}))}
  return p.svg;
}

/* ---------- Data layer: Supabase when configured, otherwise demo mode on this device ---------- */
const CFG=window.RUGBY_PLAYS_CONFIG||{};
const REMOTE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
function placeholderSquad(){const out=[];for(let i=1;i<=23;i++)out.push({id:"p"+i,num:i,name:"Player "+i,pos:i<=15?POS[i]:"Replacement"});return out}
function playRow(p){return{title:p.title,cat:p.cat,call_name:p.call||"",tokens:p.tokens,steps:p.steps}}
function fromRow(r,kind){return{id:r.id,kind,title:r.title||"Untitled play",cat:r.cat||"Open play",call:r.call_name||"",tokens:Array.isArray(r.tokens)?r.tokens:[],steps:Array.isArray(r.steps)?r.steps:[],by:r.suggested_by||null,status:r.status||null,playId:r.play_id||null,createdAt:Date.parse(r.created_at||"")||0,updatedAt:Date.parse(r.updated_at||"")||0}}

const Remote={
  async req(path,opts={}){
    const headers={apikey:CFG.supabaseAnonKey,"Content-Type":"application/json"};
    if(String(CFG.supabaseAnonKey).startsWith("eyJ"))headers.Authorization="Bearer "+CFG.supabaseAnonKey;
    if(opts.prefer)headers.Prefer=opts.prefer;
    let r;
    try{r=await fetch(CFG.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,{method:opts.method||"GET",headers,body:opts.body?JSON.stringify(opts.body):undefined})}
    catch(e){const err=new Error("Can't reach the team database. Check your connection and try again.");err.code="network";throw err}
    const txt=await r.text();let data=null;try{data=txt?JSON.parse(txt):null}catch(e){}
    if(!r.ok){const msg=(data&&data.message)||("The database said no ("+r.status+").");const err=new Error(msg==="wrong_pin"?"That PIN isn't right.":msg);err.code=msg==="wrong_pin"?"wrong_pin":"http";throw err}
    return data;
  },
  rpc(fn,args){return this.req("rpc/"+fn,{method:"POST",body:args})},
  async load(){
    const[plays,sugg,views,squad]=await Promise.all([
      this.req("plays?select=*&order=updated_at.desc"),this.req("suggestions?select=*&order=created_at.desc"),
      this.req("views?select=play_id,player_id"),this.req("squad?select=*&order=num.asc")]);
    return{plays:plays.map(r=>fromRow(r,"team")),suggestions:sugg.map(r=>fromRow(r,"suggestion")),views:views.map(v=>[v.play_id,v.player_id]),squad};
  },
  login(pin){return this.rpc("coach_login",{p_pin:pin})},
  savePlay(pin,play,id,source,by){return this.rpc("coach_save_play",{p_pin:pin,p_id:id||null,p_title:play.title,p_cat:play.cat,p_call:play.call||"",p_tokens:play.tokens,p_steps:play.steps,p_source:source||"coach",p_by:by||null})},
  deletePlay(pin,id){return this.rpc("coach_delete_play",{p_pin:pin,p_id:id})},
  approve(pin,id){return this.rpc("coach_approve",{p_pin:pin,p_id:id})},
  review(pin,id,status,playId){return this.rpc("coach_review",{p_pin:pin,p_id:id,p_status:status,p_play_id:playId||null})},
  deleteSuggestion(pin,id){return this.rpc("coach_delete_suggestion",{p_pin:pin,p_id:id})},
  saveSquad(pin,players){return this.rpc("coach_save_squad",{p_pin:pin,p_players:players})},
  changePin(pin,next){return this.rpc("coach_change_pin",{p_pin:pin,p_new_pin:next})},
  addSuggestion(play,by){return this.req("suggestions",{method:"POST",body:Object.assign(playRow(play),{suggested_by:by,status:"pending"}),prefer:"return=minimal"})},
  markView(playId,playerId){return this.req("views",{method:"POST",body:{play_id:playId,player_id:playerId},prefer:"resolution=ignore-duplicates,return=minimal"})}
};

const DEMO_PIN="1234";
const Demo={
  key:"rp_demo_v1",
  read(){let d=null;try{d=JSON.parse(localStorage.getItem(this.key)||"null")}catch(e){}
    if(!d){const now=Date.now();
      d={pin:DEMO_PIN,squad:placeholderSquad(),
        plays:["lib-front-strike","lib-loop","lib-blitz"].map((id,i)=>{const p=LIB.find(x=>x.id===id);return Object.assign(playRow(p),{id:"demo-"+id,source:"coach",suggested_by:null,updated_at:new Date(now-i*3600e3).toISOString()})}),
        suggestions:[(()=>{const p=LIB.find(x=>x.id==="lib-switch");return Object.assign(playRow(p),{id:"demo-sugg-1",title:"Switch off the 22 drop-out",suggested_by:"p12",status:"pending",created_at:new Date(now-1800e3).toISOString()})})()],
        views:[["demo-lib-front-strike","p9"],["demo-lib-front-strike","p10"],["demo-lib-front-strike","p12"],["demo-lib-front-strike","p13"],["demo-lib-loop","p10"]]};
      this.write(d)}
    return d},
  write(d){try{localStorage.setItem(this.key,JSON.stringify(d))}catch(e){}},
  check(d,pin){if(pin!==d.pin){const e=new Error("That PIN isn't right.");e.code="wrong_pin";throw e}},
  async load(){const d=this.read();return{plays:d.plays.slice().sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)).map(r=>fromRow(r,"team")),suggestions:d.suggestions.slice().sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).map(r=>fromRow(r,"suggestion")),views:d.views,squad:d.squad}},
  async login(pin){this.check(this.read(),pin);return true},
  async savePlay(pin,play,id,source,by){const d=this.read();this.check(d,pin);const nid=id||uid();const row=Object.assign(playRow(play),{id:nid,source:source||"coach",suggested_by:by||null,updated_at:new Date().toISOString()});const i=d.plays.findIndex(p=>p.id===nid);if(i>=0)d.plays[i]=Object.assign(d.plays[i],row);else d.plays.push(row);this.write(d);return nid},
  async deletePlay(pin,id){const d=this.read();this.check(d,pin);d.plays=d.plays.filter(p=>p.id!==id);d.views=d.views.filter(v=>v[0]!==id);this.write(d)},
  async approve(pin,id){const d=this.read();this.check(d,pin);const s=d.suggestions.find(x=>x.id===id);if(!s)throw new Error("Suggestion not found");const nid=uid();d.plays.push(Object.assign(playRow({title:s.title,cat:s.cat,call:s.call_name,tokens:s.tokens,steps:s.steps}),{id:nid,source:"suggestion",suggested_by:s.suggested_by,updated_at:new Date().toISOString()}));s.status="approved";s.play_id=nid;this.write(d);return nid},
  async review(pin,id,status,playId){const d=this.read();this.check(d,pin);const s=d.suggestions.find(x=>x.id===id);if(s){s.status=status;s.play_id=playId||null}this.write(d)},
  async deleteSuggestion(pin,id){const d=this.read();this.check(d,pin);d.suggestions=d.suggestions.filter(x=>x.id!==id);this.write(d)},
  async saveSquad(pin,players){const d=this.read();this.check(d,pin);d.squad=players;this.write(d)},
  async changePin(pin,next){const d=this.read();this.check(d,pin);if(!next||next.length<4)throw new Error("PIN must be at least 4 characters");d.pin=next;this.write(d)},
  async addSuggestion(play,by){const d=this.read();d.suggestions.push(Object.assign(playRow(play),{id:uid(),suggested_by:by,status:"pending",created_at:new Date().toISOString()}));this.write(d)},
  async markView(playId,playerId){const d=this.read();if(!d.views.some(v=>v[0]===playId&&v[1]===playerId)){d.views.push([playId,playerId]);this.write(d)}}
};
const API=REMOTE?Remote:Demo;

/* ---------- App state ---------- */
const S={loaded:false,loadError:null,pin:store.get("rp_pin"),coach:false,plays:[],suggestions:[],views:new Set(),squad:[],
  slot:store.get("rp_slot"),tab:"home",filter:"All",screen:null};

function squadList(){return S.squad}
function slotInfo(id){return S.squad.find(p=>p.id===id)||null}
function watchersOf(playId){const out=[];for(const k of S.views){const[p,s]=k.split("|");if(p===playId)out.push(s)}return out}
function hasWatched(playId,slot){return S.views.has(playId+"|"+slot)}

function toast(msg){const old=document.querySelector(".toast");if(old)old.remove();const t=h("div",{class:"toast",role:"status"},msg);document.body.append(t);setTimeout(()=>t.remove(),2800)}
function errMsg(e){return(e&&e.message)||"Something went wrong. Try again."}
function onCoachError(e){if(e&&e.code==="wrong_pin"){S.coach=false;S.pin=null;try{localStorage.removeItem("rp_pin")}catch(_){}renderChrome();toast("Your coach PIN has changed. Log in again.");return true}toast(errMsg(e));return false}

async function refresh(){
  try{const d=await API.load();S.plays=d.plays;S.suggestions=d.suggestions;S.views=new Set(d.views.map(v=>v[0]+"|"+v[1]));S.squad=Array.isArray(d.squad)?d.squad:[];S.loaded=true;S.loadError=null}
  catch(e){S.loadError=errMsg(e);if(!S.loaded)S.loaded=true}
  render();
}
async function boot(){
  renderChrome();
  if(S.pin){try{await API.login(S.pin);S.coach=true}catch(e){if(e.code==="wrong_pin"){S.pin=null;try{localStorage.removeItem("rp_pin")}catch(_){}}else S.coach=true}}
  await refresh();
  openFromHash();
  if(!S.coach&&!slotInfo(S.slot)&&S.squad.length&&!S.screen)openPicker();
  setInterval(()=>{if(document.visibilityState==="visible"&&!(S.screen&&S.screen.kind==="editor"))refresh()},20000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!(S.screen&&S.screen.kind==="editor"))refresh()});
  window.addEventListener("hashchange",openFromHash);
}
function openFromHash(){
  const m=/^#play-(.+)$/.exec(location.hash);if(!m)return;const id=decodeURIComponent(m[1]);
  const p=S.plays.find(x=>x.id===id)||LIB.find(x=>x.id===id)||S.suggestions.find(x=>x.id===id);
  if(p)openPlayer(p);else if(S.loaded)toast("That play isn't in the playbook any more.");
}

async function markWatched(play){
  if(play.kind!=="team"||!S.slot||!slotInfo(S.slot)||S.coach)return;
  const key=play.id+"|"+S.slot;if(S.views.has(key))return;
  S.views.add(key);
  try{await API.markView(play.id,S.slot)}catch(e){S.views.delete(key)}
}

/* ---------- Rendering ---------- */
let anim=null;
function stopAnim(){if(anim){cancelAnimationFrame(anim.raf);anim=null}}
function go(tab){stopAnim();S.tab=tab;S.screen=null;if(location.hash)history.replaceState(null,"",location.pathname+location.search);render();window.scrollTo(0,0)}

function render(){
  renderChrome();
  if(S.screen)return; /* player and editor manage their own DOM */
  const v=document.getElementById("view");v.replaceChildren();
  if(!S.loaded){v.append(h("p",{class:"loading"},"Loading plays…"));return}
  if(S.tab==="home")v.append(...homeView().filter(Boolean));
  else if(S.tab==="library")v.append(...libraryView().filter(Boolean));
  else if(S.tab==="suggested")v.append(...suggestedView().filter(Boolean));
  else if(S.tab==="squad")v.append(...squadView().filter(Boolean));
}
function renderChrome(){
  const cb=document.getElementById("coachBtn");cb.replaceChildren();
  if(S.coach){cb.className="coach-badge";cb.textContent="Coach";cb.setAttribute("aria-label","Coach settings");cb.onclick=openCoachMenu}
  else{cb.className="icon-btn";const ic=document.createElementNS(SVGNS,"svg");ic.setAttribute("viewBox","0 0 24 24");ic.innerHTML='<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';cb.append(ic,h("span",{class:"lbl"},"Coach"));cb.setAttribute("aria-label","Coach login");cb.onclick=openCoachLogin}
  const who=document.getElementById("whoBtn");const me=slotInfo(S.slot);who.replaceChildren();
  who.hidden=S.coach;
  if(me)who.append(h("span",{class:"num"},String(me.num)),h("span",{},me.name));else who.append(h("span",{class:"num"},"?"),h("span",{},"Who are you?"));
  who.onclick=openPicker;
  const pending=S.suggestions.filter(s=>s.status==="pending").length;
  const tabs=[["home","Plays",'<path d="M4 5h16v14H4z"/><path d="M12 5v14M4 12h4M16 12h4"/>'],["library","Library",'<path d="M5 4h4v16H5zM10 4h4v16h-4zM15.5 4.5l3.6 1-3.8 15-3.6-1z"/>'],["new","New",'<path d="M12 5v14M5 12h14"/>'],["suggested","Suggested",'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'],["squad","Squad",'<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>']];
  const bar=document.getElementById("tabs");bar.replaceChildren();
  for(const[id,label,path] of tabs){
    const ic=document.createElementNS(SVGNS,"svg");ic.setAttribute("viewBox","0 0 24 24");ic.innerHTML=path;
    const b=h("button",{class:"tab"+(id==="new"?" newp":""),type:"button","aria-current":S.tab===id&&!S.screen?"page":null},id==="new"?h("span",{class:"ic"},ic):ic,label);
    if(id==="suggested"&&S.coach&&pending)b.append(h("span",{class:"badge"},String(pending)));
    b.onclick=()=>{if(id==="new")openTemplatePicker();else go(id)};bar.append(b);
  }
}

function demoBanner(){return REMOTE?null:h("div",{class:"demo"},h("b",{},"Demo"),h("span",{},"Plays are saved on this device only, and the demo coach PIN is ",h("strong",{},DEMO_PIN),". Connect the team database to share plays with the squad."))}
function errorBanner(){return S.loadError?h("div",{class:"confirm"},S.loadError):null}
function catFilter(list){
  const cats=["All",...CATS.filter(c=>list.some(p=>p.cat===c))];
  if(!cats.includes(S.filter))S.filter="All";
  return h("div",{class:"chips",role:"group","aria-label":"Filter by type"},cats.map(c=>h("button",{class:"chip",type:"button","aria-pressed":S.filter===c?"true":"false",onclick:()=>{S.filter=c;render()}},c)));
}
function playCard(play,extra){
  const meta=h("div",{class:"card-meta"},h("span",{class:"pill"},play.cat),play.kind==="library"&&play.level?h("span",{class:"pill"},play.level):null,h("span",{},play.steps.length+" steps"),extra||null);
  return h("button",{class:"card",type:"button",onclick:()=>openPlayer(play)},
    h("div",{class:"thumb"},miniPitch(play)),
    h("div",{class:"card-body"},play.call?h("span",{class:"call"},play.call):null,h("span",{class:"card-title"},play.title),meta));
}

function homeView(){
  const out=[h("div",{},h("div",{class:"eyebrow"},"Team playbook"),h("h1",{},"Our plays"),h("p",{class:"sub"},S.plays.length+" approved "+(S.plays.length===1?"play":"plays")+(S.coach?" · coach view":"")))];
  out.push(demoBanner(),errorBanner());
  if(!S.plays.length){out.push(h("div",{class:"empty"},h("h2",{},"No team plays yet"),h("p",{style:"margin:0;max-width:40ch"},S.coach?"Add moves from the Library, or tap New to draw your own. Players' suggestions land in Suggested for you to approve.":"Your coach hasn't added any plays yet. You can suggest one with New."),h("div",{class:"row",style:"justify-content:center"},h("button",{class:"btn primary",type:"button",onclick:()=>go("library")},"Open the library"),h("button",{class:"btn",type:"button",onclick:openTemplatePicker},"Build a play"))));return out}
  out.push(catFilter(S.plays));
  const total=S.squad.length;
  const list=S.plays.filter(p=>S.filter==="All"||p.cat===S.filter);
  if(!S.coach&&slotInfo(S.slot)){const todo=S.plays.filter(p=>!hasWatched(p.id,S.slot)).length;if(todo)out.push(h("div",{class:"banner"},h("strong",{},todo+" "+(todo===1?"play":"plays")+" to watch. "),"Watch each one to the last step and it's ticked off for the coach."))}
  out.push(h("div",{class:"list"},list.map(p=>{
    let extra=null;
    if(S.coach){const n=watchersOf(p.id).filter(s=>slotInfo(s)).length;extra=h("span",{class:"pill"+(total&&n>=total?" good":"")},n+"/"+(total||"–")+" watched")}
    else if(slotInfo(S.slot)){extra=hasWatched(p.id,S.slot)?h("span",{class:"pill good"},"✓ Watched"):h("span",{class:"pill new"},"To watch")}
    return playCard(p,extra)})));
  if(!list.length)out.push(h("p",{class:"sub"},"No plays in this category yet."));
  return out;
}
function libraryView(){
  const out=[h("div",{},h("div",{class:"eyebrow"},"Moves library"),h("h1",{},"Library"),h("p",{class:"sub"},"Ready-made moves to learn from or adapt. "+(S.coach?"Add any of them to the team plays.":"Use one as a starting point for a suggestion.")))];
  out.push(catFilter(LIB));
  out.push(h("div",{class:"list"},LIB.filter(p=>S.filter==="All"||p.cat===S.filter).map(p=>playCard(p))));
  return out;
}
function suggestedView(){
  const out=[h("div",{},h("div",{class:"eyebrow"},"From the squad"),h("h1",{},"Suggested"),h("p",{class:"sub"},S.coach?"Players' ideas wait here until you approve them.":"Anyone can suggest a play. The coach approves it before it goes to the team."))];
  out.push(errorBanner());
  if(!S.suggestions.length){out.push(h("div",{class:"empty"},h("h2",{},"Nothing suggested yet"),h("p",{style:"margin:0"},"Tap New to draw a play and send it to the coach."),h("button",{class:"btn primary",type:"button",onclick:openTemplatePicker},"Suggest a play")));return out}
  const order={pending:0,approved:1,declined:2};
  const list=S.suggestions.slice().sort((a,b)=>(order[a.status]??3)-(order[b.status]??3));
  out.push(h("div",{class:"list"},list.map(sg=>{const by=slotInfo(sg.by);const st=sg.status==="approved"?h("span",{class:"pill good"},"Approved"):sg.status==="declined"?h("span",{class:"pill bad"},"Not used"):h("span",{class:"pill new"},"Waiting for coach");
    return playCard(sg,[st,h("span",{},"by "+(by?by.name:"a player"))])})));
  return out;
}
function squadView(){
  const out=[h("div",{},h("div",{class:"eyebrow"},"Matchday 23"),h("h1",{},"Squad"),h("p",{class:"sub"},S.coach?"Rename players here. Players pick their name when they first open the link, and it's used to track what they've watched.":"Tap your name at the top to change who you are on this device."))];
  out.push(errorBanner());
  const players=S.squad;
  if(!players.length){out.push(h("div",{class:"empty"},h("h2",{},"No squad yet"),S.coach?h("button",{class:"btn primary",type:"button",onclick:async()=>{try{await API.saveSquad(S.pin,placeholderSquad());toast("Squad created");refresh()}catch(e){onCoachError(e)}}},"Create a 23-player squad"):h("p",{style:"margin:0"},"The coach hasn't set up the squad yet.")));return out}
  const nPlays=S.plays.length;
  const panel=h("div",{class:"panel"});
  if(S.coach&&nPlays){const tot=players.reduce((a,p)=>a+S.plays.filter(pl=>hasWatched(pl.id,p.id)).length,0);const pct=Math.round(100*tot/(nPlays*players.length));panel.append(h("div",{class:"row"},h("strong",{},"Squad has watched "+pct+"% of plays"),h("span",{class:"grow"})),h("div",{class:"meter"},h("i",{style:"width:"+pct+"%"})))}
  const rows=players.map(p=>{
    const seen=S.plays.filter(pl=>hasWatched(pl.id,p.id)).length;
    const nameEl=S.coach?h("input",{class:"in",id:"sq-"+p.id,value:p.name,maxlength:40,"aria-label":"Name for number "+p.num,style:"padding:7px 10px;font-size:15px"}):h("div",{style:"font-weight:600"},p.name);
    return h("div",{class:"squad-row"},h("div",{class:"jersey"+(p.num>15?" rep":"")},String(p.num)),h("div",{style:"min-width:0;display:flex;flex-direction:column;gap:2px"},nameEl,h("span",{class:"pos"},p.pos)),h("div",{class:"cnt"},nPlays?seen+"/"+nPlays:""));
  });
  panel.append(h("div",{},rows));
  if(S.coach)panel.append(h("div",{class:"row end"},h("button",{class:"btn primary",type:"button",onclick:async e=>{const btn=e.currentTarget;const next=players.map(p=>{const el=document.getElementById("sq-"+p.id);const nm=(el&&el.value.trim())||("Player "+p.num);return Object.assign({},p,{name:nm.slice(0,40)})});btn.disabled=true;try{await API.saveSquad(S.pin,next);toast("Squad saved");await refresh()}catch(err){onCoachError(err)}btn.disabled=false}},"Save names")));
  out.push(panel);return out;
}

/* ---------- Overlays ---------- */
function closeOverlay(){document.getElementById("overlay").replaceChildren()}
function sheet(...kids){const bg=h("div",{class:"sheet-bg",onclick:e=>{if(e.target===bg)closeOverlay()}},h("div",{class:"sheet",role:"dialog","aria-modal":"true"},kids));document.getElementById("overlay").replaceChildren(bg);return bg}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOverlay()});
function openPicker(){
  const players=S.squad;
  if(!players.length){sheet(h("h2",{},"Who are you?"),h("p",{class:"sub"},"The coach hasn't set up the squad yet."),h("button",{class:"btn",type:"button",onclick:closeOverlay},"Close"));return}
  sheet(h("div",{},h("div",{class:"eyebrow"},"One tap, once"),h("h2",{},"Who are you?")),h("p",{class:"sub",style:"margin:0"},"Pick your name so the coach can see which plays you've studied. This device remembers it."),
    h("div",{class:"pick-grid"},players.map(p=>h("button",{class:"pick",type:"button",onclick:()=>{S.slot=p.id;store.set("rp_slot",p.id);closeOverlay();render();toast("Hi, "+p.name)}},h("span",{class:"jersey"+(p.num>15?" rep":""),style:"width:30px;height:30px;font-size:15px"},String(p.num)),h("span",{class:"t"},h("b",{},p.name),h("small",{},p.pos))))),
    h("button",{class:"btn ghost",type:"button",onclick:closeOverlay},"Not now"));
}
function openCoachLogin(){
  const pin=h("input",{class:"in",id:"coach-pin",type:"password",inputmode:"numeric",autocomplete:"current-password",placeholder:"Coach PIN"});
  const err=h("p",{class:"err",hidden:true});
  const btn=h("button",{class:"btn primary",type:"submit"},"Log in");
  const form=h("form",{style:"display:flex;flex-direction:column;gap:10px"},h("label",{class:"f",for:"coach-pin"},"PIN",pin),err,h("div",{class:"row end"},h("button",{class:"btn ghost",type:"button",onclick:closeOverlay},"Cancel"),btn));
  form.addEventListener("submit",async e=>{e.preventDefault();const v=pin.value.trim();if(!v)return;btn.disabled=true;err.hidden=true;
    try{await API.login(v);S.pin=v;S.coach=true;store.set("rp_pin",v);closeOverlay();toast("Coach mode on");if(S.screen&&S.screen.play)openPlayer(S.screen.play);else render()}
    catch(ex){err.textContent=errMsg(ex);err.hidden=false;btn.disabled=false;pin.select()}});
  sheet(h("div",{},h("div",{class:"eyebrow"},"Coaches only"),h("h2",{},"Coach login")),h("p",{class:"sub",style:"margin:0"},"Coaches can add, edit and delete plays, approve suggestions and rename the squad."+(REMOTE?"":" The demo PIN is "+DEMO_PIN+".")),form);
  setTimeout(()=>pin.focus(),50);
}
function openCoachMenu(){
  const cur=h("input",{class:"in",id:"pin-new",type:"password",inputmode:"numeric",autocomplete:"new-password",placeholder:"New PIN, at least 6 characters"});
  const msg=h("p",{class:"err",hidden:true});
  const save=h("button",{class:"btn",type:"button",onclick:async()=>{const v=cur.value.trim();if(v.length<6){msg.textContent="Use at least 6 characters.";msg.hidden=false;return}save.disabled=true;try{await API.changePin(S.pin,v);S.pin=v;store.set("rp_pin",v);closeOverlay();toast("PIN changed. Tell your other coaches.")}catch(e){msg.textContent=errMsg(e);msg.hidden=false;save.disabled=false}}},"Change PIN");
  sheet(h("div",{},h("div",{class:"eyebrow"},"Coach"),h("h2",{},"Coach settings")),
    h("div",{class:"panel"},h("strong",{},"Share the playbook"),h("p",{class:"sub",style:"margin:0"},"Send this link to the squad. They open it and tap their name. No account or app needed."),
      h("div",{class:"row"},h("input",{class:"in grow",id:"share-url",readonly:true,value:location.origin+location.pathname,onfocus:e=>e.target.select()}),h("button",{class:"btn primary",type:"button",onclick:()=>shareLink(location.origin+location.pathname,"Rugby Plays","Our team playbook. Open it and tap your name.")},"Share"))),
    h("div",{class:"panel"},h("label",{class:"f",for:"pin-new"},"Change coach PIN",cur),msg,h("div",{class:"row end"},save)),
    h("div",{class:"row"},h("button",{class:"btn danger",type:"button",onclick:()=>{S.coach=false;S.pin=null;try{localStorage.removeItem("rp_pin")}catch(_){}closeOverlay();toast("Logged out of coach mode");if(S.screen&&S.screen.play)openPlayer(S.screen.play);else render()}},"Log out of coach mode"),h("span",{class:"grow"}),h("button",{class:"btn ghost",type:"button",onclick:closeOverlay},"Close")));
}
async function shareLink(url,title,text){
  if(navigator.share){try{await navigator.share({title,text,url});return}catch(e){if(e&&e.name==="AbortError")return}}
  try{await navigator.clipboard.writeText(url);toast("Link copied")}catch(e){const el=document.getElementById("share-url");if(el){el.focus();el.select()}toast("Copy the link above")}
}
function openTemplatePicker(){
  sheet(h("div",{},h("div",{class:"eyebrow"},S.coach?"New team play":"New suggestion"),h("h2",{},"Start from")),
    h("div",{class:"pick-grid"},Object.entries(TEMPLATES).map(([k,t])=>{const pl=blankPlay(k);return h("button",{class:"pick",type:"button",style:"flex-direction:column;align-items:stretch",onclick:()=>{closeOverlay();openEditor(pl,{isNew:true})}},h("div",{class:"thumb",style:"width:100%"},miniPitch(pl)),h("span",{class:"t"},h("b",{},t.label)))})),
    h("button",{class:"btn ghost",type:"button",onclick:closeOverlay},"Cancel"));
}

/* ---------- Player (watch a play) ---------- */
function openPlayer(play){
  stopAnim();closeOverlay();S.screen={kind:"player",play};renderChrome();window.scrollTo(0,0);
  if(play.kind==="team"||play.kind==="library"){const want="#play-"+encodeURIComponent(play.id);if(location.hash!==want)history.replaceState(null,"",want)}
  const v=document.getElementById("view");v.replaceChildren();
  const n=play.steps.length;const pitch=new Pitch({aspect:.8});pitch.fit(play);
  let t=0,playing=false,speed=1,reached=false;
  const wrap=h("div",{class:"pitch-wrap"},pitch.svg,h("span",{class:"pitch-tag"},play.cat));
  const noteK=h("span",{class:"k"});const noteP=h("p",{});
  const dots=h("div",{class:"steps"});
  const playBtn=h("button",{class:"tbtn big",type:"button","aria-label":"Play"},icon("play"));
  function setPlayIcon(){playBtn.replaceChildren(icon(playing?"pause":"play"));playBtn.setAttribute("aria-label",playing?"Pause":"Play")}
  function show(){const k=Math.round(t);pitch.draw(play,frameAt(play,t));
    if(Math.abs(t-k)<.001)pitch.drawTrails(play,k);else pitch.trails.replaceChildren();
    const ki=Math.max(0,Math.min(n-1,Math.floor(t+.0001)));noteK.textContent="Step "+(ki+1)+" of "+n;noteP.textContent=play.steps[ki].note||"—";
    [...dots.children].forEach((d,i)=>d.setAttribute("aria-current",i===ki?"true":"false"));
    if(ki===n-1&&!reached){reached=true;markWatched(play)}}
  for(let i=0;i<n;i++)dots.append(h("button",{class:"sdot",type:"button","aria-label":"Go to step "+(i+1),onclick:()=>{pause();t=i;show()}},String(i+1)));
  function pause(){playing=false;stopAnim();setPlayIcon()}
  function play_(){if(t>=n-1)t=0;playing=true;setPlayIcon();let last=performance.now();
    const tick=now=>{if(!S.screen||S.screen.play!==play){anim=null;return}const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;t+=dt*speed/1.25;if(t>=n-1){t=n-1;show();pause();return}show();anim={raf:requestAnimationFrame(tick)}};anim={raf:requestAnimationFrame(tick)}}
  playBtn.onclick=()=>playing?pause():play_();
  const transport=h("div",{class:"transport"},
    h("button",{class:"tbtn",type:"button","aria-label":"Restart",onclick:()=>{pause();t=0;show()}},icon("restart")),
    h("button",{class:"tbtn",type:"button","aria-label":"Previous step",onclick:()=>{pause();t=Math.max(0,Math.ceil(t-1.0001));show()}},icon("prev")),
    playBtn,
    h("button",{class:"tbtn",type:"button","aria-label":"Next step",onclick:()=>{pause();t=Math.min(n-1,Math.floor(t+1.0001));show()}},icon("next")));
  const speeds=h("div",{class:"speed",role:"group","aria-label":"Speed"},[.5,1,2].map(sp=>h("button",{class:"chip",type:"button","aria-pressed":sp===1?"true":"false",onclick:e=>{speed=sp;[...speeds.children].forEach(c=>c.setAttribute("aria-pressed","false"));e.currentTarget.setAttribute("aria-pressed","true")}},sp+"×")));

  const backTab=play.kind==="library"?"library":play.kind==="suggestion"?"suggested":"home";
  const head=h("div",{},h("button",{class:"back",type:"button",onclick:()=>go(backTab)},"← Back"),play.call?h("div",{class:"eyebrow"},play.call):null,h("h1",{},play.title),
    play.kind==="suggestion"?h("p",{class:"sub"},"Suggested by "+((slotInfo(play.by)||{}).name||"a player")):null);
  v.append(head,wrap,h("div",{class:"legend"},h("span",{},h("i",{style:"background:var(--attack)"}),"Us"),play.tokens.some(id=>id.startsWith("o"))?h("span",{},h("i",{style:"background:var(--opp)"}),"Opposition"):null,h("span",{},h("i",{style:"background:#F3E9CC;border:1px solid #3B2A0E"}),"Ball"),h("span",{},h("i",{style:"background:none;border-top:2px dashed var(--accent);border-radius:0;height:0;width:14px"}),"Pass")),
    h("div",{class:"note","aria-live":"polite"},noteK,noteP),transport,dots,speeds);

  const actions=h("div",{class:"row"});
  if(play.kind==="team")actions.append(h("button",{class:"btn",type:"button",onclick:()=>shareLink(location.origin+location.pathname+"#play-"+encodeURIComponent(play.id),play.title,"Watch this before training: "+play.title)},"Share this play"));
  if(play.kind==="library"){
    if(S.coach)actions.append(h("button",{class:"btn accent grow",type:"button",onclick:async e=>{const b=e.currentTarget;b.disabled=true;try{await API.savePlay(S.pin,play,null,"library");toast("Added to team plays");await refresh();go("home")}catch(err){onCoachError(err);b.disabled=false}}},"Add to team plays"));
    actions.append(h("button",{class:"btn grow",type:"button",onclick:()=>openEditor(Object.assign(clone(play),{id:null,kind:"draft",title:play.title+" (our version)"}),{isNew:true})},"Adapt this move"));
  }else if(play.kind==="team"){
    if(S.coach)actions.append(h("button",{class:"btn primary grow",type:"button",onclick:()=>openEditor(clone(play),{editId:play.id})},"Edit play"));
    else actions.append(h("button",{class:"btn grow",type:"button",onclick:()=>openEditor(Object.assign(clone(play),{id:null,kind:"draft",title:play.title+" (my idea)"}),{isNew:true})},"Suggest a change"));
  }else if(play.kind==="suggestion"&&S.coach){
    if(play.status==="pending")actions.append(h("button",{class:"btn accent grow",type:"button",onclick:async e=>{const b=e.currentTarget;b.disabled=true;try{await API.approve(S.pin,play.id);toast("Approved and added to team plays");await refresh();go("home")}catch(err){onCoachError(err);b.disabled=false}}},"Approve"),
      h("button",{class:"btn grow",type:"button",onclick:()=>openEditor(clone(play),{fromSuggestion:play.id})},"Edit, then approve"),
      h("button",{class:"btn danger",type:"button",onclick:async()=>{try{await API.review(S.pin,play.id,"declined");toast("Marked as not used");await refresh();go("suggested")}catch(err){onCoachError(err)}}},"Decline"));
    else actions.append(h("button",{class:"btn danger sm",type:"button",onclick:async()=>{try{await API.deleteSuggestion(S.pin,play.id);toast("Suggestion removed");await refresh();go("suggested")}catch(err){onCoachError(err)}}},"Remove suggestion"));
  }
  if(actions.children.length)v.append(actions);

  if(play.kind==="team"&&S.coach){
    const players=S.squad;const seen=new Set(watchersOf(play.id));
    const panel=h("div",{class:"panel"},h("div",{class:"row"},h("h2",{},"Who's watched it"),h("span",{class:"grow"}),h("span",{class:"pill"+(players.length&&players.every(p=>seen.has(p.id))?" good":"")},players.filter(p=>seen.has(p.id)).length+"/"+players.length)),
      players.length?h("div",{class:"watch-grid"},players.slice().sort((a,b)=>(seen.has(b.id)-seen.has(a.id))||a.num-b.num).map(p=>h("div",{class:"wp "+(seen.has(p.id)?"yes":"no")},h("span",{class:"d"}),h("span",{},p.num+". "+p.name)))):h("p",{class:"sub",style:"margin:0"},"Set up the squad to track this."));
    const del=h("div",{class:"row"});
    const delBtn=h("button",{class:"btn danger sm",type:"button",onclick:()=>{del.replaceChildren(h("div",{class:"confirm grow"},"Delete this play for the whole team?",h("span",{class:"grow"}),h("button",{class:"btn sm",type:"button",onclick:()=>{del.replaceChildren(delBtn)}},"Keep"),h("button",{class:"btn sm danger",type:"button",onclick:async()=>{try{await API.deletePlay(S.pin,play.id);toast("Play deleted");await refresh();go("home")}catch(err){onCoachError(err)}}},"Delete")))}},"Delete play");
    del.append(delBtn);
    v.append(panel,del);
  }else if(play.kind==="team"&&!S.coach&&!slotInfo(S.slot)&&S.squad.length){
    v.append(h("div",{class:"banner"},"Pick your name at the top so the coach knows you've watched this."));
  }
  show();setPlayIcon();
  if(!reduceMotion&&n>1)setTimeout(()=>{if(S.screen&&S.screen.play===play&&!playing&&t===0)play_()},500);
}

/* ---------- Editor ---------- */
function openEditor(play,opts={}){
  stopAnim();closeOverlay();S.screen={kind:"editor"};renderChrome();window.scrollTo(0,0);
  if(location.hash)history.replaceState(null,"",location.pathname+location.search);
  const v=document.getElementById("view");v.replaceChildren();
  let k=0,dirty=false;let oppN=play.tokens.filter(t=>t.startsWith("o")).length;
  const pitch=new Pitch({editable:true,aspect:.8});pitch.fit(play);
  const wrap=h("div",{class:"pitch-wrap editing"},pitch.svg,h("span",{class:"pitch-tag"},"Drag players · drag the ball"));
  const tools=h("div",{class:"pitch-tools"},
    h("button",{type:"button","aria-label":"Zoom in",onclick:()=>zoom(.8)},"+"),
    h("button",{type:"button","aria-label":"Zoom out",onclick:()=>zoom(1.25)},"−"),
    h("button",{type:"button","aria-label":"Fit to players",onclick:()=>{pitch.fit(play);redraw()},style:"font-size:12px"},"Fit"));
  wrap.append(tools);
  function zoom(f){const[x,y,w,hh]=pitch.vb;const cx=x+w/2,cy=y+hh/2;const nw=Math.max(14,Math.min(110,w*f)),nh=nw/.8;pitch.setView([cx-nw/2,cy-nh/2,nw,nh])}

  const title=h("input",{class:"in",id:"ed-title",placeholder:"e.g. Lineout drive left",value:play.title||"",maxlength:80});
  const cat=h("select",{class:"in",id:"ed-cat"},CATS.map(c=>h("option",{value:c,selected:c===play.cat?true:null},c)));
  const call=h("input",{class:"in",id:"ed-call",placeholder:"e.g. Red 4",value:play.call||"",maxlength:40});
  title.oninput=()=>{play.title=title.value;dirty=true};cat.onchange=()=>{play.cat=cat.value;dirty=true};call.oninput=()=>{play.call=call.value;dirty=true};
  const noteIn=h("textarea",{class:"in",id:"ed-note",rows:2,maxlength:200,placeholder:"What happens in this step? e.g. 9 passes to 10, 12 runs a hard line."});
  noteIn.oninput=()=>{play.steps[k].note=noteIn.value.slice(0,200);dirty=true};
  const stepsBar=h("div",{class:"steps"});
  const selInfo=h("span",{class:"sub",style:"margin:0;font-size:13px"});
  const removeBtn=h("button",{class:"btn sm danger",type:"button",onclick:()=>{const id=pitch.selected;if(!id||!id.startsWith("o"))return;play.tokens=play.tokens.filter(t=>t!==id);play.steps.forEach(st=>{delete st.pos[id];if(st.ball&&st.ball.h===id){const p=ballAt(st);st.ball={x:p[0],y:p[1]}}});pitch.selected=null;dirty=true;redraw()}},"Remove opposition player");
  const delStep=h("button",{class:"btn sm",type:"button",onclick:()=>{if(play.steps.length<2)return;play.steps.splice(k,1);k=Math.max(0,k-1);noteIn.value=play.steps[k].note||"";dirty=true;redraw()}},"Delete step");

  function redraw(){pitch.draw(play,frameAt(play,k));pitch.drawTrails(play,k);
    stepsBar.replaceChildren(...play.steps.map((_,i)=>h("button",{class:"sdot",type:"button","aria-current":i===k?"true":"false",onclick:()=>{k=i;noteIn.value=play.steps[k].note||"";redraw()}},String(i+1))),
      h("button",{class:"sdot add",type:"button",onclick:()=>{if(play.steps.length>=20){toast("20 steps is the most a play can have");return}play.steps.splice(k+1,0,clone(Object.assign({},play.steps[k],{note:""})));k++;noteIn.value="";dirty=true;redraw()}},"+ Step"));
    const sel=pitch.selected;selInfo.textContent=sel?(sel.startsWith("o")?"Opposition player selected":sel+" · "+POS[sel]+" selected"):"Tap a player to select. Drop the ball on a player to give it to them.";
    removeBtn.hidden=!(sel&&sel.startsWith("o"));delStep.disabled=play.steps.length<2;}

  let drag=null;
  function toPitch(e){const pt=pitch.svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=pitch.svg.getScreenCTM();if(!m)return[0,0];const p=pt.matrixTransform(m.inverse());return[p.x,p.y]}
  pitch.svg.addEventListener("pointerdown",e=>{
    const st=play.steps[k];const[x,y]=toPitch(e);const bp=ballAt(st);let target=null;
    if(Math.hypot(bp[0]-x,bp[1]-y)<1.4)target="ball";
    else{let best=2.4;for(const id of play.tokens){const p=st.pos[id];if(!p)continue;const d=Math.hypot(p[0]-x,p[1]-y);if(d<best){best=d;target=id}}}
    if(!target)return;e.preventDefault();pitch.svg.setPointerCapture(e.pointerId);
    drag={id:target,sx:x,sy:y,moved:false,orig:target==="ball"?bp:st.pos[target].slice()};
  });
  pitch.svg.addEventListener("pointermove",e=>{if(!drag)return;const[x,y]=toPitch(e);const dx=x-drag.sx,dy=y-drag.sy;if(!drag.moved&&Math.hypot(dx,dy)<.5)return;drag.moved=true;
    const st=play.steps[k];const nx=Math.max(-4,Math.min(74,drag.orig[0]+dx)),ny=Math.max(-8,Math.min(108,drag.orig[1]+dy));
    if(drag.id==="ball")st.ball={x:nx,y:ny};else st.pos[drag.id]=[nx,ny];
    pitch.draw(play,frameAt(play,k));pitch.drawTrails(play,k)});
  function end(){if(!drag)return;const st=play.steps[k];
    if(drag.moved){dirty=true;if(drag.id==="ball"){const b=[st.ball.x,st.ball.y];let best=2.8,who=null;for(const id of play.tokens){const p=st.pos[id];if(!p)continue;const d=Math.hypot(p[0]+1.15-b[0],p[1]-1.15-b[1]);if(d<best){best=d;who=id}}if(who)st.ball={h:who}}}
    else if(drag.id!=="ball"){pitch.selected=pitch.selected===drag.id?null:drag.id}
    drag=null;redraw()}
  pitch.svg.addEventListener("pointerup",end);pitch.svg.addEventListener("pointercancel",end);

  const addOpp=h("button",{class:"btn sm",type:"button",onclick:()=>{if(play.tokens.length>=40){toast("That's the most players a play can have");return}let id;do{oppN++;id="o"+oppN}while(play.tokens.includes(id));const[x,y,w,hh]=pitch.vb;const c=[x+w/2+(Math.random()*6-3),y+hh*.3];play.tokens.push(id);play.steps.forEach(st=>{st.pos[id]=c.slice()});pitch.selected=id;dirty=true;redraw()}},"+ Opposition");
  const preview=h("button",{class:"btn sm",type:"button",onclick:()=>{if(play.steps.length<2){toast("Add a second step to preview the movement");return}stopAnim();let t=0,last=performance.now();const tick=now=>{if(!S.screen||S.screen.kind!=="editor"){anim=null;return}t+=Math.max(0,Math.min(.05,(now-last)/1000))/1.25;last=now;if(t>=play.steps.length-1){anim=null;redraw();return}pitch.draw(play,frameAt(play,t));pitch.trails.replaceChildren();anim={raf:requestAnimationFrame(tick)}};anim={raf:requestAnimationFrame(tick)}}},"▶ Preview");

  const backTo=opts.editId?"home":opts.fromSuggestion?"suggested":S.tab;
  const saveBtn=h("button",{class:"btn accent grow",type:"button"},opts.fromSuggestion?"Save and approve":S.coach?(opts.editId?"Save changes":"Save to team plays"):"Send to coach");
  saveBtn.onclick=async()=>{
    play.title=title.value.trim();play.call=call.value.trim();play.cat=cat.value;
    if(!play.title){toast("Give the play a name first");title.focus();return}
    saveBtn.disabled=true;
    try{
      if(S.coach){const id=await API.savePlay(S.pin,play,opts.editId,opts.fromSuggestion?"suggestion":"coach",play.by);if(opts.fromSuggestion)await API.review(S.pin,opts.fromSuggestion,"approved",id);toast(opts.editId?"Changes saved":"Saved to team plays");await refresh();go("home")}
      else{if(!slotInfo(S.slot)){saveBtn.disabled=false;openPicker();toast("Pick your name so the coach knows who suggested it");return}
        await API.addSuggestion(play,S.slot);toast("Sent to the coach");await refresh();go("suggested")}
    }catch(e){if(S.coach)onCoachError(e);else toast(errMsg(e));saveBtn.disabled=false}
  };
  const cancelArea=h("div",{class:"row"});
  const cancelBtn=h("button",{class:"btn",type:"button",onclick:()=>{if(!dirty){go(backTo);return}cancelArea.replaceChildren(h("div",{class:"confirm grow"},"Discard your changes?",h("span",{class:"grow"}),h("button",{class:"btn sm",type:"button",onclick:()=>cancelArea.replaceChildren(cancelBtn,saveBtn)},"Keep editing"),h("button",{class:"btn sm danger",type:"button",onclick:()=>go(backTo)},"Discard")))}},"Cancel");
  cancelArea.append(cancelBtn,saveBtn);

  v.append(
    h("div",{},h("div",{class:"eyebrow"},opts.editId?"Editing team play":S.coach?"New team play":"New suggestion"),h("h1",{},opts.editId?"Edit play":"Build a play")),
    !S.coach?h("div",{class:"banner"},"Your play goes to the coach first. It appears for the team once it's approved."):null,
    h("label",{class:"f",for:"ed-title"},"Play name",title),
    h("div",{class:"grid2"},h("label",{class:"f",for:"ed-cat"},"Type",cat),h("label",{class:"f",for:"ed-call"},"Call (what you shout)",call)),
    wrap,selInfo,
    h("div",{class:"panel"},h("div",{class:"row"},h("h2",{},"Steps"),h("span",{class:"grow"}),preview),stepsBar,h("label",{class:"f",for:"ed-note"},"Coaching note for this step",noteIn),h("div",{class:"row"},addOpp,removeBtn,h("span",{class:"grow"}),delStep)),
    cancelArea);
  noteIn.value=play.steps[0].note||"";redraw();
}

boot();
