const DATA_URL='https://raw.githubusercontent.com/masakasakasama/Daily_check/main/data/daily-checks.json';
const state={data:null,date:null};
const $=(id)=>document.getElementById(id);

function fmtDate(iso){
  if(!iso)return '未確認';
  return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
}
function fmtDay(date){
  const d=new Date(date+'T00:00:00+09:00');
  $('dayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',timeZone:'Asia/Tokyo'}).format(d);
  $('weekdayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{weekday:'long',year:'numeric',timeZone:'Asia/Tokyo'}).format(d);
}
function label(status){return({update:'更新あり',clear:'変化なし',error:'エラー',pending:'待機中'})[status]||status}
function makeCard(item){
  const node=$('cardTemplate').content.firstElementChild.cloneNode(true);
  node.classList.add(item.status||'pending');
  node.querySelector('.card-title').textContent=item.name;
  node.querySelector('.status-chip').textContent=label(item.status||'pending');
  node.querySelector('.card-summary').textContent=item.summary||'まだ結果がありません';
  const ul=node.querySelector('.detail-list');
  (item.details||[]).forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.appendChild(li)});
  const sources=node.querySelector('.source-list');
  (item.sources||[]).forEach((s,i)=>{
    const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noreferrer';a.textContent=s.label||('出典 '+(i+1));sources.appendChild(a)
  });
  node.querySelector('.checked-at').textContent='確認 '+fmtDate(item.checkedAt);
  node.querySelector('.priority').textContent=item.priority?'Priority '+item.priority:'';
  return node;
}
function syncUrl(){
  const u=new URL(location.href);
  u.searchParams.set('date',state.date);
  history.replaceState(null,'',u);
}
function render(){
  const data=state.data;if(!data)return;
  const daily=(data.days||[]).find(x=>x.date===state.date)||{date:state.date,checks:[]};
  fmtDay(state.date);
  $('updatedAt').textContent='データ更新 '+fmtDate(data.updatedAt);
  const checks=daily.checks||[];
  const alerts=checks.filter(x=>x.status==='update');
  const clears=checks.filter(x=>x.status==='clear');
  const checked=checks.filter(x=>x.status!=='pending');
  $('alertCount').textContent=alerts.length;
  $('clearCount').textContent=clears.length;
  $('checkedCount').textContent=checked.length;
  $('priorityBadge').textContent=alerts.length+'件';
  const p=$('priorityList');p.replaceChildren(...alerts.map(makeCard));
  $('emptyPriority').hidden=alerts.length>0;
  const all=$('allList');all.replaceChildren(...[...checks].sort((a,b)=>(a.priority||99)-(b.priority||99)).map(makeCard));
  syncUrl();
}
function shiftDay(delta){
  const d=new Date(state.date+'T00:00:00+09:00');d.setDate(d.getDate()+delta);
  state.date=d.toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});render();
}
async function load(){
  try{
    $('errorMessage').hidden=true;
    const r=await fetch(DATA_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
    state.data=await r.json();
    const requested=new URLSearchParams(location.search).get('date');
    state.date=requested||state.data.currentDate||state.data.days?.[0]?.date||new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
    render();
  }catch(e){$('errorMessage').textContent='データを読み込めません: '+e.message;$('errorMessage').hidden=false}
}
$('refreshButton').addEventListener('click',load);
$('prevDay').addEventListener('click',()=>shiftDay(-1));
$('nextDay').addEventListener('click',()=>shiftDay(1));
load();
