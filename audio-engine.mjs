import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep,join} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url)),jobRoot=resolve(root,'.engine/jobs');
const python=process.env.MIXLAB_PYTHON||join(root,'.engine','venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
const program=join(root,'engine/process.py'),token=randomBytes(32).toString('hex'),jobs=new Map();
let running=false,statusPromise;
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
function run(args,onLine=()=>{}){return new Promise((resolve,reject)=>{const child=spawn(python,[program,...args],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONUNBUFFERED:'1'}});let stdout='',stderr='',pending='';child.stdout.on('data',data=>{stdout+=data;pending+=data;let at;while((at=pending.indexOf('\n'))>=0){const line=pending.slice(0,at);pending=pending.slice(at+1);try{onLine(JSON.parse(line));}catch{}}});child.stderr.on('data',data=>{stderr=(stderr+data).slice(-3000);});child.on('error',reject);child.on('close',code=>code===0?resolve(stdout):reject(Error((stdout.split('\n').filter(Boolean).pop()||stderr||'El motor se detuvo.').slice(-1000))));onLine({child});});}
async function status(){if(!existsSync(python))return{separation:false,pitch:false,dependencies:false};if(!statusPromise)statusPromise=run(['--check']).then(out=>JSON.parse(out.trim().split('\n').pop())).catch(()=>({separation:false,pitch:false,dependencies:false}));return statusPromise;}
async function clean(job){if(job.child){const child=job.child;job.child=null;child.kill();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('close',resolve);setTimeout(resolve,5000).unref();});}const rel=relative(jobRoot,job.dir);if(!rel||rel.startsWith('..'+sep)||rel==='..'||isAbsolute(rel))throw Error('Ruta temporal inválida');await rm(job.dir,{recursive:true,force:true,maxRetries:3,retryDelay:150});jobs.delete(job.id);}
async function readBody(req){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>360*1024*1024)throw Error('El audio decodificado supera 360 MB.');chunks.push(c);}return Buffer.concat(chunks);}
export async function handleEngine(req,res){const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/engine'))return false;
 const host=req.headers.host,origin=req.headers.origin;
 if(!/^(localhost|127\.0\.0\.1):\d+$/.test(host||'')||(origin&&origin!==`http://${host}`)||req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'Solo se permite procesamiento desde MixLab local.'});return true;}
 try{
  if(req.method==='GET'&&url.pathname==='/api/engine'){json(res,200,{...await status(),token,local:true});return true;}
  if(req.headers['x-mixlab-engine']!==token){json(res,403,{error:'Volvé a abrir MixLab para conectar el motor.'});return true;}
  if(req.method==='POST'&&url.pathname==='/api/engine/jobs'){
   if(running){json(res,409,{error:'El motor está preparando otra pista. Esperá a que termine.'});return true;}
   const task=url.searchParams.get('task'),semitones=Number(url.searchParams.get('semitones')||0),available=await status();
   if(!['separate','pitch'].includes(task)||!Number.isInteger(semitones)||Math.abs(semitones)>6){json(res,400,{error:'Ajuste inválido.'});return true;}
   if(!(task==='separate'?available.separation:available.pitch)){json(res,503,{error:'Primero ejecutá INSTALAR-MOTOR.bat en esta computadora.'});return true;}
   if(running){json(res,409,{error:'El motor está preparando otra pista. Esperá a que termine.'});return true;}
   running=true;let job;
   try{await mkdir(jobRoot,{recursive:true});const dir=await mkdtemp(join(jobRoot,'job-')),id=randomUUID();job={id,dir,state:'working',message:'Recibiendo audio local…',child:null};jobs.set(id,job);const body=await readBody(req);if(body.toString('ascii',0,4)!=='RIFF'||body.toString('ascii',8,12)!=='WAVE')throw Error('Se esperaba un archivo WAV.');await writeFile(join(dir,'input.wav'),body);json(res,202,{id});
    run(['--task',task,'--input',join(dir,'input.wav'),'--output',dir,'--semitones',String(semitones)],event=>{if(event.child)job.child=event.child;else job.message=event.message||job.message;}).then(()=>{job.state='done';job.child=null;}).catch(error=>{job.state='error';job.child=null;job.message=error.message;}).finally(()=>{running=false;setTimeout(()=>clean(job).catch(()=>{}),30*60*1000).unref();});
   }catch(error){running=false;if(job)await clean(job);if(!res.headersSent)throw error;}return true;
  }
  const match=url.pathname.match(/^\/api\/engine\/jobs\/([0-9a-f-]+)(?:\/(instrumental|vocals|result))?$/);if(!match){json(res,404,{error:'No encontrado.'});return true;}const job=jobs.get(match[1]);if(!job){json(res,404,{error:'La tarea ya no está disponible. Podés volver a prepararla.'});return true;}
  if(req.method==='DELETE'){await clean(job);json(res,200,{deleted:true});return true;}
  if(req.method!=='GET'){json(res,405,{error:'Método no permitido.'});return true;}
  if(!match[2]){json(res,200,{state:job.state,message:job.message});return true;}
  if(job.state!=='done'){json(res,409,{error:'La pista todavía no está lista.'});return true;}
  const bytes=await readFile(join(job.dir,match[2]+'.mp3'));res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);return true;
 }catch(error){if(!res.headersSent)json(res,400,{error:error.message});else res.end();return true;}
}
