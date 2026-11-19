const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const WeeklyReportData=require(path.join(__dirname,'..','dist','report-data.js'));

function ui(fetchImpl,config={apiBaseUrl:''},hostname='localhost') {
  const nodes=Object.fromEntries(['generate-report','weekly-report','report-status'].map(id=>[id,{textContent:'',value:'',disabled:false,addEventListener(name,fn){this[name]=fn;}}]));
  const context=vm.createContext({document:{getElementById:id=>nodes[id]},location:{protocol:'https:',hostname},SPENDLY_CONFIG:config,fetch:fetchImpl,AbortController,setTimeout,clearTimeout});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-ui.js'),'utf8')+'\nglobalThis.ui=WeeklyReportUI;',context);
  return {nodes,update:context.ui.update,click:()=>nodes['generate-report'].click()};
}

function createStorage(throwing=false) {
  const map=new Map();
  return {
    map,
    getItem(k){ if(throwing) throw new Error('storage error'); return map.has(k)?map.get(k):null; },
    setItem(k,v){ if(throwing) throw new Error('storage error'); map.set(k,String(v)); },
    removeItem(k){ if(throwing) throw new Error('storage error'); map.delete(k); }
  };
}

function uiFull(fetchImpl,{config={apiBaseUrl:''},hostname='localhost',protocol='https:',localStorage=createStorage(),sessionStorage=createStorage()}={}) {
  const makeNode=(extra={})=>({
    textContent:'',
    value:'',
    disabled:false,
    hidden:false,
    placeholder:'',
    type:'',
    attributes:{},
    listeners:{},
    setAttribute(k,v){ this.attributes[k]=String(v); },
    getAttribute(k){ return this.attributes[k]; },
    addEventListener(name,fn){ (this.listeners[name]??=[]).push(fn); },
    async trigger(name){ for (const fn of this.listeners[name]||[]) await fn(); },
    ...extra
  });
  const nodes={
    'generate-report':makeNode(),
    'weekly-report':makeNode(),
    'report-status':makeNode(),
    'report-provider':makeNode({value:'gemini'}),
    'report-model':makeNode({value:'gemini-2.5-flash'}),
    'report-custom-fields':makeNode({hidden:true}),
    'report-base-url':makeNode({value:''}),
    'report-wire-format':makeNode({value:'openai-chat'}),
    'report-api-key':makeNode({value:'',type:'password'}),
    'toggle-api-key':makeNode({textContent:'Show',attributes:{'aria-pressed':'false','aria-label':'Show API key'}}),
    'clear-api-key':makeNode()
  };
  const context=vm.createContext({
    document:{getElementById:id=>nodes[id]},
    location:{protocol,hostname},
    SPENDLY_CONFIG:config,
    fetch:fetchImpl,
    AbortController,
    setTimeout,
    clearTimeout,
    URL,
    localStorage,
    sessionStorage,
    WeeklyReportData
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-prompt.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-ui.js'),'utf8')+'\nglobalThis.ui=WeeklyReportUI;',context);
  return {
    nodes,
    context,
    localStorage,
    sessionStorage,
    update:context.ui.update,
    click:()=>nodes['generate-report'].trigger('click')
  };
}

const sampleSummary=()=>WeeklyReportData.buildSummary([
  {date:'2026-10-23',cents:2000,category:'food',note:'PRIVATE',id:'secret'},
  {date:'2026-10-17',cents:1000,category:'food'},
  {date:'2026-10-16',cents:1000,category:'food'}
],'2026-10-23');

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

test('Pages sends requests to the configured backend without a provider key',async()=>{
  const u=ui(async(url,options)=>{
    assert.equal(url,'https://example.onrender.com/api/weekly-report');
    assert.equal(options.headers.authorization,undefined);
    return {ok:true,json:async()=>({report:'Recorded spending report.'})};
  },{apiBaseUrl:'https://example.onrender.com/'},'jerrygong1002.github.io');
  u.update({current:{count:1}},'demo');await u.click();
  assert.equal(u.nodes['weekly-report'].textContent,'Recorded spending report.');
});
test('unconfigured Pages shows an actionable error without calling the static host',async()=>{
  const u=ui(()=>{throw new Error('Unexpected request');},{apiBaseUrl:''},'jerrygong1002.github.io');
  u.update({current:{count:1}},'demo');await u.click();
  assert.match(u.nodes['report-status'].textContent,/not been connected/);
});

test('built-in presets route browser-direct requests with proper headers, prompt, privacy, and extractors',async()=>{
  const summary=sampleSummary();

  // 1. Gemini preset
  {
    const key='AIzaSyGeminiPresetKey12345';
    const u=uiFull(async(url,options)=>{
      assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
      assert.equal(url.includes(key),false);
      assert.equal(url.includes('?key='),false);
      assert.equal(options.redirect,'error');
      assert.equal(options.headers['x-goog-api-key'],key);
      assert.equal(options.headers.authorization,undefined);
      const body=JSON.parse(options.body);
      assert.match(body.systemInstruction.parts[0].text,/Do not calculate new/);
      assert.equal(body.contents[0].parts[0].text.includes('PRIVATE'),false);
      assert.equal(body.contents[0].parts[0].text.includes('secret'),false);
      return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'THOUGHT: internal'},{text:'Food accounted for HK$30.00.'}]}}]})};
    });
    u.nodes['report-api-key'].value=key;
    u.update(summary,'demo');
    await u.click();
    assert.equal(u.nodes['weekly-report'].textContent,'Food accounted for HK$30.00.');
  }

  // 2. OpenAI preset (Responses API)
  {
    const key='sk-proj-OpenAIPreset12345';
    const u=uiFull(async(url,options)=>{
      assert.equal(url,'https://api.openai.com/v1/responses');
      assert.equal(options.headers.authorization,`Bearer ${key}`);
      const body=JSON.parse(options.body);
      assert.equal(body.model,'gpt-4o-mini');
      assert.equal(body.store,false);
      assert.match(body.instructions,/Do not calculate new/);
      assert.equal(body.input.includes('PRIVATE'),false);
      return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'OpenAI recorded HK$30.00.'}]}]})};
    });
    u.nodes['report-provider'].value='openai';
    await u.nodes['report-provider'].trigger('change');
    assert.equal(u.nodes['report-model'].value,'gpt-4o-mini');
    u.nodes['report-api-key'].value=key;
    u.update(summary,'demo');
    await u.click();
    assert.equal(u.nodes['weekly-report'].textContent,'OpenAI recorded HK$30.00.');
  }

  // 3. Claude preset
  {
    const key='sk-ant-ClaudePreset12345';
    const u=uiFull(async(url,options)=>{
      assert.equal(url,'https://api.anthropic.com/v1/messages');
      assert.equal(options.headers['x-api-key'],key);
      assert.equal(options.headers['anthropic-version'],'2023-06-01');
      assert.equal(options.headers['anthropic-dangerous-direct-browser-access'],'true');
      const body=JSON.parse(options.body);
      assert.equal(body.model,'claude-haiku-4-5');
      assert.match(body.system,/Do not calculate new/);
      assert.equal(body.messages[0].content.includes('PRIVATE'),false);
      return {ok:true,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:'Claude recorded HK$30.00.'}]})};
    });
    u.nodes['report-provider'].value='claude';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-api-key'].value=key;
    u.update(summary,'demo');
    await u.click();
    assert.equal(u.nodes['weekly-report'].textContent,'Claude recorded HK$30.00.');
  }

  // 4. DeepSeek preset
  {
    const key='sk-DeepSeekPreset12345';
    const u=uiFull(async(url,options)=>{
      assert.equal(url,'https://api.deepseek.com/chat/completions');
      assert.equal(options.headers.authorization,`Bearer ${key}`);
      const body=JSON.parse(options.body);
      assert.equal(body.model,'deepseek-chat');
      assert.equal(body.stream,false);
      assert.equal(body.max_tokens,2048);
      assert.match(body.messages[0].content,/Do not calculate new/);
      assert.equal(body.messages[1].content.includes('PRIVATE'),false);
      return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'DeepSeek recorded HK$30.00.'}}]})};
    });
    u.nodes['report-provider'].value='deepseek';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-api-key'].value=key;
    u.update(summary,'demo');
    await u.click();
    assert.equal(u.nodes['weekly-report'].textContent,'DeepSeek recorded HK$30.00.');
  }

  // 5. OpenRouter preset
  {
    const key='sk-or-OpenRouterPreset12345';
    const u=uiFull(async(url,options)=>{
      assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
      assert.equal(options.headers.authorization,`Bearer ${key}`);
      assert.equal(options.headers['x-title'],'Spendly');
      const body=JSON.parse(options.body);
      assert.equal(body.model,'openai/gpt-4o-mini');
      return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'OpenRouter recorded HK$30.00.'}}]})};
    });
    u.nodes['report-provider'].value='openrouter';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-api-key'].value=key;
    u.update(summary,'demo');
    await u.click();
    assert.equal(u.nodes['weekly-report'].textContent,'OpenRouter recorded HK$30.00.');
  }
});

