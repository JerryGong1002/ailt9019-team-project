const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSummary, modelSummary, validateSummary } = require('../dist/report-data.js');
const { createServer } = require('../server/server.cjs');
const fixture = () => buildSummary([
  {date:'2026-10-23', cents:2000, category:'food', note:'PRIVATE', id:'secret'},
  {date:'2026-10-17', cents:1000, category:'food'},
  {date:'2026-10-16', cents:1000, category:'food'},
  {date:'2026-10-24', cents:9999, category:'food'}
], '2026-10-23');
test('summary uses adjacent inclusive weeks and never includes private fields', () => {
  const s = fixture();
  assert.equal(s.current.start, '2026-10-17');
  assert.equal(s.previous.start, '2026-10-10');
  assert.equal(s.current.total, 3000);
  assert.equal(s.current.maximum, 2000);
  assert.equal(s.current.count, 2);
  assert.equal(s.previous.total, 1000);
  assert.equal(JSON.stringify(s).includes('PRIVATE'), false);
  assert.equal(JSON.stringify(s).includes('secret'), false);
  const m = modelSummary(s);
  assert.equal(m.change.amount, '20.00');
  assert.equal(m.change.percent, '200.0%');
  assert.equal(m.current.categories[0].share, '100.0%');
  assert.equal(modelSummary(buildSummary([], '2024-03-01')).change.percent, null);
});
test('rejects contradictory totals, dates, unknown fields and invalid amounts', () => {
  for (const mutate of [s=>s.current.total++, s=>s.current.start='2026-10-18', s=>s.note='inject', s=>s.current.count=-1, s=>s.current.maximum=999999, s=>s.current.categories[0].total=0]) {
    const s = fixture(); mutate(s); assert.throws(()=>validateSummary(s));
  }
});
async function usingServer(options, run) {
  const server = createServer(options);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve=>server.close(resolve)); }
}
const post = (base, summary) => fetch(base+'/api/weekly-report', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(summary)});
test('endpoint sends server prompt and aggregates, extracts text, and caps paid calls', async () => {
  let calls=0;
  await usingServer({apiKey:'test-secret', model:'test-model', maxCalls:1, fetchImpl:async(url,options)=>{
    calls++;
    const body=JSON.parse(options.body);
    assert.equal(body.store,false);
    assert.match(body.instructions,/Do not calculate new/);
    assert.match(body.instructions,/even when their amounts match/);
    assert.equal(body.model,'test-model');
    assert.equal(body.input.includes('PRIVATE'),false);
    return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Recorded food spending was HK$30.00. It increased by HK$20.00. The comparison covers the supplied periods.'}]}]})};
  }},async base=>{
    const r=await post(base,fixture()); assert.equal(r.status,200);
    assert.match((await r.json()).report,/HK\$30/);
    assert.equal((await post(base,fixture())).status,429);
    assert.equal(calls,1);
    assert.equal((await fetch(base+'/.env')).status,404);
    assert.equal((await fetch(base+'/')).status,200);
  });
});
test('reports need no access code; empty week, malformed input and missing key have explicit states', async()=>{
  await usingServer({accessToken:'demo-code'},async base=>{
    assert.equal((await post(base,{bad:true})).status,400);
    const r=await post(base,buildSummary([],'2026-10-23'));
    assert.equal((await r.json()).report,'No expenses were recorded for this seven-day period.');
    assert.equal((await post(base,fixture())).status,503);
  });
});
test('provider failures and incomplete responses never expose upstream secrets',async()=>{
  for (const response of [{ok:false}, {ok:true,json:async()=>({status:'incomplete',output:[]})}]) {
    await usingServer({apiKey:'secret',model:'test',fetchImpl:async()=>response},async base=>{
      const r=await post(base,fixture()); assert.equal(r.status,502);
      assert.equal((await r.text()).includes('secret'),false);
    });
  }
});
test('Alibaba-compatible chat sends system prompt and accepts only completed text',async()=>{
  for(const finish_reason of ['stop','length']){
    await usingServer({apiKey:'fake-key',model:'course-flash-model',apiFormat:'chat',enableThinking:false,baseUrl:'https://example.invalid/compatible-mode/v1/',fetchImpl:async(url,options)=>{
      assert.equal(url,'https://example.invalid/compatible-mode/v1/chat/completions');
      const body=JSON.parse(options.body);
      assert.equal(body.max_tokens,2048);
      assert.equal(body.stream,false);
      assert.equal(body.enable_thinking,false);
      assert.match(body.messages[0].content,/Do not calculate new/);
      assert.equal(body.messages[0].role,'system');
      assert.equal(body.messages[1].role,'user');
      assert.equal(body.messages[1].content.includes('PRIVATE'),false);
      assert.equal(body.instructions,undefined);
      return {ok:true,json:async()=>({choices:[{finish_reason,message:{content:'Recorded spending summary.'}}]})};
    }},async base=>{
      const r=await post(base,fixture());assert.equal(r.status,finish_reason==='stop'?200:502);
    });
  }
});
test('only one upstream call is allowed at a time',async()=>{
  let release,started;
  const ready=new Promise(resolve=>{started=resolve;});
  await usingServer({apiKey:'fake',model:'test',fetchImpl:async()=>{
    started();await new Promise(resolve=>{release=resolve;});
    return {ok:false};
  }},async base=>{
    const first=post(base,fixture());await ready;
    try{assert.equal((await post(base,fixture())).status,429);}finally{release();await first;}
  });
});
