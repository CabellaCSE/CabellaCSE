const http=require('http');
const fs=require('fs');
const path=require('path');
const PORT=process.env.PORT||8080;
const ROOT=__dirname;
const OPENAI_API_KEY=process.env.OPENAI_API_KEY||'';
const MODEL=process.env.OPENAI_MODEL||'gpt-5-mini';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.json':'application/json; charset=utf-8'};
function send(res,status,body,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body)}
function readBody(req){return new Promise((resolve,reject)=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e6)req.destroy()});req.on('end',()=>resolve(b));req.on('error',reject)})}
async function askOpenAI(question,context){
 const system=`You are Ask CSE, Cabella's employee assistant. Follow this order strictly: (1) answer from Cabella context when supported; label that as Cabella Answer. (2) If Cabella context does not answer, use general cabinet, stone, flooring, warehouse, contractor-sales, and project-management industry knowledge; label it Industry Guidance. (3) For facts that may be current, say web verification is needed and provide a concise web search query. Never invent Cabella-specific facts. Keep answers practical and direct.`;
 const input=`QUESTION:\n${question}\n\nCABELLA CONTEXT:\n${JSON.stringify(context)}`;
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,instructions:system,input,max_output_tokens:700})});
 if(!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
 const j=await r.json();
 const answer=j.output_text||'';
 const needsWeb=/web verification|current|latest|today/i.test(answer);
 return {title:'Ask CSE',answer,source:needsWeb?'web':'industry',webQuery:needsWeb?question:''};
}
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/status')return send(res,200,JSON.stringify({openai:Boolean(OPENAI_API_KEY),model:MODEL}));
  if(u.pathname==='/api/ask'&&req.method==='POST'){
   if(!OPENAI_API_KEY)return send(res,503,JSON.stringify({error:'OPENAI_API_KEY is not configured'}));
   const data=JSON.parse(await readBody(req)||'{}');
   const out=await askOpenAI(String(data.question||''),data.context||{});
   return send(res,200,JSON.stringify(out));
  }
  let file=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));
  file=path.normalize(file).replace(/^([.][.][/\\])+/, '');
  const full=path.join(ROOT,file);
  if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory())return send(res,404,'Not found','text/plain; charset=utf-8');
  send(res,200,fs.readFileSync(full),mime[path.extname(full).toLowerCase()]||'application/octet-stream');
 }catch(e){send(res,500,JSON.stringify({error:e.message}))}
});
server.listen(PORT,()=>console.log(`CSE running at http://localhost:${PORT}`));
