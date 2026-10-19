
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getFirestore,collection,doc,setDoc,updateDoc,deleteDoc,writeBatch,onSnapshot,query} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {firebaseConfig,ADMIN_EMAILS} from './firebase-config.js';
const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);
const IMG={story:'assets/story.webp',giron:'assets/giron.webp',tohyo:'assets/tohyo.webp',kanso:'assets/kanso.webp'};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COH=[];for(let y=2007;y>=1986;y--)COH.push(String(y%100).padStart(2,'0'));
const S={meetups:[],qna:[],inbox:[]};
let ents=[],privs={},dirty=false,unsubs=[],ready=false;
let admin=false,openId=null,formM=null,formQ=null,armed=null,openQ=new Set(),lastK='';
const rebuild=()=>{S.meetups.forEach(m=>{m.people=ents.filter(e=>e.mid===String(m.id)).sort((a,b)=>a.n-b.n).map(e=>({...e,tel:privs[e.n]?.tel||'',bank:privs[e.n]?.bank||''}))})};
const busy=()=>{const a=document.activeElement;return !!a&&$('#app').contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)};
const refresh=()=>{if(busy())dirty=true;else render()};
document.addEventListener('focusout',()=>setTimeout(()=>{if(dirty&&!busy()){dirty=false;render()}},0));
const listen=(q,fn)=>onSnapshot(q,s=>{fn(s);ready=true;rebuild();refresh()},e=>{console.error(e);ready=true;toast('데이터를 불러오지 못했어요');refresh()});
listen(query(collection(db,'meetups')),s=>{S.meetups=s.docs.map(d=>({...d.data(),id:+d.id})).sort((a,b)=>a.date<b.date?-1:1)});
listen(collection(db,'entries'),s=>{ents=s.docs.map(d=>d.data())});
listen(collection(db,'qna'),s=>{S.qna=s.docs.map(d=>({...d.data(),id:+d.id})).sort((a,b)=>a.id-b.id)});
const stopAdmin=()=>{unsubs.forEach(u=>u());unsubs=[];privs={};S.inbox=[];rebuild()};
const startAdmin=()=>{stopAdmin();unsubs=[
 onSnapshot(collection(db,'entryPrivate'),s=>{privs={};s.docs.forEach(d=>privs[+d.id]=d.data());rebuild();refresh()},console.error),
 onSnapshot(collection(db,'inbox'),s=>{S.inbox=s.docs.map(d=>({...d.data(),id:+d.id})).sort((a,b)=>b.id-a.id);refresh()},console.error)]};
onAuthStateChanged(auth,u=>{if(u&&!ADMIN_EMAILS.includes(u.email)){signOut(auth);toast('관리자 계정이 아니에요');return}
 admin=!!u;admin?startAdmin():stopAdmin();if(!admin)formM=formQ=null;render()});
const P={cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>',tel:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',ppl:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-5 13-5 14 0M16 5a3.5 3.5 0 0 1 0 7M18 15c3 .5 4 2.5 4 5"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const man=(h,back)=>`<path d="M8 84c0-22 14-34 32-34s32 12 32 34z" fill="#4a4560"/><rect x="33" y="46" width="14" height="10" fill="#4a4560"/>`+(back?`<circle cx="40" cy="36" r="15" fill="${h}"/>`:`<circle cx="40" cy="36" r="14" fill="#4a4560"/><path d="M25 35a15 15 0 0 1 30 0c-8-5-22-5-30 0z" fill="${h}"/>`);
const av=(h,bg)=>`<svg viewBox="0 0 80 80" aria-hidden="true"><rect width="80" height="80" fill="${bg}"/>${man(h)}</svg>`;
const pp=(x,y,h,b)=>`<g transform="translate(${x} ${y}) scale(.9)">${man(h,b)}</g>`;
const bub=(x,t)=>`<ellipse cx="${x}" cy="24" rx="20" ry="14" fill="#fff" stroke="#cfc4e6"/><text x="${x}" y="31" text-anchor="middle" font-size="18" font-weight="900" fill="#6f55a8">${t}</text>`;
const tableSvg=()=>`<svg viewBox="0 0 300 220" style="width:100%;display:block" aria-hidden="true"><ellipse cx="150" cy="115" rx="140" ry="100" fill="var(--lil)" opacity=".6"/>${pp(28,16,'#3a9a74')}${pp(114,6,'#4a5ec4')}${pp(200,16,'#e08b3c')}<ellipse cx="150" cy="128" rx="112" ry="46" fill="#fff" stroke="#cfc4e6" stroke-width="2"/>${pp(52,118,'#cc4552',1)}${pp(176,118,'#e0a43c',1)}${bub(22,'?')}${bub(270,'!')}</svg>`;
const fmt=m=>{const d=new Date(m.date),t=x=>new Date('2000-01-01T'+x).toLocaleTimeString('ko-KR',{hour:'numeric',minute:'2-digit'});
return d.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})+' '+d.toLocaleTimeString('ko-KR',{hour:'numeric',minute:'2-digit'})+(m.end?' ~ '+t(m.end):'')};
const toast=t=>{const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2400)};

