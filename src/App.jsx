import {useEffect,useState,useMemo,memo,useRef} from 'react';
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut} from 'firebase/auth';
import {doc,setDoc,updateDoc,deleteDoc,collection,onSnapshot,getDocs,runTransaction,getDoc,writeBatch} from 'firebase/firestore';
import {auth,db,fbError} from './firebase';import {L} from './i18n';import {candidates,screenWidth,parseItems} from './media';

const ICONS={mix:['🪙','💵','🪙','💰','💶'],coins:['🪙'],bills:['💵','💶','💴'],clover:['🍀','🪙'],stars:['✨','⭐','🪙']};
const useMedia=q=>{const[m,setM]=useState(()=>matchMedia(q).matches);useEffect(()=>{const mq=matchMedia(q),h=()=>setM(mq.matches);h();mq.addEventListener('change',h);return()=>mq.removeEventListener('change',h)},[q]);return m};
const FX=memo(({fx,custom})=>{const key=custom?.length?JSON.stringify(custom):'';
 const items=useMemo(()=>Array.from({length:fx.count},(_,i)=>{const set=custom?.length?custom:(ICONS[fx.set]||ICONS.mix).map(e=>({t:'e',e}));return{l:Math.random()*100,d:9+Math.random()*9,dl:-Math.random()*18,s:.65+Math.random()*.7,it:set[i%set.length],r:Math.random()>.5?1:-1}}),[fx.count,fx.set,key]);
 if(!fx.on)return null;return <div className="fx" aria-hidden>{items.map((x,i)=><span key={i} style={{left:x.l+'%',fontSize:fx.size*x.s,animationDuration:x.d+'s',animationDelay:x.dl+'s','--r':x.r*360+'deg'}}>
  {x.it.t==='img'?<img src={x.it.c[0]} alt="" draggable="false" style={{width:fx.size*x.s*1.5,height:fx.size*x.s*1.5}} data-n="0" onError={e=>{const n=+e.target.dataset.n+1;if(n<x.it.c.length){e.target.dataset.n=n;e.target.src=x.it.c[n]}else e.target.style.display='none'}}/>:x.it.e}</span>)}</div>});

// Фон сайта: одна картинка для широких экранов, другая (необязательно) для вертикальных/телефонов
function Bg({skin}){const portrait=useMedia('(max-aspect-ratio: 1/1)');
 const raw=(portrait?(skin.bgMobile||skin.bgDesktop):(skin.bgDesktop||skin.bgMobile))||'';const[src,setSrc]=useState('');
 useEffect(()=>{setSrc('');const c=candidates(raw,screenWidth());if(!c.length)return;let dead=false,k=0;
  const next=()=>{if(dead||k>=c.length)return;const im=new Image();im.onload=()=>{if(!dead)setSrc(c[k])};im.onerror=()=>{k++;next()};im.src=c[k]};next();return()=>{dead=true}},[raw,portrait]);
 if(!src)return null;const blur=+skin.blur||0,dim=+skin.dim||0;
 return <div className="bgwrap" key={src}><div className="bgimg" style={{backgroundImage:`url("${src}")`,backgroundPosition:'center '+(skin.focus||'center'),filter:blur?`blur(${blur}px)`:'none',transform:blur?'scale(1.12)':'none'}}/><div className="dim" style={{background:`rgba(0,0,0,${dim/100})`}}/></div>}

const Clover=({s=36})=><svg width={s} height={s} viewBox="0 0 40 40" fill="var(--gold)"><circle cx="14" cy="14" r="8"/><circle cx="26" cy="14" r="8"/><circle cx="14" cy="26" r="8"/><circle cx="26" cy="26" r="8"/><path d="M20 22 C20 32 22 36 28 39" stroke="var(--gold)" strokeWidth="3" fill="none"/></svg>;
const Brand=({size=140})=><div className="brand"><img src="/logo.png" width={size} alt="LOTTO"/><h1 className="gold-text">LOTTO <Clover/></h1></div>;
const Pass=({value,onChange,ph})=>{const[s,setS]=useState(false);return <div className="pw"><input type={s?'text':'password'} placeholder={ph} value={value} onChange={onChange} required minLength={6}/><button type="button" className="ico" onClick={()=>setS(!s)}>{s?'🙈':'👁'}</button></div>};

function Loader(){return <div className="loader"><img src="/logo.png" width="170" alt=""/><h1 className="gold-text">LOTTO</h1><div className="bar"><i/></div></div>}