test('Custom Base URL supports all 4 wire formats, trailing slashes, localhost, and rejects unsafe URLs',async()=>{
  const summary=sampleSummary();
  const cases=[
    ['openai-chat','https://proxy.example.com/v1/','custom-chat','https://proxy.example.com/v1/chat/completions',{choices:[{finish_reason:'stop',message:{content:'Custom chat ok.'}}]}],
    ['openai-chat','http://localhost:11434','llama3','http://localhost:11434/v1/chat/completions',{choices:[{finish_reason:'stop',message:{content:'Localhost ok.'}}]}],
    ['openai-responses','http://127.0.0.1:8080/v1','gpt-4o-mini','http://127.0.0.1:8080/v1/responses',{status:'completed',output_text:'Loopback responses ok.'}],
    ['anthropic','https://anthropic-proxy.example.com/v1/','claude-sonnet','https://anthropic-proxy.example.com/v1/messages',{stop_reason:'stop_sequence',content:[{type:'text',text:'Custom anthropic ok.'}]}],
    ['gemini','https://gemini-proxy.example.com/v1beta/','gemini-2.5-pro','https://gemini-proxy.example.com/v1beta/models/gemini-2.5-pro:generateContent',{candidates:[{finishReason:'STOP',content:{parts:[{text:'Custom gemini ok.'}]}}]}]
  ];

  for (const [wireFormat,baseUrl,model,expectedUrl,mockData] of cases) {
    const u=uiFull(async(url)=>{
      assert.equal(url,expectedUrl);
      return {ok:true,json:async()=>mockData};
    });
    u.nodes['report-provider'].value='custom';
    await u.nodes['report-provider'].trigger('change');
    assert.equal(u.nodes['report-custom-fields'].hidden,false);
    u.nodes['report-wire-format'].value=wireFormat;
    u.nodes['report-base-url'].value=baseUrl;
    u.nodes['report-model'].value=model;
    u.nodes['report-api-key'].value='custom-secret-key';
    u.update(summary,'demo');
    await u.click();
    assert.notEqual(u.nodes['weekly-report'].textContent,'');
  }

  for (const badUrl of ['', 'http://example.com/v1', 'https://user:pass@example.com/v1', 'https://example.com/v1?x=1', 'https://example.com/v1#frag', 'not-a-url']) {
    let calls=0;
    const u=uiFull(()=>{calls++;});
    u.nodes['report-provider'].value='custom';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-base-url'].value=badUrl;
    u.nodes['report-model'].value='test-model';
    u.nodes['report-api-key'].value='custom-secret-key';
    u.update(summary,'demo');
    await u.click();
    assert.equal(calls,0);
    assert.match(u.nodes['report-status'].textContent,/Custom Base URL/);
  }
});