const steps=[['일주일 전, 배역 결정','신청한 분들께 배역이 배정돼요. 누가 누구인지는 당일까지 비밀이에요. 내 인물의 사연과 비밀, 목표를 읽어 와요. 성격이나 말투를 만들어도 괜찮아요.','story'],
['조사와 토론','단서를 모으고 서로 질문해요. 누가 거짓말을 하고 있을까요?','giron'],
['투표와 멀티 엔딩','범인을 지목해 투표해요. 선택에 따라 결말이 달라져요.','tohyo'],
['감상 공유','역할을 벗고 비하인드를 나눠요. 이때부터 진짜 대화가 시작돼요.','kanso']];
const pages={
home:()=>`<section class="hero"><div>
<span class="pill">사사사모 / CASE 1031</span>
<h1><span>&lt;</span>머더 미스터리 모임<span>&gt;</span></h1>
<p>혼자 머무는 익숙함에서 벗어나, 보드게임 역할극과 몰입의 즐거움을 함께 나눌 온기 있는 사람들을 만나보세요.</p>
<p class="st-line ${S.meetups.length?'':'off'}">${S.meetups.length?'지금 신청을 받고 있어요':'지금은 신청을 받고 있지 않아요'}</p>
<div class="cta"><a class="btn" href="#/apply">모임 신청하기</a><a class="btn ghost" href="#/intro">머더 미스터리가 뭐예요?</a></div></div>
<div class="win" aria-hidden="true"><div class="wb"><i></i><i></i><i></i><span>CASE / 10.31</span></div><div class="wc"><p class="sv">사건을 해결하는 중<span class="cur">_</span></p>${tableSvg()}</div><span class="stk">10.31</span></div></section>
<div class="facts"><div class="fact"><small>언제</small><div>2026년 10월 31일 토요일</div><span>오후 1시 ~ 5시</span></div>
<div class="fact"><small>누가</small><div>07또래 ~ 86또래</div><span>1986~2007년생 사랑하는교회 청년</span></div>
<div class="fact"><small>어디서</small><div>잠실 파티룸 다즐플레이스</div><span>서울 송파구 잠실</span></div></div>
<h2>이런 하루가 될 거예요</h2>
<div class="board"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="var(--rose)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity=".8"><polyline vector-effect="non-scaling-stroke" points="18,8 47,9 68,17 87,9"/><polyline vector-effect="non-scaling-stroke" points="18,8 18,61 50,63 82,61 68,17"/><polyline vector-effect="non-scaling-stroke" points="47,9 50,63"/></g></svg>
<div class="it np"><div><h4><span>사사 일보</span><span>10.31</span></h4><h3>청년부 의문의 모임…<br>범인은 누구?</h3><div class="ph">${av('#e08b3c','#cfc8dc')}</div><div class="tx"></div></div></div>
<div class="it po p1">${av('#4a5ec4','#e9efd3')}용의자 A</div>
<div class="it po p2">${av('#3a9a74','#e8dff7')}용의자 B</div>
<div class="it ev"><b>증거 #03</b>범인은 라벤더 향이 난다.</div>
<div class="it me m1"><b>같은 이야기 속으로</b><span class="why-c">한 사건을 함께 겪으면, 대화가 저절로 시작돼요.</span></div>
<div class="it me m2"><b>역할 뒤에서 솔직하게</b><span class="why-c">연기하다 보면 평소 몰랐던 모습이 보여요.</span></div>
<div class="it me m3"><b>끝나고 더 가까워져요</b><span class="why-c">감상을 나누며 다음 만남의 이야깃거리가 생겨요.</span></div></div>`,

intro:()=>`<h2>머더 미스터리란?</h2>
<p class="lead" style="font-size:18px;max-width:38em">참가자 모두가 사건 속 인물이 되는 추리 게임이에요. 마피아 게임처럼 숨기고 의심하지만, 인물마다 <b>각자의 스토리, 역할, 목표</b>가 있다는 점이 달라요. 범인은 정체를 숨기고, 탐정은 진실을 쫓고, 누군가는 지켜야 할 비밀이 있어요.</p>
<h2>이렇게 진행돼요</h2><div>${steps.map((s,i)=>`<div class="st"><div class="im ${s[2]==='crop'?'crop':''}"><img src="${IMG[s[2]==='crop'?'story':s[2]]}" alt="${s[0]} 삽화"></div><div><h3><em>${i+1}</em>${s[0]}</h3><p>${s[1]}</p></div></div>`).join('')}</div>
<h2>이런 분께 추천해요</h2><div class="grid2">
<div class="box"><h3>추리 게임을 좋아하는 분</h3><p>단서를 모아 논리로 범인을 좁혀가는 맛이 있어요.</p></div>
<div class="box"><h3>크라임씬 같은 예능을 좋아하는 분</h3><p>보기만 하던 그 장면을 직접 해볼 수 있어요.</p></div>
<div class="box"><h3>배역에 과몰입을 잘하는 분</h3><p>마음껏 몰입할수록 모두가 즐거워져요.</p></div>
<div class="box"><h3>사건 속 인물이 되고 싶은 분</h3><p>하루 동안 전혀 다른 사람이 되어 보세요.</p></div></div>
<h2>플레이 · 참고 영상</h2><div class="grid2">
<a class="box vid" href="https://youtu.be/aShacqP9F2c?si=tvBS4UK5UlFsNkZZ&t=937" target="_blank" rel="noopener"><i>▶</i><span><b>플레이 영상</b><br>실제 진행 장면</span></a>
<a class="box vid" href="https://youtu.be/Katn_YDQbsU?si=l2Uh1SDiCYdjGZXq" target="_blank" rel="noopener"><i>▶</i><span><b>참고 영상</b><br>머더 미스터리 이해하기</span></a></div>`,

apply:()=>`<h2>모임 신청</h2><p style="font-size:18px">모임을 눌러 자세한 내용을 보고 신청해요. 입금이 확인되면 확정 명단으로 옮겨져요.</p>
${admin?`<p><button class="btn" data-a="newM">+ 모임 열기</button></p>`:''}${formM?meetForm():''}
${S.meetups.length?S.meetups.map(card).join(''):'<p class="empty">아직 열린 모임이 없어요. 곧 올라올 예정이에요.</p>'}`,

qna:()=>`<h2>자주 묻는 질문</h2>${admin?`<p><button class="btn" data-a="newQ">+ 질문 추가</button></p>`:''}${formQ?qForm():''}
${S.qna.map(q=>`<details class="q" data-id="${q.id}" ${openQ.has(q.id)?'open':''}><summary>${esc(q.q)}</summary><div class="a">${esc(q.a)}</div>${admin?`<div class="ctl"><button class="btn ghost sm" data-a="editQ" data-id="${q.id}">수정</button>${del('q'+q.id,'delQ',q.id)}</div>`:''}</details>`).join('')||'<p class="empty">등록된 질문이 없어요.</p>'}
<h2>더 궁금한 점이 있나요?</h2><form class="f box" data-f="ask"><label class="w">궁금한 점<textarea name="text" rows="3" required placeholder="자유롭게 적어주세요"></textarea></label>
<label>이름 또는 연락처 (선택)<input name="who" placeholder="답변을 받고 싶을 때만 적어주세요"></label><div style="align-self:end"><button class="btn">질문 보내기</button></div></form>
${admin?`<h2>접수된 질문 (${S.inbox.length})</h2>${S.inbox.map(x=>`<div class="box" style="margin-bottom:10px"><p style="white-space:pre-wrap;color:var(--ink)">${esc(x.text)}</p><p style="font-size:13px;margin-top:6px">${esc(x.who||'익명')} · ${esc(x.t)}</p><div class="ctl" style="padding:8px 0 0"><button class="btn ghost sm" data-a="toQ" data-id="${x.id}">QnA로 만들기</button>${del('i'+x.id,'delI',x.id)}</div></div>`).join('')||'<p class="empty">아직 접수된 질문이 없어요.</p>'}`:''}`};