function Flip({n,label}){const s=String(Math.max(0,n)).padStart(2,'0');return <div className="unit"><div className="digits">{s.split('').map((c,i)=><span key={i+c} className="digit">{c}</span>)}</div><small>{label}</small></div>}
function Countdown({endAt,t}){const[now,setNow]=useState(Date.now());useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[]);
 let d=Math.max(0,endAt-now)/1000|0;const D=d/86400|0,H=d%86400/3600|0,M=d%3600/60|0,S=d%60;
 return <div className="cd"><Flip n={D} label={t.days}/><Flip n={H} label={t.hours}/><Flip n={M} label={t.minutes}/><Flip n={S} label={t.seconds}/></div>}

function Slot({names,result}){const[txt,setTxt]=useState('?');useEffect(()=>{if(result){setTxt(result);return}if(!names.length)return;const i=setInterval(()=>setTxt(names[Math.random()*names.length|0]),90);return()=>clearInterval(i)},[result,names]);
 return <div className="slot"><div className="top">LOTTO <Clover s={26}/></div><div className="win"><span className={result?'land':''}>{txt}</span></div><div className="keys"><i/><i/><i/><i/></div><div className="coins">{'🪙'.repeat(14)}</div><div className="lever"/></div>}

function DrawModal({winners,names,t,onClose}){const[i,setI]=useState(0);const[land,setLand]=useState(false);
 useEffect(()=>{if(i>=winners.length)return;setLand(false);const a=setTimeout(()=>setLand(true),3500);const b=setTimeout(()=>setI(x=>x+1),5000);return()=>{clearTimeout(a);clearTimeout(b)}},[i,winners.length]);
 const done=i>=winners.length;const cur=winners[Math.min(i,winners.length-1)];const n=done?winners.length:i+(land?1:0);
 const em=useMemo(()=>[...Array(40)].map(()=>({l:Math.random()*100,d:2+Math.random()*3,e:['🎉','🎊','✨','🥳','🍀','🪙','💵'][Math.random()*7|0],x:Math.random()*2})),[]);
 return <div className="modal">{em.map((x,k)=><span key={k} className="conf" style={{left:x.l+'%',animationDuration:x.d+'s',animationDelay:x.x+'s'}}>{x.e}</span>)}
 <div className="box"><h2 className="gold-text">{t.congrats} 🎉</h2><Slot names={names} result={done||land?cur.name:null}/>
 <ol className="wl">{winners.slice(0,n).map((w,k)=><li key={w.uid}>🏆 {k+1}. {w.name}</li>)}</ol>
 {done&&<button className="btn" onClick={onClose}>{t.close}</button>}</div></div>}

function Auth({t,notice}){const[reg,setReg]=useState(false);const[f,setF]=useState({firstName:'',lastName:'',age:'',email:'',phone:'',city:'',tiktok:'',password:''});const[err,setErr]=useState('');const[busy,setBusy]=useState(false);
 const set=k=>e=>setF({...f,[k]:e.target.value});
 const create=async uid=>{const{password,...p}=f;const fn=p.firstName.trim(),ln=p.lastName.trim();const admin=fn==='Rusnac'&&ln==='Lilian';
  await setDoc(doc(db,'users',uid),{...p,firstName:fn,lastName:ln,role:admin?'admin':'user',createdAt:Date.now()});
  if(!admin)await setDoc(doc(db,'participants',uid),{name:`${fn} ${ln}`,at:Date.now()})};
 const submit=async e=>{e.preventDefault();setErr('');setBusy(true);try{
  if(!reg){await signInWithEmailAndPassword(auth,f.email,f.password);return}
  try{const c=await createUserWithEmailAndPassword(auth,f.email,f.password);await create(c.user.uid)}
  catch(x){if(x.code!=='auth/email-already-in-use')throw x;const c=await signInWithEmailAndPassword(auth,f.email,f.password);const s=await getDoc(doc(db,'users',c.user.uid));if(s.exists())throw x;await create(c.user.uid)}
 }catch(x){setErr(t.err+': '+x.code)}finally{setBusy(false)}};
 return <div className="center"><Brand/>{notice&&<p className="err">{t.removed}</p>}<form className="card" onSubmit={submit}><h2>{reg?t.register:t.login}</h2>
 {reg&&['firstName','lastName','age','phone','city','tiktok'].map(k=><input key={k} placeholder={t[k]} value={f[k]} onChange={set(k)} required type={k==='age'?'number':'text'} autoComplete="off"/>)}
 <input type="email" placeholder={t.email} value={f.email} onChange={set('email')} required/><Pass ph={t.password} value={f.password} onChange={set('password')}/>
 {err&&<p className="err">{err}</p>}<button className="btn" disabled={busy}>{busy?'…':reg?t.register:t.login}</button><a onClick={()=>setReg(!reg)}>{reg?t.have:t.no}</a></form></div>}

