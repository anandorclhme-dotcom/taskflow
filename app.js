const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let db=JSON.parse(localStorage.getItem('taskflow')||'null')||{
 projects:[{id:'p1',name:'Personal'}],
 tasks:[],
 activeProject:null,
 timer:{taskId:null,start:null,elapsed:0}
};
function save(){localStorage.setItem('taskflow',JSON.stringify(db));render()}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function projectName(id){return db.projects.find(p=>p.id===id)?.name||'No project'}
function fmtMin(m){m=Math.floor(m||0);return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`}
function render(){
  const now=new Date(), d=today();
  const done=db.tasks.filter(t=>t.done).length;
  const overdue=db.tasks.filter(t=>!t.done&&t.due&&new Date(t.due)<now).length;
  const todayN=db.tasks.filter(t=>t.due&&t.due.slice(0,10)===d&&!t.done).length;
  const tracked=db.tasks.reduce((a,t)=>a+(t.elapsed||0),0)+(db.timer.taskId&&db.timer.start?(Date.now()-db.timer.start)/60000:0);
  $('todayCount').textContent=todayN;$('overdueCount').textContent=overdue;$('completedCount').textContent=done;$('trackedTime').textContent=fmtMin(tracked);

  $('projectList').innerHTML=db.projects.map(p=>`<div class="project ${db.activeProject===p.id?'active':''}" data-p="${p.id}"><b>${esc(p.name)}</b><div class="meta">${db.tasks.filter(t=>t.projectId===p.id&&t.done).length}/${db.tasks.filter(t=>t.projectId===p.id).length} completed</div></div>`).join('')||'<div class="empty">No projects</div>';
  document.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>{db.activeProject=db.activeProject===x.dataset.p?null:x.dataset.p;render()});

  const filter=$('filter').value;
  let tasks=db.tasks.filter(t=>!db.activeProject||t.projectId===db.activeProject);
  if(filter==='today')tasks=tasks.filter(t=>t.due&&t.due.slice(0,10)===d);
  if(filter==='open')tasks=tasks.filter(t=>!t.done);
  if(filter==='done')tasks=tasks.filter(t=>t.done);
  tasks.sort((a,b)=>(a.done-b.done)||(new Date(a.due||'2999')-new Date(b.due||'2999')));
  $('taskList').innerHTML=tasks.map(t=>`<div class="task ${t.done?'done':''}">
    <input type="checkbox" ${t.done?'checked':''} data-done="${t.id}">
    <div><div class="task-name">${esc(t.name)}</div><div class="meta">${esc(projectName(t.projectId))} · ${t.due?new Date(t.due).toLocaleString(): 'No due date'} · ${fmtMin(t.elapsed||0)}</div></div>
    <div><span class="priority">${t.priority}</span><br><button class="secondary" data-edit="${t.id}">Edit</button></div>
  </div>`).join('')||'<div class="empty">No tasks found.</div>';
  document.querySelectorAll('[data-done]').forEach(x=>x.onchange=()=>{let t=db.tasks.find(t=>t.id===x.dataset.done);t.done=x.checked;if(db.timer.taskId===t.id&&t.done)stopTimer();save()});
  document.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>openTask(x.dataset.edit));
  updateTimer();
}
function populateProjects(){ $('taskProject').innerHTML=db.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('') }
function openTask(id=null){
  populateProjects();$('taskId').value=id||'';
  let t=db.tasks.find(x=>x.id===id);
  $('taskTitle').textContent=id?'Edit Task':'New Task';
  $('taskName').value=t?.name||'';$('taskProject').value=t?.projectId||db.activeProject||db.projects[0]?.id;
  $('taskDue').value=t?.due||'';$('taskPriority').value=t?.priority||'Medium';$('taskEstimate').value=t?.estimate||30;
  $('taskDialog').showModal();
}
$('saveTask').onclick=e=>{e.preventDefault();const id=$('taskId').value;let t=id&&db.tasks.find(x=>x.id===id);if(!t){t={id:crypto.randomUUID(),elapsed:0,done:false};db.tasks.push(t)}
  Object.assign(t,{name:$('taskName').value,projectId:$('taskProject').value,due:$('taskDue').value,priority:$('taskPriority').value,estimate:+$('taskEstimate').value});
  $('taskDialog').close();save()
};
$('addTask').onclick=()=>openTask();$('filter').onchange=render;
$('addProject').onclick=()=>$('projectDialog').showModal();
$('projectForm').onsubmit=e=>{e.preventDefault();const name=$('projectName').value.trim();if(name){db.projects.push({id:crypto.randomUUID(),name});$('projectName').value='';$('projectDialog').close();save()}};

function updateTimer(){
  if(!db.timer.taskId){$('timerTask').textContent='Select a task to start tracking.';$('startStop').textContent='Start';$('timerDisplay').textContent='00:00:00';return}
  const t=db.tasks.find(x=>x.id===db.timer.taskId);$('timerTask').textContent=t?`Tracking: ${t.name}`:'No task';
  const sec=Math.floor((t?.elapsed||0)*60)+(db.timer.start?Math.floor((Date.now()-db.timer.start)/1000):0);
  $('timerDisplay').textContent=new Date(sec*1000).toISOString().slice(11,19);$('startStop').textContent=db.timer.start?'Stop':'Start';
}
$('startStop').onclick=()=>{
  if(!db.timer.taskId){const t=db.tasks.find(x=>!x.done);if(!t)return alert('Create or complete a task first.');db.timer.taskId=t.id}
  if(db.timer.start){const t=db.tasks.find(x=>x.id===db.timer.taskId);t.elapsed=(t.elapsed||0)+(Date.now()-db.timer.start)/60000;db.timer.start=null}
  else db.timer.start=Date.now();
  save()
};
function stopTimer(){if(db.timer.start){const t=db.tasks.find(x=>x.id===db.timer.taskId);if(t)t.elapsed=(t.elapsed||0)+(Date.now()-db.timer.start)/60000}db.timer={taskId:null,start:null,elapsed:0}}
setInterval(()=>{if(db.timer.start){updateTimer();const t=db.tasks.find(x=>x.id===db.timer.taskId);if(t){$('trackedTime').textContent=fmtMin(db.tasks.reduce((a,x)=>a+(x.elapsed||0),0)+(Date.now()-db.timer.start)/60000)}}},1000);
render();

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});
$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').classList.add('hidden')}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
