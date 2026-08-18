// Goal mapping and reporting helpers.
(function(){
'use strict';
const TF=window.TaskFlowGoalsReports=window.TaskFlowGoalsReports||{};
TF.formatDuration=function(totalSeconds){
 totalSeconds=Math.max(0,Math.floor(Number(totalSeconds)||0));
 const h=String(Math.floor(totalSeconds/3600)).padStart(2,'0');
 const m=String(Math.floor((totalSeconds%3600)/60)).padStart(2,'0');
 const s=String(totalSeconds%60).padStart(2,'0');
 return `${h}:${m}:${s}`;
};
TF.goalMapping={
 metricLabel:{tasks:'Completed tasks',hours:'Completed hours',projects:'Projects worked'},
 metricUnit:{tasks:'tasks',hours:'hours',projects:'projects'},
 canMap(metric,item){return metric==='tasks'?!!item?.task_id:metric==='projects'?!!item?.project_id:!!item?.time_entry_id;},
 value(goal,items){
  if(goal.metric==='tasks') return items.filter(x=>x.task_id).length;
  if(goal.metric==='projects') return new Set(items.filter(x=>x.project_id).map(x=>x.project_id)).size;
  return items.filter(x=>x.time_entry_id).reduce((n,x)=>n+(Number(x.duration_seconds)||0),0)/3600;
 }
};
TF.periodBounds=TF.periodBounds||function(period,offset=0){
 const now=new Date();
 if(period==='weekly'){const s=new Date(now);s.setHours(0,0,0,0);s.setDate(s.getDate()-(s.getDay()||7)+1+offset*7);const e=new Date(s);e.setDate(e.getDate()+7);return{start:s,end:e};}
 if(period==='monthly'){const s=new Date(now.getFullYear(),now.getMonth()+offset,1);return{start:s,end:new Date(s.getFullYear(),s.getMonth()+1,1)};}
 const s=new Date(now.getFullYear()+offset,0,1);return{start:s,end:new Date(s.getFullYear()+1,0,1)};
};
TF.inPeriod=TF.inPeriod||function(value,b){const d=new Date(value);return d>=b.start&&d<b.end;};
TF.report=TF.report||function(tasks,timeEntries,projects,period,offset=0){
 const b=TF.periodBounds(period,offset),entries=timeEntries.filter(e=>TF.inPeriod(e.started_at,b));
 const workedTaskIds=new Set(entries.map(e=>e.task_id));
 const byProject={};entries.forEach(e=>{const t=tasks.find(x=>x.id===e.task_id),p=projects.find(x=>x.id===t?.project_id),k=p?.name||'No project';byProject[k]=(byProject[k]||0)+(e.duration_seconds||0);});
 return{bounds:b,tasksWorked:tasks.filter(t=>workedTaskIds.has(t.id)).length,tasksCompleted:tasks.filter(t=>t.status==='done'&&TF.inPeriod(t.updated_at,b)).length,timeSeconds:entries.reduce((n,e)=>n+(e.duration_seconds||0),0),projectsWorked:Object.keys(byProject).length,byProject};
};
TF.goalProgressFromMappings=function(goal,mappings){
 const selected=mappings.filter(x=>x.goal_id===goal.id);
 const value=TF.goalMapping.value(goal,selected);
 return {value,target:Number(goal.target_value)||0,percent:Math.min(100,Math.round(value/(Number(goal.target_value)||1)*100)),items:selected};
};
TF.mappingPayload=function(userId,goalId,metric,selectedItems){
 return selectedItems.map(item=>({user_id:userId,goal_id:goalId,task_id:metric==='tasks'?item.id:null,project_id:metric==='projects'?item.id:null,time_entry_id:metric==='hours'?item.id:null}));
};
})();