function Panel({title,onClose,children}){return <div className="modal" onClick={onClose}><div className="box small" onClick={e=>e.stopPropagation()}><h2 className="gold-text">{title}</h2>{children}<button className="btn ghost" onClick={onClose}>✕</button></div></div>}

function Settings({me,uid,t,fx,setFx,custom,onClose}){const[f,setF]=useState(me);const[ok,setOk]=useState(false);const up=o=>setFx({...fx,...o});
 return <Panel title={t.settings} onClose={onClose}>{['firstName','lastName','age','email','phone','city','tiktok'].map(k=><label key={k}>{t[k]}<input value={f[k]||''} onChange={e=>{setOk(false);setF({...f,[k]:e.target.value})}}/></label>)}
 <button className="btn" onClick={async()=>{const{role,createdAt,...r}=f;await updateDoc(doc(db,'users',uid),r);if(me.role!=='admin')await setDoc(doc(db,'participants',uid),{name:`${f.firstName} ${f.lastName}`},{merge:true});setOk(true)}}>{ok?t.saved+' ✓':t.save}</button>
 <h3 className="gold-text">{t.effects}</h3>
 <label className="chk"><input type="checkbox" checked={fx.on} onChange={e=>up({on:e.target.checked})}/>{t.fxOn}</label>
 <label>{t.size}: {fx.size}px<input type="range" min="14" max="64" value={fx.size} onChange={e=>up({size:+e.target.value})}/></label>
 <label>{t.amount}: {fx.count}<input type="range" min="6" max="60" value={fx.count} onChange={e=>up({count:+e.target.value})}/></label>
 {custom?.length?<p className="muted">{t.fxCustomNote}</p>:<div className="sets">{Object.keys(ICONS).map(k=><button key={k} className={fx.set===k?'on':''} onClick={()=>up({set:k})}>{ICONS[k][0]} {t.sets[k]}</button>)}</div>}</Panel>}

