const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSummary, modelSummary, validateSummary } = require('../dist/report-data.js');
const { WeeklyReportPrompt } = require('../dist/report-prompt.js');
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

test('Gemini uses the compatible endpoint and low reasoning without Alibaba parameters',async()=>{
  await usingServer({apiKey:'fake-gemini',model:'gemini-3.1-flash-lite',apiFormat:'chat',baseUrl:'https://generativelanguage.googleapis.com/v1beta/openai',reasoningEffort:'low',fetchImpl:async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    assert.equal(options.headers.authorization,'Bearer fake-gemini');
    const body=JSON.parse(options.body);
    assert.equal(body.model,'gemini-3.1-flash-lite');
    assert.equal(body.reasoning_effort,'low');
    assert.equal(body.enable_thinking,undefined);
    return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'Recorded spending was HK$30.00.'}}]})};
  }},async base=>{assert.equal((await post(base,fixture())).status,200);});
});
test('Pages CORS permits the exact origin, rejects others and preserves error headers',async()=>{
  const origin='https://jerrygong1002.github.io';
  await usingServer({allowedOrigins:[origin]},async base=>{
    const pre=await fetch(base+'/api/weekly-report',{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST','access-control-request-headers':'content-type'}});
    assert.equal(pre.status,204);
    assert.equal(pre.headers.get('access-control-allow-origin'),origin);
    const blocked=await fetch(base+'/api/weekly-report',{method:'OPTIONS',headers:{origin:origin+'.evil.example'}});
    assert.equal(blocked.status,403);
    assert.equal(blocked.headers.get('access-control-allow-origin'),null);
    const missing=await fetch(base+'/api/weekly-report',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(fixture())});
    assert.equal(missing.status,503);
    assert.equal(missing.headers.get('access-control-allow-origin'),origin);
    assert.equal((await fetch(base+'/healthz')).status,200);
  });
});

test('dist/report-prompt.js stays in exact LF parity with server/weekly-report-prompt.txt', () => {
  const filePrompt = fs.readFileSync(path.join(__dirname, '..', 'server', 'weekly-report-prompt.txt'), 'utf8').replace(/\r\n?/g, '\n');
  assert.equal(WeeklyReportPrompt, filePrompt);
  assert.equal(WeeklyReportPrompt.trim(), filePrompt.trim());
});

test('endpoint accepts { summary, prompt } overrides and falls back when prompt is omitted or blank', async () => {
  const defaultPrompt = fs.readFileSync(path.join(__dirname, '..', 'server', 'weekly-report-prompt.txt'), 'utf8').replace(/\r\n?/g, '\n');
  const seenPrompts = [];

  for (const apiFormat of ['responses', 'chat']) {
    seenPrompts.length = 0;
    await usingServer({
      apiKey: 'test-secret',
      model: 'test-model',
      apiFormat,
      fetchImpl: async (_url, options) => {
        const body = JSON.parse(options.body);
        seenPrompts.push(apiFormat === 'chat' ? body.messages[0].content : body.instructions);
        return {
          ok: true,
          json: async () => apiFormat === 'chat'
            ? { choices: [{ finish_reason: 'stop', message: { content: 'Recorded food spending was HK$30.00.' } }] }
            : { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Recorded food spending was HK$30.00.' }] }] }
        };
      }
    }, async base => {
      assert.equal((await post(base, { summary: fixture(), prompt: 'Custom global prompt.' })).status, 200);
      assert.equal((await post(base, { summary: fixture() })).status, 200);
      assert.equal((await post(base, { summary: fixture(), prompt: null })).status, 200);
      assert.equal((await post(base, { summary: fixture(), prompt: '' })).status, 200);
      assert.equal((await post(base, { summary: fixture(), prompt: '   \n  ' })).status, 200);
    });
    assert.deepEqual(seenPrompts, [
      'Custom global prompt.',
      defaultPrompt,
      defaultPrompt,
      defaultPrompt,
      defaultPrompt
    ]);
  }
});

test('endpoint validates { summary, prompt } types, extra keys, size limits, and empty-week order', async () => {
  let upstreamCalls = 0;
  await usingServer({
    apiKey: 'test-secret',
    model: 'test-model',
    fetchImpl: async () => {
      upstreamCalls++;
      return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Recorded spending was HK$30.00.' }] }] }) };
    }
  }, async base => {
    const empty = buildSummary([], '2026-10-23');
    assert.equal((await post(base, { summary: fixture(), prompt: 123 })).status, 400);
    assert.equal((await post(base, { summary: fixture(), prompt: {} })).status, 400);
    assert.equal((await post(base, { summary: empty, prompt: 123 })).status, 400);
    assert.equal((await post(base, { summary: fixture(), prompt: 'ok', extra: 1 })).status, 400);
    assert.equal((await post(base, { summary: { bad: true }, prompt: 'ok' })).status, 400);
    assert.equal((await post(base, { summary: fixture(), prompt: 'a'.repeat(20001) })).status, 400);
    assert.equal((await post(base, { summary: fixture(), prompt: 'a'.repeat(19000) })).status, 200);
    assert.equal((await post(base, { summary: fixture(), prompt: 'b'.repeat(39500) })).status, 413);
    const emptyRes = await post(base, { summary: empty, prompt: 'Custom prompt' });
    assert.equal(emptyRes.status, 200);
    assert.equal((await emptyRes.json()).report, 'No expenses were recorded for this seven-day period.');
    assert.equal(upstreamCalls, 1);
  });
});
