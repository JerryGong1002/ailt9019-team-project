'use strict';
const WeeklyReportData = (() => {
  const ids = ['food','transport','shopping','living','fun','study','health','travel','social','family','pets','other'];
  function shift(date, days) {
    const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0,10);
  }
  function dateOK(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number(s.slice(0,4)) >= 1 && (()=>{try{return shift(s,0)===s;}catch{return false;}})();
  }
  function buildSummary(entries, today) {
    if (!dateOK(today)) throw new Error('Invalid report date');
    function period(end) {
      const start=shift(end,-6), rows=entries.filter(e=>e.date>=start && e.date<=end);
      return {start,end,count:rows.length,total:rows.reduce((n,e)=>n+e.cents,0), maximum:rows.reduce((n,e)=>Math.max(n,e.cents),0),
        categories:ids.map(category=>({category,total:rows.filter(e=>e.category===category).reduce((n,e)=>n+e.cents,0)})),
        daily:Array.from({length:7},(_,i)=>{const date=shift(start,i);return {date,total:rows.filter(e=>e.date===date).reduce((n,e)=>n+e.cents,0)};})};
    }
    return validateSummary({currency:'HKD',current:period(today),previous:period(shift(today,-7))});
  }
  function validateSummary(s) {
    const fail=()=>{throw new Error('Invalid or contradictory weekly summary');};
    const keys=(o,expected)=>o && typeof o==='object' && !Array.isArray(o) && Object.keys(o).sort().join(',')===expected.split(',').sort().join(',');
    const amount=n=>Number.isSafeInteger(n) && n>=0 && n<=999999999000;
    if (!keys(s,'currency,current,previous') || s.currency!=='HKD') fail();
    for (const p of [s.current,s.previous]) {
      if (!keys(p,'start,end,count,total,maximum,categories,daily') || !dateOK(p.start) || !dateOK(p.end) || shift(p.start,6)!==p.end || !Number.isSafeInteger(p.count) || p.count<0 || p.count>1000000 || !amount(p.total) || !amount(p.maximum)) fail();
      if ((p.count===0)!==(p.total===0) || (p.total===0 ? p.maximum!==0 : p.maximum<Math.ceil(p.total/p.count) || p.maximum>p.total || p.maximum>999999999 || p.total<p.maximum+p.count-1)) fail();
      if (!Array.isArray(p.categories) || p.categories.length!==ids.length || p.categories.some((c,i)=>!keys(c,'category,total') || c.category!==ids[i] || !amount(c.total)) || p.categories.reduce((n,c)=>n+c.total,0)!==p.total) fail();
      if (!Array.isArray(p.daily) || p.daily.length!==7 || p.daily.some((d,i)=>!keys(d,'date,total') || d.date!==shift(p.start,i) || !amount(d.total)) || p.daily.reduce((n,d)=>n+d.total,0)!==p.total) fail();
      if (p.maximum>Math.max(...p.daily.map(d=>d.total)) || p.maximum>Math.max(...p.categories.map(c=>c.total))) fail();
    }
    if (shift(s.previous.end,1)!==s.current.start) fail();
    return s;
  }
  function modelSummary(s) {
    validateSummary(s);
    const money=n=>(n/100).toFixed(2), percentage=(a,b)=>b===0?null:`${(a/b*100).toFixed(1)}%`;
    const change=(a,b)=>({amount:money(a-b),percent:percentage(a-b,b)});
    const period=p=>({...p,total:money(p.total),maximum:money(p.maximum),categories:p.categories.map(c=>({...c,total:money(c.total),share:percentage(c.total,p.total)})),daily:p.daily.map(d=>({...d,total:money(d.total)}))});
    return {currency:'HKD',comparisonAvailable:true,current:period(s.current),previous:period(s.previous),change:change(s.current.total,s.previous.total),categoryChanges:s.current.categories.map((c,i)=>({category:c.category,...change(c.total,s.previous.categories[i].total)}))};
  }
  return {buildSummary,validateSummary,modelSummary};
})();
if (typeof module!=='undefined') module.exports=WeeklyReportData;
