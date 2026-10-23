'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {validateSummary,modelSummary}=require('../dist/report-data.js');
const prompt=fs.readFileSync(path.join(__dirname,'weekly-report-prompt.txt'),'utf8');
const root=path.join(__dirname,'../dist');
const assets=new Set(fs.readdirSync(root).filter(name=>/\.(html|js|css)$/.test(name)));
function createServer({apiKey='',model='',apiFormat='responses',baseUrl='https://api.openai.com/v1',enableThinking,maxCalls=30,fetchImpl=fetch}={}) {
  if(!['responses','chat'].includes(apiFormat)) throw new Error('AI_API_FORMAT must be responses or chat');
  if(enableThinking!==undefined && typeof enableThinking!=='boolean') throw new Error('AI_ENABLE_THINKING must be true or false');
  const endpoint=new URL(baseUrl);
  if(endpoint.protocol!=='https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('AI_BASE_URL must be an HTTPS base URL without credentials, query or fragment');
  const apiUrl=baseUrl.replace(/\/+$/,'')+(apiFormat==='chat'?'/chat/completions':'/responses');
  let windowStart=Date.now(), calls=0, active=false;
  return http.createServer(async(req,res)=>{
    const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
    const url=new URL(req.url,'http://localhost');
    if (url.pathname==='/api/weekly-report') {
      if (req.method!=='POST') return send(405,{error:'Use POST to generate a report.'});
      if (req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`) return send(403,{error:'Cross-origin requests are not allowed.'});
      if (!(req.headers['content-type']||'').startsWith('application/json')) return send(415,{error:'Send a JSON summary.'});
      let summary;
      try {
        let body='', size=0;
        for await (const chunk of req) {size+=chunk.length;if(size>20000){send(413,{error:'Summary is too large.'});return;}body+=chunk;}
        summary=validateSummary(JSON.parse(body));
      } catch {return send(400,{error:'The weekly report could not be generated from the supplied summary.'});}
      if (summary.current.count===0) return send(200,{report:'No expenses were recorded for this seven-day period.'});
      if (!apiKey || !model) return send(503,{error:'AI reporting is not configured on the server yet.'});
      if(active) return send(429,{error:'A report is already being generated. Please wait and try again.'});
      if (Date.now()-windowStart>=3600000) {windowStart=Date.now();calls=0;}
      if(calls>=maxCalls) return send(429,{error:'The demo report limit has been reached. Try again later.'});
      calls++; active=true;
      try {
        const input=JSON.stringify(modelSummary(summary));
        const body=apiFormat==='chat'
          ? {model,messages:[{role:'system',content:prompt},{role:'user',content:input}],max_tokens:2048,stream:false,...(enableThinking===undefined?{}:{enable_thinking:enableThinking})}
          : {model,instructions:prompt,input,max_output_tokens:2048,store:false};
        const response=await fetchImpl(apiUrl,{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000),redirect:'error'});
        if (!response.ok) throw new Error('provider');
        const data=await response.json();
        let report;
        if(apiFormat==='chat') {
          const choice=data.choices?.[0];
          if(choice?.finish_reason!=='stop' || typeof choice.message?.content!=='string') throw new Error('incomplete');
          report=choice.message.content.trim();
        } else {
          if(data.status!=='completed') throw new Error('incomplete');
          report=(data.output||[]).filter(o=>o.type==='message').flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join(' ').trim();
        }
        if(!report || report.length>3000 || /[\r\n]|^\s*(?:#|[-*•]\s)/.test(report)) throw new Error('invalid output');
        return send(200,{report});
      } catch {return send(502,{error:'The AI report could not be generated. Please try again.'});}
      finally {active=false;}
    }
    const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
    if(!['GET','HEAD'].includes(req.method) || !assets.has(name)) return send(404,{error:'Not found.'});
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
    res.writeHead(200,{'content-type':`${types[path.extname(name)]}; charset=utf-8`,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'same-origin'});
    if(req.method==='HEAD') res.end(); else fs.createReadStream(path.join(root,name)).pipe(res);
  });
}
if(require.main===module){
  const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||9019);
  const maxCalls=Number(process.env.REPORT_MAX_CALLS_PER_HOUR||30);
  if(!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>1000) throw new Error('Invalid REPORT_MAX_CALLS_PER_HOUR');
  const thinking=process.env.AI_ENABLE_THINKING;
  if(thinking && !['true','false'].includes(thinking)) throw new Error('AI_ENABLE_THINKING must be true or false');
  createServer({apiKey:process.env.AI_API_KEY||process.env.OPENAI_API_KEY,model:process.env.AI_MODEL||process.env.OPENAI_MODEL,apiFormat:process.env.AI_API_FORMAT||'responses',baseUrl:process.env.AI_BASE_URL||'https://api.openai.com/v1',enableThinking:thinking?thinking==='true':undefined,maxCalls}).listen(port,host,()=>console.log(`Spending Analyzer: http://${host}:${port}`));
}
module.exports={createServer};