function SkinAdmin({t,skin,onDraft,onLocal,onClose}){const[st,setSt]=useState('');
 const[v,setV]=useState({bgDesktop:'',bgMobile:'',dim:30,blur:0,focus:'center',fallText:'',fallCustom:false,...skin});const[busy,setBusy]=useState(false);const[ok,setOk]=useState(false);
 const up=o=>{setOk(false);setV(x=>({...x,...o}))};
 useEffect(()=>{const i=setTimeout(()=>onDraft(v),500);return()=>clearTimeout(i)},[v]);
 const close=()=>{onDraft(null);onClose()};
 const items=useMemo(()=>parseItems(v.fallText),[v.fallText]);
 const pack=()=>({bgDesktop:v.bgDesktop.trim(),bgMobile:v.bgMobile.trim(),dim:+v.dim,blur:+v.blur,focus:v.focus,fallText:v.fallText,fallCustom:!!v.fallCustom});
 // 1) сохраняем сразу на этом устройстве (Firebase не нужен); 2) пробуем сохранить для всех через Firebase
 const save=async()=>{setBusy(true);const data=pack(),ts=Date.now();onLocal({...data,savedAt:ts});onDraft(null);setOk(true);setSt('local');
  if(db){try{await setDoc(doc(db,'config','theme'),{...data,updatedAt:ts});setSt('shared')}catch(e){}}setBusy(false)};
 const download=()=>{const b=new Blob([JSON.stringify(pack(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='theme.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
 const reset=async()=>{if(!confirm(t.bgResetConfirm))return;const e0={bgDesktop:'',bgMobile:'',dim:30,blur:0,focus:'center',fallText:'',fallCustom:false};onLocal({...e0,savedAt:Date.now()});onDraft(null);
  if(db){try{await setDoc(doc(db,'config','theme'),{...e0,updatedAt:Date.now()})}catch(e){}}onClose()};
 return <Panel title={'🖼 '+t.background} onClose={close}>
  <p className="muted hint">{t.bgHint}</p>
  <label>{t.bgDesktop}<input placeholder="https://… / drive.google.com/…" value={v.bgDesktop} onChange={e=>up({bgDesktop:e.target.value})}/></label>
  <label>{t.bgMobile}<input placeholder="https://… / drive.google.com/…" value={v.bgMobile} onChange={e=>up({bgMobile:e.target.value})}/></label>
  <label>{t.dim}: {v.dim}%<input type="range" min="0" max="85" value={v.dim} onChange={e=>up({dim:+e.target.value})}/></label>
  <label>{t.blur}: {v.blur}px<input type="range" min="0" max="20" value={v.blur} onChange={e=>up({blur:+e.target.value})}/></label>
  <div className="sets">{['top','center','bottom'].map(k=><button key={k} className={v.focus===k?'on':''} onClick={()=>up({focus:k})}>{t.focus[k]}</button>)}</div>
  <h3 className="gold-text">{t.fallTitle}</h3>
  <p className="muted hint">{t.fallHint}</p>
  <textarea rows="5" placeholder={'💵💰🪙\nhttps://example.com/photo.png\nhttps://drive.google.com/file/d/…'} value={v.fallText} onChange={e=>up({fallText:e.target.value})}/>
  <div className="prev">{items.map((x,i)=>x.t==='img'?<img key={i} src={x.c[0]} alt="" data-n="0" onError={e=>{const n=+e.target.dataset.n+1;if(n<x.c.length){e.target.dataset.n=n;e.target.src=x.c[n]}else e.target.style.opacity=.2}}/>:<span key={i}>{x.e}</span>)}</div>
  <label className="chk"><input type="checkbox" checked={!!v.fallCustom} onChange={e=>up({fallCustom:e.target.checked})}/>{t.fallUse}</label>
  <button className="btn" disabled={busy} onClick={save}>{busy?'…':ok?t.saved+' ✓':t.save}</button>
  {st&&<p className="muted hint">{st==='shared'?t.savedShared:t.savedLocal}</p>}
  <button className="btn ghost" onClick={download}>⬇ {t.exportTheme}</button><p className="muted hint">{t.exportHint}</p>
  <button className="btn ghost" onClick={reset}>{t.bgReset}</button></Panel>}

function CountdownAdmin({t,onClose}){const[v,setV]=useState({months:0,days:0,hours:0,minutes:0,seconds:0});
 return <Panel title={t.countdown} onClose={onClose}>{Object.keys(v).map(k=><label key={k}>{t[k]}<input type="number" min="0" value={v[k]} onChange={e=>setV({...v,[k]:+e.target.value})}/></label>)}
 <button className="btn" onClick={async()=>{const ms=((v.months*30+v.days)*86400+v.hours*3600+v.minutes*60+v.seconds)*1000;if(!ms)return;
  await setDoc(doc(db,'config','contest'),{endAt:Date.now()+ms,drawn:false,winners:[]},{merge:true});onClose()}}>{t.start}</button></Panel>}

function WinnersAdmin({t,cfg,onClose}){const[n,setN]=useState(cfg?.winnersCount||1);
 return <Panel title={t.winners} onClose={onClose}><label>{t.winnersCount}<input type="number" min="1" value={n} onChange={e=>setN(+e.target.value)}/></label>
 <button className="btn" onClick={async()=>{await setDoc(doc(db,'config','contest'),{winnersCount:n},{merge:true});onClose()}}>{t.save}</button></Panel>}

function Main({uid,me,lang,setLang,theme,setTheme,fx,setFx,skin,setDraft,setSkinLocal,custom}){const t=L[lang];const admin=me.role==='admin';
 const[open,setOpen]=useState(false);const[panel,setPanel]=useState(null);const[parts,setParts]=useState([]);const[users,setUsers]=useState({});const[cfg,setCfg]=useState(null);const[seen,setSeen]=useState(false);const[eye,setEye]=useState(false);const[now,setNow]=useState(Date.now());
 useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[]);
 useEffect(()=>{if(admin)deleteDoc(doc(db,'participants',uid)).catch(()=>{});
  const a=onSnapshot(collection(db,'participants'),s=>setParts(s.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.id!==uid||!admin).sort((x,y)=>(x.at||0)-(y.at||0))));
  const b=onSnapshot(doc(db,'config','contest'),s=>setCfg(s.exists()?s.data():null));
  const c=admin?onSnapshot(collection(db,'users'),s=>{const o={};s.docs.forEach(d=>o[d.id]=d.data());setUsers(o)}):()=>{};
  return()=>{a();b();c()}},[admin,uid]);
 // random draw: first client after the end time wins the transaction, retries on failure
 useEffect(()=>{if(!cfg||cfg.drawn||!cfg.endAt)return;let busy=false,stop=false;
  const i=setInterval(async()=>{if(busy||stop||Date.now()<cfg.endAt)return;busy=true;try{
   const snap=await getDocs(collection(db,'participants'));const arr=snap.docs.map(d=>({uid:d.id,name:d.data().name}));
   const buf=new Uint32Array(arr.length);crypto.getRandomValues(buf);
   const win=arr.map((x,k)=>[buf[k],x]).sort((x,y)=>x[0]-y[0]).slice(0,Math.min(cfg.winnersCount||1,arr.length)).map(x=>x[1]);
   await runTransaction(db,async tx=>{const r=doc(db,'config','contest');const s=await tx.get(r);if(s.data().drawn)return;tx.update(r,{drawn:true,winners:win})});
  }catch(e){}busy=false},1500);return()=>{stop=true;clearInterval(i)}},[cfg?.endAt,cfg?.drawn,cfg?.winnersCount]);
 const key='seen_'+cfg?.endAt;useEffect(()=>{setSeen(!!localStorage[key])},[key]);
 const ended=cfg?.drawn&&cfg.endAt<=now;const names=parts.map(p=>p.name);const running=cfg?.endAt>now;
 const rm=async id=>{if(!confirm(t.confirmOne))return;await deleteDoc(doc(db,'participants',id));await deleteDoc(doc(db,'users',id))};
 const rmAll=async()=>{if(!confirm(t.confirmAll))return;const ids=[...new Set([...parts.map(p=>p.id),...Object.keys(users)])].filter(i=>i!==uid);
  for(let k=0;k<ids.length;k+=200){const w=writeBatch(db);ids.slice(k,k+200).forEach(i=>{w.delete(doc(db,'participants',i));w.delete(doc(db,'users',i))});await w.commit()}};
 return <>
 <button className="burger" onClick={()=>setOpen(true)} aria-label="menu"><i/><i/><i/></button>
 <aside className={'nav'+(open?' open':'')}><div className="navtop"><img src="/logo.png" width="44" alt=""/><b className="gold-text">LOTTO</b><Clover s={22}/><button className="ico" onClick={()=>setOpen(false)}>✕</button></div>
  <button onClick={()=>{setPanel('set');setOpen(false)}}>⚙️ {t.settings}</button>
  <div className="row">🌐 {['ru','ro','en'].map(l=><button key={l} className={lang===l?'on':''} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>)}</div>
  <div className="row">{t.theme} <button className={theme==='dark'?'on':''} onClick={()=>setTheme('dark')}>🌙</button><button className={theme==='light'?'on':''} onClick={()=>setTheme('light')}>☀️</button></div>
  {admin&&<><button onClick={()=>{setPanel('cd');setOpen(false)}}>⏱ {t.countdown}</button><button onClick={()=>{setPanel('win');setOpen(false)}}>🏆 {t.winners}</button><button onClick={()=>{setPanel('bg');setOpen(false)}}>🖼 {t.background}</button></>}
  <button onClick={()=>signOut(auth)}>🚪 {t.logout}</button></aside>
 {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
 <main className="home"><Brand size={150}/>
  {running?<Countdown endAt={cfg.endAt} t={t}/>:<p className="muted">{t.waiting}</p>}
  <Slot names={names} result={null}/>
  {ended&&<section className="list"><h3>🏆 {t.winnersTitle}</h3>{cfg.winners?.length?cfg.winners.map((w,k)=><div className="item win1" key={w.uid}><b>{k+1}. {w.name}</b></div>):<p className="muted">{t.noWinners}</p>}</section>}
  <section className="list"><div className="lh"><h3>{t.members} ({parts.length})</h3>
   {admin&&<div className="acts"><button className="ico" title={eye?t.hideData:t.showData} onClick={()=>setEye(!eye)}>{eye?'🙈':'👁'}</button>{parts.length>0&&<button className="del" onClick={rmAll}>{t.deleteAll}</button>}</div>}</div>
   {!parts.length&&<p className="muted">{t.none}</p>}
   {parts.map((p,k)=>{const u=users[p.id];return <div className="item" key={p.id}><span className="num">{k+1}</span><div className="who"><b>{p.name}</b>
    {admin&&eye&&u&&<div className="chips"><span>🎂 {u.age}</span><span>📞 {u.phone}</span><span>✉️ {u.email}</span><span>📍 {u.city}</span><span>♪ @{u.tiktok}</span></div>}</div>
    {admin&&<button className="del" onClick={()=>rm(p.id)}>🗑</button>}</div>})}</section></main>
 {panel==='set'&&<Settings me={me} uid={uid} t={t} fx={fx} setFx={setFx} custom={custom} onClose={()=>setPanel(null)}/>}
 {panel==='bg'&&admin&&<SkinAdmin t={t} skin={skin} onDraft={setDraft} onLocal={setSkinLocal} onClose={()=>setPanel(null)}/>}
 {panel==='cd'&&<CountdownAdmin t={t} onClose={()=>setPanel(null)}/>}
 {panel==='win'&&<WinnersAdmin t={t} cfg={cfg} onClose={()=>setPanel(null)}/>}
 {ended&&!seen&&cfg.winners?.length>0&&<DrawModal winners={cfg.winners} names={names} t={t} onClose={()=>{localStorage[key]=1;setSeen(true)}}/>}</>}

export default function App(){const[boot,setBoot]=useState(true);const[user,setUser]=useState(undefined);const[me,setMe]=useState(null);const[notice,setNotice]=useState(false);
 const ld=k=>{try{return JSON.parse(localStorage[k]||'null')}catch{return null}};
 const[skinDb,setSkinDb]=useState(()=>ld('skin')||{});const[skinFile,setSkinFile]=useState({});const[skinLocal,setSkinLocalS]=useState(()=>ld('skinLocal'));const[draft,setDraft]=useState(null);
 const skinGlobal=skinDb.updatedAt?skinDb:skinFile;const skinNow=skinLocal||skinGlobal;const skin=draft||skinNow;
 const setSkinLocal=d=>{setSkinLocalS(d);if(d)localStorage.skinLocal=JSON.stringify(d);else localStorage.removeItem('skinLocal')};
 const custom=useMemo(()=>skin.fallCustom?parseItems(skin.fallText):null,[skin.fallCustom,skin.fallText]);
 const[lang,setLang]=useState(localStorage.lang||'ru');const[theme,setTheme]=useState(localStorage.theme||'dark');
 const[fx,setFx]=useState(()=>{try{return{on:true,size:28,count:24,set:'mix',...JSON.parse(localStorage.fx||'{}')}}catch{return{on:true,size:28,count:24,set:'mix'}}});
 useEffect(()=>{localStorage.lang=lang;localStorage.theme=theme;localStorage.fx=JSON.stringify(fx);document.documentElement.dataset.theme=theme},[lang,theme,fx]);
 useEffect(()=>{const i=setTimeout(()=>setBoot(false),2800);return()=>clearTimeout(i)},[]);
 useEffect(()=>{fetch('/theme.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d&&typeof d==='object')setSkinFile(d)}).catch(()=>{})},[]);
 useEffect(()=>{if(!db)return;return onSnapshot(doc(db,'config','theme'),s=>{const d=s.exists()?s.data():{};setSkinDb(d);localStorage.skin=JSON.stringify(d);
  const l=ld('skinLocal');if(l&&d.updatedAt&&d.updatedAt>=l.savedAt)setSkinLocal(null)},()=>{})},[]);
 useEffect(()=>{if(skin.bgDesktop||skin.bgMobile)document.documentElement.dataset.bg='1';else delete document.documentElement.dataset.bg},[skin.bgDesktop,skin.bgMobile]);
 useEffect(()=>{if(!auth)return;return onAuthStateChanged(auth,async u=>{setUser(u);if(!u){setMe(null);return}
  for(let k=0;k<10;k++){const s=await getDoc(doc(db,'users',u.uid));if(s.exists()){setMe(s.data());return}await new Promise(r=>setTimeout(r,600))}
  setNotice(true);signOut(auth)})},[]);
 let body;if(!auth)body=<div className="center"><Brand/><div className="card"><h2>⚠️ Firebase</h2><p className="err">{fbError}</p><p className="muted hint">{L[lang].fbSetup}</p></div></div>;else if(boot||user===undefined||(user&&!me))body=<Loader/>;else if(!user)body=<Auth t={L[lang]} notice={notice}/>;else body=<Main uid={user.uid} me={me} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} fx={fx} setFx={setFx} skin={skinNow} setDraft={setDraft} setSkinLocal={setSkinLocal} custom={custom}/>;
 return <>{!boot&&<Bg skin={skin}/>}{!boot&&<FX fx={fx} custom={custom}/>}{body}</>}