const del=(k,a,id)=>`<button class="btn ghost sm" data-a="${a}" data-id="${id}" data-k="${k}">${armed===k?'정말 삭제할까요?':'삭제'}</button>`;
function meetForm(){const m=formM.id?S.meetups.find(x=>x.id===formM.id):{};return `<form class="f box" data-f="meet" data-id="${m.id||''}">
<label class="w">글 제목<input name="title" required value="${esc(m.title)}"></label>
<label>모집 인원(최대)<input name="max" type="number" min="1" required value="${m.max||''}"></label>
<label>장소<input name="place" required value="${esc(m.place)}"></label>
<label>시작 일시<input name="date" type="datetime-local" required value="${m.date||''}"></label>
<label>종료 시간<input name="end" type="time" value="${m.end||''}"></label>
<label>모임장 이름<input name="host" required value="${esc(m.host)}"></label>
<label>모임장 연락처<input name="tel" required value="${esc(m.tel)}"></label>
<label class="w">설명 글(게임 테마, 간단한 규칙)<textarea name="desc" rows="5" required>${esc(m.desc)}</textarea></label>
<label class="w">사진 (선택, 여러 장 가능)<input type="file" name="photos" accept="image/*" multiple></label><div class="w" id="prev">${thumbs()}</div>
<div class="w"><button class="btn">${m.id?'수정 저장':'모임 열기'}</button> <button type="button" class="btn ghost" data-a="cancel">취소</button></div></form>`}
function qForm(){const q=formQ.id?S.qna.find(x=>x.id===formQ.id):{q:formQ.pre};return `<form class="f box" data-f="qna" data-id="${q.id||''}">
<label class="w">질문<input name="q" required value="${esc(q.q)}"></label><label class="w">답변<textarea name="a" rows="3" required>${esc(q.a)}</textarea></label>
<div class="w"><button class="btn">저장</button> <button type="button" class="btn ghost" data-a="cancel">취소</button></div></form>`}
function li(m,p){return `<li><b>${esc(p.name)}</b><span class="chip g">${esc(p.c)}또래</span>${admin?`<span class="sp">${p.s==='wait'?`<button class="btn sm" data-a="ok" data-m="${m.id}" data-id="${p.n}" ${m.people.filter(x=>x.s==='ok').length>=m.max?'disabled':''}>확정</button>`:`<button class="btn ghost sm" data-a="back" data-m="${m.id}" data-id="${p.n}">대기로</button>`}${del('p'+p.n,'rm',p.n).replace('data-id','data-m="'+m.id+'" data-id')}</span><small>${esc(p.tel)} · ${esc(p.bank)}</small>`:''}</li>`}
function card(m){const ok=m.people.filter(p=>p.s==='ok').sort((a,b)=>a.n-b.n),w=m.people.filter(p=>p.s==='wait').sort((a,b)=>a.n-b.n),o=openId===m.id,full=ok.length>=m.max;
return `<article class="card"><button class="head" data-a="tog" data-id="${m.id}" aria-expanded="${o}"><h3>${esc(m.title)}</h3>
<div class="meta"><span class="mi">${ic('cal')}${fmt(m)}</span><span class="mi">${ic('pin')}${esc(m.place)}</span><span class="mi">${ic('user')}모임장 ${esc(m.host)}</span><span class="mi">${ic('tel')}${esc(m.tel)}</span></div>
<div class="chips"><span class="chip ${full?'full':''}">${full?'확정 마감':'확정 '+ok.length+' / '+m.max}</span><span class="chip g">대기 ${w.length}명</span></div></button>
${o?`<div class="body">${(m.imgs||[]).length?`<div class="gal">${m.imgs.map(s=>`<img src="${s}" alt="모임 사진">`).join('')}</div>`:''}<p>${esc(m.desc)}</p>
${admin?`<p><button class="btn ghost sm" data-a="editM" data-id="${m.id}">수정</button> ${del('m'+m.id,'delM',m.id)}</p>`:''}
<h3>신청하기</h3><form class="f" data-f="apply" data-id="${m.id}">
<label>이름<input name="name" required></label><label>또래<select name="c" required><option value="">선택</option>${COH.map(c=>`<option>${c}</option>`).join('')}</select></label>
<label>연락처<input name="tel" type="tel" placeholder="010-0000-0000" required></label><label>은행 · 계좌번호 (환불용)<input name="bank" placeholder="예) 국민 123-456-7890" required></label>
<div class="w"><button class="btn">${full?'대기 명단에 신청':'신청하기'}</button> <small style="color:var(--mut)">연락처로 입금 안내를 보내드려요. 입금 확인 후 확정돼요.</small></div></form>
<div class="lists"><div><h3>대기 인원 (${w.length})</h3><ol>${w.map(p=>li(m,p)).join('')||'<li class="empty">아직 없어요</li>'}</ol></div>
<div><h3>확정 인원 (${ok.length}/${m.max})</h3><ol>${ok.map(p=>li(m,p)).join('')||'<li class="empty">아직 없어요</li>'}</ol></div></div></div>`:''}</article>`}

