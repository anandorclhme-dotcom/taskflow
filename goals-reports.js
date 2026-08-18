// Goals and reports module
// Adds reusable helpers for weekly/monthly/yearly reporting and goals.
(function(){
  window.TaskFlowGoalsReports = {
    periodBounds(period, offset=0){
      const now=new Date();
      if(period==='weekly'){
        const s=new Date(now); s.setHours(0,0,0,0); s.setDate(s.getDate()-(s.getDay()||7)+1+offset*7);
        const e=new Date(s); e.setDate(e.getDate()+7); return {start:s,end:e};
      }
      if(period==='monthly'){
        const s=new Date(now.getFullYear(),now.getMonth()+offset,1); return {start:s,end:new Date(s.getFullYear(),s.getMonth()+1,1)};
      }
      const s=new Date(now.getFullYear()+offset,0,1); return {start:s,end:new Date(s.getFullYear()+1,0,1)};
    },
    inPeriod(value,b){const d=new Date(value);return d>=b.start&&d<b.end;},
    report(tasks,timeEntries,projects,period,offset=0){
      const b=this.periodBounds(period,offset);
      const entries=timeEntries.filter(e=>this.inPeriod(e.started_at,b));
      const workedTaskIds=new Set(entries.map(e=>e.task_id));
      const workedTasks=tasks.filter(t=>workedTaskIds.has(t.id));
      const completed=tasks.filter(t=>t.status==='done'&&this.inPeriod(t.updated_at,b));
      const seconds=entries.reduce((n,e)=>n+(e.duration_seconds||0),0);
      const byProject={}; entries.forEach(e=>{const t=tasks.find(x=>x.id===e.task_id);const p=projects.find(x=>x.id===t?.project_id);const k=p?.name||'No project';byProject[k]=(byProject[k]||0)+(e.duration_seconds||0);});
      return {bounds:b,tasksWorked:workedTasks.length,tasksCompleted:completed.length,timeSeconds:seconds,projectsWorked:Object.keys(byProject).length,byProject};
    }
  };
})();