test('API key stays memory-only, toggles/clears cleanly, and never leaks in error messages',async()=>{
  const summary=sampleSummary();
  const specialKey='AIzaSyTest+Key/Abc=123';
  const ls=createStorage();
  const ss=createStorage();

  const u=uiFull(async()=>{
    throw new Error(`Unexpected fail with ${specialKey} and ${encodeURIComponent(specialKey)} and Bearer sk-proj-Secret998877 and ?key=AIzaSyAnotherKey123456 and xai-Secret123 and gsk_Secret123 and or-Secret123`);
  },{localStorage:ls,sessionStorage:ss});

  u.nodes['report-api-key'].value=specialKey;
  u.update(summary,'demo');
  await u.click();

  assert.equal(ls.map.size,0);
  assert.equal(ss.map.size,0);
  const statusMsg=u.nodes['report-status'].textContent;
  for (const leak of [specialKey, encodeURIComponent(specialKey), 'sk-proj-Secret998877', 'AIzaSyAnotherKey123456', 'xai-Secret123', 'gsk_Secret123', 'or-Secret123']) {
    assert.equal(statusMsg.includes(leak),false,`Leaked secret: ${leak}`);
  }

  // Toggle visibility
  await u.nodes['toggle-api-key'].trigger('click');
  assert.equal(u.nodes['report-api-key'].type,'text');
  assert.equal(u.nodes['toggle-api-key'].getAttribute('aria-pressed'),'true');
  assert.equal(u.nodes['toggle-api-key'].textContent,'Hide');

  // Clear key resets visibility and falls back to server/Pages guard on next click
  await u.nodes['clear-api-key'].trigger('click');
  assert.equal(u.nodes['report-api-key'].value,'');
  assert.equal(u.nodes['report-api-key'].type,'password');
  assert.equal(u.nodes['toggle-api-key'].getAttribute('aria-pressed'),'false');
  assert.match(u.nodes['report-status'].textContent,/cleared/);

  // Actionable HTTP/network/timeout/JSON/output errors never leak keys
  const errCases=[
    [{ok:false,status:401,text:async()=>JSON.stringify({error:{message:`Invalid key ${specialKey}`}})},/Authentication failed \(401\)/],
    [{ok:false,status:403,text:async()=>'Forbidden sk-ant-LeakSecret12345'},/Authentication failed \(403\)/],
    [{ok:false,status:404,text:async()=>'Not found'},/not found \(404\)/],
    [{ok:false,status:429,text:async()=>'Too many requests'},/Rate limit or quota exceeded \(429\)/],
    [{ok:false,status:500,text:async()=>'Server exploded'},/HTTP 500/],
    [{ok:true,json:async()=>{throw new SyntaxError('Unexpected end of JSON');}},/invalid or truncated JSON/],
    [{ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'# Heading\n- bullet'}]}}]})},/unexpected report format/]
  ];
  for (const [resp,pattern] of errCases) {
    const eu=uiFull(async()=>resp);
    eu.nodes['report-api-key'].value=specialKey;
    eu.update(summary,'demo');
    await eu.click();
    assert.match(eu.nodes['report-status'].textContent,pattern);
    assert.equal(eu.nodes['report-status'].textContent.includes(specialKey),false);
  }

  // Network/CORS TypeError & AbortError timeout
  const netUi=uiFull(async()=>{throw new TypeError('Failed to fetch');});
  netUi.nodes['report-api-key'].value=specialKey;
  netUi.update(summary,'demo');
  await netUi.click();
  assert.match(netUi.nodes['report-status'].textContent,/CORS/);

  const abortUi=uiFull(async()=>{const err=new Error('Aborted');err.name='AbortError';throw err;});
  abortUi.nodes['report-api-key'].value=specialKey;
  abortUi.update(summary,'demo');
  await abortUi.click();
  assert.match(abortUi.nodes['report-status'].textContent,/timed out/);
});