function render(){
 if(!ready){$('#app').innerHTML='<p class="empty">불러오는 중…</p>';return}
 const r=(location.hash||'#/').slice(2)||'home',k=pages[r]?r:'home';
 openQ=lastK===k?new Set([...document.querySelectorAll('details.q[open]')].map(d=>+d.dataset.id)):new Set();
 $('#app').innerHTML=pages[k]();lastK=k;
 $('#nav').innerHTML=[['intro','머더 미스터리란?'],['apply','신청'],['qna','QnA']].map(x=>`<a href="#/${x[0]}" class="${k===x[0]?'on':''}">${x[1]}</a>`).join('');
 $('#adm').innerHTML=admin?'<div class="admin-bar">관리자 모드 · 글 관리와 신청자 정보 확인이 가능해요</div>':'';
 $('#admbtn').textContent=admin?'관리자 해제':'관리자';
}
window.addEventListener('hashchange',()=>{openId=formM=formQ=armed=null;render();scrollTo(0,0)});
const D=(c,id)=>doc(db,c,String(id));
const fail=e=>{console.error(e);toast('저장하지 못했어요. 권한이나 네트워크를 확인해 주세요')};
const A={
 tog:d=>{openId=openId==+d.id?null:+d.id},newM:()=>{formM={imgs:[]}},newQ:()=>{formQ={}},cancel:()=>{formM=formQ=null},
 editM:d=>{formM={id:+d.id,imgs:[...(S.meetups.find(m=>m.id==d.id).imgs||[])]}},editQ:d=>{formQ={id:+d.id}},
 toQ:d=>{formQ={pre:S.inbox.find(x=>x.id==d.id).text};scrollTo(0,0)},
 delM:async d=>{if(armed!==d.k){armed=d.k;return}armed=null;openId=null;try{const b=writeBatch(db);ents.filter(e=>e.mid===String(d.id)).forEach(e=>{b.delete(D('entries',e.n));b.delete(D('entryPrivate',e.n))});b.delete(D('meetups',d.id));await b.commit();toast('삭제했어요')}catch(e){fail(e)}},
 delQ:d=>{if(armed!==d.k){armed=d.k;return}armed=null;deleteDoc(D('qna',d.id)).then(()=>toast('삭제했어요')).catch(fail)},
 delI:d=>{if(armed!==d.k){armed=d.k;return}armed=null;deleteDoc(D('inbox',d.id)).then(()=>toast('삭제했어요')).catch(fail)},
 ok:d=>{const m=S.meetups.find(x=>x.id==d.m);if(m.people.filter(p=>p.s==='ok').length>=m.max)return;updateDoc(D('entries',d.id),{s:'ok'}).then(()=>toast('확정 명단으로 옮겼어요')).catch(fail)},
 back:d=>{updateDoc(D('entries',d.id),{s:'wait'}).catch(fail)},
 rm:d=>{if(armed!==d.k){armed=d.k;return}armed=null;const b=writeBatch(db);b.delete(D('entries',d.id));b.delete(D('entryPrivate',d.id));b.commit().catch(fail)},
 adm:()=>{if(admin)signOut(auth).then(()=>toast('관리자 모드를 해제했어요'));else signInWithPopup(auth,new GoogleAuthProvider()).catch(e=>{if(e.code!=='auth/popup-closed-by-user')fail(e)})},
 rmImg:d=>{formM.imgs.splice(+d.i,1);prev();return false}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;if(!/^(delM|delQ|delI|rm)$/.test(t.dataset.a))armed=null;if(A[t.dataset.a](t.dataset)!==false)render()});
