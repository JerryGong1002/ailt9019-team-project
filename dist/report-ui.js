'use strict';
const WeeklyReportUI = (() => {
  const button=document.getElementById('generate-report');
  const output=document.getElementById('weekly-report');
  const status=document.getElementById('report-status');
  let snapshot='', summary=null, controller=null, version=0;
  function update(next,mode) {
    const fingerprint=JSON.stringify([mode,next]);
    if(fingerprint===snapshot) return;
    snapshot=fingerprint; summary=next; version++;
    controller?.abort(); controller=null;
    button.disabled=!next; button.textContent='Generate weekly report';
    output.textContent='';
    status.textContent=next?'Ready. Only summary statistics are sent when you generate a report.':'A report is unavailable for these dates.';
  }
  button.addEventListener('click',async()=>{
    if(!summary || button.disabled) return;
    const current=version;
    output.textContent='';
    if(summary.current.count===0){output.textContent='No expenses were recorded for this seven-day period.';status.textContent='No API request was needed.';return;}
    if(location.protocol==='file:'){status.textContent='Start the Node server and open its URL to generate AI reports.';return;}
    const requestController=new AbortController();
    controller=requestController;
    const timer=setTimeout(()=>requestController.abort(),40000);
    button.disabled=true;button.textContent='Generating…';status.textContent='Generating your English weekly report…';
    try {
      const response=await fetch('/api/weekly-report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(summary),signal:requestController.signal});
      let result;
      try {result=await response.json();} catch {throw new Error('AI reporting requires the Node server. This static host does not provide the report API.');}
      if(!response.ok) throw new Error(result.error||'The weekly report could not be generated.');
      if(typeof result.report!=='string' || !result.report.trim()) throw new Error('The server returned an empty report.');
      if(current!==version) return;
      output.textContent=result.report;status.textContent='AI-generated report. Check the figures against your recorded summary.';
    } catch(error) {
      if(current===version) status.textContent=error.name==='AbortError'?'The request timed out. Please try again.':error.message==='Failed to fetch'?'Could not reach the report server. Please try again.':error.message;
    } finally {
      clearTimeout(timer);
      if(current===version){button.disabled=false;button.textContent='Generate weekly report';controller=null;}
    }
  });
  return {update};
})();
