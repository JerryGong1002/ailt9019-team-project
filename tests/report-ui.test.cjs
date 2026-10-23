const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function ui(fetchImpl) {
  const nodes=Object.fromEntries(['generate-report','weekly-report','report-status'].map(id=>[id,{textContent:'',value:'',disabled:false,addEventListener(name,fn){this[name]=fn;}}]));
  const context=vm.createContext({document:{getElementById:id=>nodes[id]},location:{protocol:'http:'},fetch:fetchImpl,AbortController,setTimeout,clearTimeout});
  vm.runInContext(fs.readFileSync('dist/report-ui.js','utf8')+'\nglobalThis.ui=WeeklyReportUI;',context);
  return {nodes,update:context.ui.update,click:()=>nodes['generate-report'].click()};
}
test('empty report stays local and output clears when ledger changes',async()=>{
  let calls=0;
  const u=ui(()=>{calls++;});
  u.update({current:{count:0}},'personal');
  await u.click();
  assert.match(u.nodes['weekly-report'].textContent,/No expenses/);
  assert.equal(calls,0);
  u.update({current:{count:0}},'demo');
  assert.equal(u.nodes['weekly-report'].textContent,'');
});
test('generation sends summary without an access code; result is plain text',async()=>{
  const summary={current:{count:1}};
  const u=ui(async(url,options)=>{
    assert.equal(url,'/api/weekly-report');
    assert.equal(options.headers.authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),summary);
    return {ok:true,json:async()=>({report:'Recorded spending report.'})};
  });
  u.update(summary,'demo');
  await u.click();
  assert.equal(u.nodes['weekly-report'].textContent,'Recorded spending report.');
  assert.equal(u.nodes['generate-report'].disabled,false);
});
test('late response from previous ledger cannot display or re-enable an active request',async()=>{
  let resolve;
  const u=ui(()=>new Promise(r=>{resolve=r;}));
  u.update({current:{count:1}},'demo');
  const pending=u.click();
  u.update({current:{count:2}},'personal');
  resolve({ok:true,json:async()=>({report:'Stale report'})});await pending;
  assert.equal(u.nodes['weekly-report'].textContent,'');
  assert.match(u.nodes['report-status'].textContent,/Ready/);
});
test('configuration errors are visible and allow retry',async()=>{
  const u=ui(async()=>({ok:false,json:async()=>({error:'Not configured'})}));
  u.update({current:{count:1}},'demo');await u.click();
  assert.equal(u.nodes['report-status'].textContent,'Not configured');
  assert.equal(u.nodes['generate-report'].disabled,false);
});