test('browser-direct mode respects empty week, invalid summary guard, and ledger-switch race protection',async()=>{
  let calls=0;
  const emptyUi=uiFull(()=>{calls++;});
  emptyUi.nodes['report-api-key'].value='AIzaSyEmptyWeekTestKey123';
  emptyUi.update(WeeklyReportData.buildSummary([],'2026-10-23'),'personal');
  await emptyUi.click();
  assert.equal(calls,0);
  assert.match(emptyUi.nodes['weekly-report'].textContent,/No expenses/);

  const badUi=uiFull(()=>{calls++;});
  badUi.nodes['report-api-key'].value='AIzaSyBadSummaryTestKey123';
  badUi.update({current:{count:1}},'demo');
  await badUi.click();
  assert.equal(calls,0);
  assert.match(badUi.nodes['report-status'].textContent,/Invalid or contradictory/);

  let resolve, capturedSignal;
  const raceUi=uiFull((_url,options)=>{
    capturedSignal=options.signal;
    return new Promise(r=>{resolve=r;});
  });
  raceUi.nodes['report-api-key'].value='AIzaSyRaceTestKey123456';
  raceUi.update(sampleSummary(),'demo');
  const pending=raceUi.click();
  raceUi.update(WeeklyReportData.buildSummary([],'2026-10-23'),'personal');
  assert.equal(capturedSignal.aborted,true);
  resolve({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Stale report'}]}}]})});
  await pending;
  assert.equal(raceUi.nodes['weekly-report'].textContent,'');
  assert.match(raceUi.nodes['report-status'].textContent,/Ready/);
  assert.equal(raceUi.nodes['generate-report'].disabled,false);
});

test('custom global prompt persists in localStorage, resets cleanly, and applies to server & direct calls',async()=>{
  const ls=createStorage();
  const summary=sampleSummary();

  // Default prompt + no key sends raw summary (backward compatible)
  const defaultServerUi=uiFull(async(_url,options)=>{
    assert.deepEqual(JSON.parse(options.body),summary);
    return {ok:true,json:async()=>({report:'Default prompt server report.'})};
  },{localStorage:ls});
  assert.equal(defaultServerUi.context.WeeklyReportPromptConfig.isCustomReportPrompt(),false);
  defaultServerUi.update(summary,'demo');
  await defaultServerUi.click();
  assert.equal(defaultServerUi.nodes['weekly-report'].textContent,'Default prompt server report.');

  // Save custom prompt -> persists under spending-analyzer.report-prompt.v1
  const customText='Custom global prompt: summarize in 3 sentences.';
  const saved=defaultServerUi.context.WeeklyReportPromptConfig.saveReportPrompt(customText);
  assert.equal(saved.ok,true);
  assert.equal(saved.custom,true);
  assert.equal(saved.prompt,customText);
  assert.equal(ls.map.get('spending-analyzer.report-prompt.v1'),customText);

  // Custom prompt + no key -> sends { summary, prompt }
  const customServerUi=uiFull(async(_url,options)=>{
    assert.deepEqual(JSON.parse(options.body),{summary,prompt:customText});
    return {ok:true,json:async()=>({report:'Custom prompt server report.'})};
  },{localStorage:ls});
  customServerUi.update(summary,'demo');
  await customServerUi.click();
  assert.equal(customServerUi.nodes['weekly-report'].textContent,'Custom prompt server report.');

  // Custom prompt + browser key -> direct request uses custom prompt
  const customDirectUi=uiFull(async(_url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.systemInstruction.parts[0].text,customText);
    return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Custom prompt direct report.'}]}}]})};
  },{localStorage:ls});
  customDirectUi.nodes['report-api-key'].value='AIzaSyCustomPromptKey12345';
  customDirectUi.update(summary,'demo');
  await customDirectUi.click();
  assert.equal(customDirectUi.nodes['weekly-report'].textContent,'Custom prompt direct report.');

  // Reset restores default prompt and removes storage key
  const reset=customDirectUi.context.WeeklyReportPromptConfig.resetReportPrompt();
  assert.equal(reset.ok,true);
  assert.equal(reset.custom,false);
  assert.equal(ls.map.has('spending-analyzer.report-prompt.v1'),false);
  assert.equal(customDirectUi.context.WeeklyReportPromptConfig.getActiveReportPrompt(),customDirectUi.context.WeeklyReportPrompt);

  // Whitespace or throwing localStorage falls back cleanly to default prompt
  ls.setItem('spending-analyzer.report-prompt.v1','   \n  ');
  assert.equal(customDirectUi.context.WeeklyReportPromptConfig.getStoredReportPrompt(),null);
  assert.equal(customDirectUi.context.WeeklyReportPromptConfig.getActiveReportPrompt(),customDirectUi.context.WeeklyReportPrompt);

  const brokenUi=uiFull(async()=>({ok:true,json:async()=>({report:'ok'})}),{localStorage:createStorage(true)});
  assert.equal(brokenUi.context.WeeklyReportPromptConfig.getActiveReportPrompt(),brokenUi.context.WeeklyReportPrompt);
  assert.equal(brokenUi.context.WeeklyReportPromptConfig.saveReportPrompt('test').ok,false);
  assert.equal(brokenUi.context.WeeklyReportPromptConfig.resetReportPrompt().ok,false);
});

test('browser-direct resolves lexical const WeeklyReportData without globalThis and report-data attaches globalThis',async()=>{
  const summary=sampleSummary();
  const makeNode=(extra={})=>({
    textContent:'',value:'',disabled:false,hidden:false,placeholder:'',type:'',attributes:{},listeners:{},
    setAttribute(k,v){ this.attributes[k]=String(v); },
    getAttribute(k){ return this.attributes[k]; },
    addEventListener(name,fn){ (this.listeners[name]??=[]).push(fn); },
    async trigger(name){ for (const fn of this.listeners[name]||[]) await fn(); },
    ...extra
  });
  const nodes={
    'generate-report':makeNode(),
    'weekly-report':makeNode(),
    'report-status':makeNode(),
    'report-provider':makeNode({value:'gemini'}),
    'report-model':makeNode({value:'gemini-2.5-flash'}),
    'report-custom-fields':makeNode({hidden:true}),
    'report-base-url':makeNode({value:''}),
    'report-wire-format':makeNode({value:'openai-chat'}),
    'report-api-key':makeNode({value:'AIzaSyLexicalTestKey12345',type:'password'}),
    'toggle-api-key':makeNode({textContent:'Show'}),
    'clear-api-key':makeNode()
  };
  let calls=0;
  const lexicalContext=vm.createContext({
    document:{getElementById:id=>nodes[id]},
    location:{protocol:'https:',hostname:'jerrygong1002.github.io'},
    SPENDLY_CONFIG:{apiBaseUrl:''},
    fetch:async()=>{
      calls++;
      return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Lexical WeeklyReportData resolved cleanly.'}]}}]})};
    },
    AbortController,
    setTimeout,
    clearTimeout,
    URL,
    localStorage:createStorage(),
    _hostReportData:WeeklyReportData
  });
  // Define WeeklyReportData strictly as a top-level lexical const (undefined on globalThis)
  vm.runInContext("'use strict';\nconst WeeklyReportData = _hostReportData;",lexicalContext);
  assert.equal(lexicalContext.WeeklyReportData,undefined);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-prompt.js'),'utf8'),lexicalContext);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-ui.js'),'utf8')+'\nglobalThis.ui=WeeklyReportUI;',lexicalContext);
  lexicalContext.ui.update(summary,'demo');
  await nodes['generate-report'].trigger('click');
  assert.equal(calls,1);
  assert.equal(nodes['weekly-report'].textContent,'Lexical WeeklyReportData resolved cleanly.');

  // Real dist/report-data.js executed as a classic browser script also exposes globalThis.WeeklyReportData
  const browserContext=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','dist','report-data.js'),'utf8'),browserContext);
  assert.equal(typeof browserContext.WeeklyReportData?.validateSummary,'function');
  assert.equal(typeof browserContext.WeeklyReportData?.modelSummary,'function');
});

