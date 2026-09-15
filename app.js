const DATA_URL='https://raw.githubusercontent.com/masakasakasama/Daily_check/main/data/daily-checks.json';
const state={data:null,date:null};
const $=(id)=>document.getElementById(id);

function fmtDateTime(iso){
  if(!iso)return '未確認';
  return new Intl.DateTimeFormat('ja-JP',{
    timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',
    hour:'2-digit',minute:'2-digit'
  }).format(new Date(iso));
}

function fmtTime(iso){
  if(!iso)return '未確認';
  return new Intl.DateTimeFormat('ja-JP',{
    timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'
  }).format(new Date(iso));
}

function fmtDateLabel(date){
  const d=new Date(date+'T00:00:00+09:00');
  $('dayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{
    timeZone:'Asia/Tokyo',month:'long',day:'numeric'
  }).format(d);
  $('weekdayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{
    timeZone:'Asia/Tokyo',year:'numeric',weekday:'long'
  }).format(d);
}

function getDays(){
  return [...(state.data?.days||[])].sort((a,b)=>a.date.localeCompare(b.date));
}

function getDay(){
  return (state.data?.days||[]).find(x=>x.date===state.date)||{
    date:state.date,alerts:[],references:[],checks:[]
  };
}

function syncUrl(){
  const u=new URL(location.href);
  u.searchParams.set('date',state.date);
  history.replaceState(null,'',u);
}

function updateDateNav(){
  const days=getDays();
  const i=days.findIndex(x=>x.date===state.date);
  $('prevDay').disabled=i<=0;
  $('nextDay').disabled=i<0||i>=days.length-1;
}

function makeNewsCard(item,type){
  const node=$('newsTemplate').content.firstElementChild.cloneNode(true);
  node.classList.add(type);
  node.querySelector('.category-chip').textContent=item.category||'OTHER';
  node.querySelector('.score-chip').textContent=item.score!=null?item.score+'点':'参考';
  node.querySelector('.news-title').textContent=item.title||'無題';
  node.querySelector('.news-summary').textContent=item.summary||'';

  const meta=node.querySelector('.news-meta');
  if(item.publishedAt){
    const s=document.createElement('span');
    s.textContent=item.publishedAt;
    meta.appendChild(s);
  }

  const a=node.querySelector('.news-source');
  if(item.source?.url){
    a.href=item.source.url;
    a.textContent=item.source.label||'出典';
  }else{
    a.hidden=true;
  }
  return node;
}

function makeMonitorRow(item){
  const node=$('monitorTemplate').content.firstElementChild.cloneNode(true);
  node.classList.add(item.status||'pending');
  node.querySelector('.monitor-name').textContent=item.name;
  node.querySelector('.monitor-text').textContent=item.summary||'';
  const counts=node.querySelector('.monitor-counts');

  if(item.alertCount){
    const a=document.createElement('span');
    a.className='count important-count';
    a.textContent='重要 '+item.alertCount;
    counts.appendChild(a);
  }
  if(item.referenceCount){
    const r=document.createElement('span');
    r.className='count reference-count';
    r.textContent='参考 '+item.referenceCount;
    counts.appendChild(r);
  }
  if(!item.alertCount&&!item.referenceCount){
    const z=document.createElement('span');
    z.className='count';
    z.textContent='0';
    counts.appendChild(z);
  }
  return node;
}

function render(){
  const day=getDay();
  fmtDateLabel(state.date);
  updateDateNav();
  syncUrl();

  $('updatedAt').textContent='更新 '+fmtDateTime(state.data.updatedAt);

  const alerts=day.alerts||[];
  const references=day.references||[];
  const checks=day.checks||[];
  const checked=checks.filter(x=>x.status!=='pending');
  const latestCheck=checked
    .map(x=>x.checkedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  $('alertCount').textContent=alerts.length;
  $('referenceCount').textContent=references.length;
  $('checkedCount').textContent=checked.length+'/'+checks.length;
  $('monitorSummary').textContent=checked.length+'/'+checks.length+(latestCheck?' · '+fmtTime(latestCheck):'');

  $('alertList').replaceChildren(...alerts.map(x=>makeNewsCard(x,'important')));
  $('referenceList').replaceChildren(...references.map(x=>makeNewsCard(x,'reference')));
  $('monitorList').replaceChildren(...checks.map(makeMonitorRow));

  $('emptyAlerts').hidden=alerts.length>0;
  $('emptyReferences').hidden=references.length>0;
}

function moveRecordedDay(delta){
  const days=getDays();
  const i=days.findIndex(x=>x.date===state.date);
  const next=days[i+delta];
  if(!next)return;
  state.date=next.date;
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function load(){
  try{
    $('errorMessage').hidden=true;
    const r=await fetch(DATA_URL+'?v='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    state.data=await r.json();

    const requested=new URLSearchParams(location.search).get('date');
    const dates=(state.data.days||[]).map(x=>x.date);
    state.date=dates.includes(requested)
      ? requested
      : state.data.currentDate||state.data.days?.[0]?.date;

    render();
  }catch(e){
    $('errorMessage').textContent='データを読み込めません: '+e.message;
    $('errorMessage').hidden=false;
  }
}

$('refreshButton').addEventListener('click',load);
$('prevDay').addEventListener('click',()=>moveRecordedDay(-1));
$('nextDay').addEventListener('click',()=>moveRecordedDay(1));
load();
