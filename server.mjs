import {handleEngine} from './audio-engine.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec} from 'node:child_process';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 if(await handleEngine(req,res))return;
 try {const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(p!==resolve(root)&&!p.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
 const path=p===resolve(root)?resolve(root,'index.html'):p;
 const content=await readFile(path);
 res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache','Permissions-Policy':'microphone=(self), camera=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' https:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"});res.end(content);
 }catch{if(!res.headersSent)res.writeHead(404);res.end('No encontrado');}
});
const port=Number(process.env.PORT||3000);
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'El puerto ya esta en uso. Si MixLab ya esta abierto, usa esa ventana.':'No se pudo abrir MixLab: '+error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
 console.log(`MixLab: http://localhost:${port}`);
 if(process.argv.includes('--open')&&process.platform==='win32')exec(`start "" "http://localhost:${port}"`);
});