test('Custom Base URL normalizes bare root double slashes, rejects bare query/fragment and empty userinfo',async()=>{
  const summary=sampleSummary();
  const validSlashCases=[
    ['openai-chat','https://proxy.example.com//','m','https://proxy.example.com/v1/chat/completions',{choices:[{finish_reason:'stop',message:{content:'Double slash ok.'}}]}],
    ['openai-chat','https://proxy.example.com///','m','https://proxy.example.com/v1/chat/completions',{choices:[{finish_reason:'stop',message:{content:'Triple slash ok.'}}]}],
    ['gemini','https://proxy.example.com//','gemini-2.5-flash','https://proxy.example.com/v1beta/models/gemini-2.5-flash:generateContent',{candidates:[{finishReason:'STOP',content:{parts:[{text:'Gemini double slash ok.'}]}}]}]
  ];
  for (const [wireFormat,baseUrl,model,expectedUrl,mockData] of validSlashCases) {
    const u=uiFull(async(url)=>{
      assert.equal(url,expectedUrl);
      return {ok:true,json:async()=>mockData};
    });
    u.nodes['report-provider'].value='custom';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-wire-format'].value=wireFormat;
    u.nodes['report-base-url'].value=baseUrl;
    u.nodes['report-model'].value=model;
    u.nodes['report-api-key'].value='custom-secret-key';
    u.update(summary,'demo');
    await u.click();
    assert.notEqual(u.nodes['weekly-report'].textContent,'');
  }

  const invalidCases=[
    ['https://host.example.com?',/query string or fragment/],
    ['https://host.example.com/?',/query string or fragment/],
    ['https://host.example.com#',/query string or fragment/],
    ['https://host.example.com/v1?',/query string or fragment/],
    ['https://host.example.com/v1#',/query string or fragment/],
    ['https://@host.example.com/v1',/credentials/]
  ];
  for (const [badUrl,pattern] of invalidCases) {
    let calls=0;
    const u=uiFull(()=>{calls++;});
    u.nodes['report-provider'].value='custom';
    await u.nodes['report-provider'].trigger('change');
    u.nodes['report-base-url'].value=badUrl;
    u.nodes['report-model'].value='test-model';
    u.nodes['report-api-key'].value='custom-secret-key';
    u.update(summary,'demo');
    await u.click();
    assert.equal(calls,0);
    assert.match(u.nodes['report-status'].textContent,pattern);
  }
});