document.addEventListener('submit',async e=>{const f=e.target.closest('[data-f]');if(!f)return;e.preventDefault();const d=Object.fromEntries(new FormData(f)),id=+f.dataset.id,T=f.dataset.f;
 try{
 if(T==='meet'){const imgs=formM.imgs||[];if(JSON.stringify(imgs).length>850000){toast('사진 용량이 너무 커요. 사진 수를 줄여주세요');return}
  delete d.photos;d.max=+d.max;d.imgs=imgs;await setDoc(D('meetups',id||Date.now()),d,{merge:true});formM=null;toast('저장했어요')}
 if(T==='qna'){await setDoc(D('qna',id||Date.now()),{q:d.q,a:d.a},{merge:true});formQ=null;toast('저장했어요')}
 if(T==='apply'){const n=Date.now(),mid=String(id),b=writeBatch(db);b.set(D('entries',n),{mid,name:d.name.trim(),c:d.c,s:'wait',n});b.set(D('entryPrivate',n),{mid,tel:d.tel.trim(),bank:d.bank.trim()});await b.commit();toast('대기 명단에 추가했어요. 입금 안내를 기다려주세요')}
 if(T==='ask'){await setDoc(D('inbox',Date.now()),{text:d.text,who:d.who||'',t:new Date().toLocaleDateString('ko-KR')});toast('질문이 전달됐어요')}
 }catch(err){fail(err);return}
 render()});
function thumbs(){return (formM&&formM.imgs||[]).map((s,i)=>`<span class="th"><img src="${s}" alt=""><button type="button" class="btn sm" data-a="rmImg" data-i="${i}" aria-label="사진 삭제">×</button></span>`).join('')}
function prev(){const e=$('#prev');if(e)e.innerHTML=thumbs()}
const rs=f=>new Promise(ok=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.72))};im.onerror=()=>ok(null);im.src=r.result};r.onerror=()=>ok(null);r.readAsDataURL(f)});
document.addEventListener('change',async e=>{if(e.target.name!=='photos'||!formM)return;for(const f of e.target.files){const s=await rs(f);if(s)formM.imgs.push(s)}e.target.value='';prev()});
render();