test('OpenAI :443 uses max_completion_tokens for o3 and 401 ?key=[redacted] preserves closing parenthesis',async()=>{
  const summary=sampleSummary();
  const u=uiFull(async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/chat/completions');
    const body=JSON.parse(options.body);
    assert.equal(body.max_completion_tokens,2048);
    assert.equal(body.max_tokens,undefined);
    return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'OpenAI 443 o3 ok.'}}]})};
  });
  u.nodes['report-provider'].value='custom';
  await u.nodes['report-provider'].trigger('change');
  u.nodes['report-wire-format'].value='openai-chat';
  u.nodes['report-base-url'].value='https://api.openai.com:443/v1';
  u.nodes['report-model'].value='o3';
  u.nodes['report-api-key'].value='sk-proj-OpenAI443Secret';
  u.update(summary,'demo');
  await u.click();
  assert.equal(u.nodes['weekly-report'].textContent,'OpenAI 443 o3 ok.');

  const eu=uiFull(async()=>({
    ok:false,
    status:401,
    text:async()=>JSON.stringify({error:{message:'Failed at https://proxy.example.com/v1?key=AIzaSyTailKey123456'}})
  }));
  eu.nodes['report-api-key'].value='AIzaSyTailKey123456';
  eu.update(summary,'demo');
  await eu.click();
  assert.equal(
    eu.nodes['report-status'].textContent,
    'Authentication failed (401). Check your API key and provider permissions. (Failed at https://proxy.example.com/v1?key=[redacted])'
  );
});

test('clearing API key while request is in flight aborts and discards late reply',async()=>{
  let resolveFetch, aborted=false;
  const u=uiFull((_url,options)=>{
    options.signal?.addEventListener('abort',()=>{aborted=true;});
    return new Promise(r=>{resolveFetch=r;});
  });
  u.nodes['report-api-key'].value='AIzaSyInFlightSecret999';
  u.update(sampleSummary(),'demo');
  const pending=u.click();
  assert.equal(u.nodes['generate-report'].disabled,true);
  await u.nodes['clear-api-key'].trigger('click');
  assert.equal(aborted,true);
  assert.equal(u.nodes['report-api-key'].value,'');
  assert.equal(u.nodes['generate-report'].disabled,false);
  assert.equal(u.nodes['report-status'].textContent,'API key cleared from memory.');
  resolveFetch({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Late stale reply.'}]}}]})});
  await pending;
  assert.equal(u.nodes['weekly-report'].textContent,'');
  assert.equal(u.nodes['report-status'].textContent,'API key cleared from memory.');
});
