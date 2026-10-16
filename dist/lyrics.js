export function parseLyrics(text){
 if(text.length>100000)throw Error('La letra supera el tamaño permitido.');
 const rows=text.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
 const offset=Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1]||0)/1000;
 const entries=[];let timed=false;
 for(const row of rows){const stamps=[...row.matchAll(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];if(stamps.length){timed=true;const line=row.replace(/\[[^\]]*\]/g,'').trim();for(const m of stamps)entries.push({time:Math.max(0,Number(m[1])*60+Number(m[2])+Number('0.'+(m[3]||'0'))+offset),text:line});}}
 if(!timed)for(const row of rows){const line=row.trim();if(line&&!/^\[[a-z]+:.*\]$/i.test(line))entries.push({time:null,text:line});}
 if(entries.length>500)throw Error('Usá hasta 500 frases por canción.');
 if(timed)entries.sort((a,b)=>a.time-b.time);
 return{entries,timed};
}
export function activeLine(entries,seconds){let found=-1;for(let i=0;i<entries.length;i++)if(entries[i].time!==null&&entries[i].time<=seconds)found=i;return found;}
export function toLrc(entries,offset=0){return entries.filter(e=>e.time!==null).map(e=>{const t=Math.max(0,e.time+offset),m=Math.floor(t/60),s=t-m*60;return`[${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}]${e.text}`;}).join('\n');}

export function createLyrics({vault,getSongId,getPosition,togglePlayback,canEdit,download,say}){
 const $=s=>document.querySelector(s);let entries=[],offset=0,index=0,owner=null,lastDisplay=null;
 const ready=()=>{if(!getSongId())throw Error('Elegí una canción primero.');if(!canEdit())throw Error('Esperá a que termine la preparación o la grabación.');};
 async function save(){ready();await vault.putItem('lyrics','lyrics:'+getSongId(),{entries,offset});}
 function markLabel(){const next=entries.findIndex(e=>e.time===null);index=next<0?entries.length:next;$('#markLyric').textContent=index<entries.length?'Marcar ahora: '+entries[index].text.slice(0,65):'Todas las frases tienen tiempo';$('#markLyric').disabled=index>=entries.length;}
 function render(force=false){
  const t=getPosition(),i=activeLine(entries,t-offset),next=i<0?0:i+1,display=[i,next,entries[i]?.text,entries[next]?.text].join('|');if(!force&&display===lastDisplay)return;lastDisplay=display;
  $('#lyricCurrent').textContent=i>=0?(entries[i].text||'♫ Instrumental'):(entries.some(e=>e.time!==null)?'Prepará tu voz…':'Tu letra aparecerá acá');
  $('#lyricNext').textContent=entries[next]?.text||'';$('#lyricCount').textContent=entries.length?`${entries.filter(e=>e.time!==null).length} de ${entries.length} frases sincronizadas`:'Sin letra · esta función es opcional';
 }
 async function load(id){owner=id;entries=[];offset=0;if(id){const stored=await vault.getItem('lyrics:'+id);if(owner!==id)return;if(stored){entries=stored.entries||[];offset=stored.offset||0;}}$('#lyricText').value=entries.map(e=>e.text).join('\n');$('#lyricOffset').value=offset;$('#lyricOffsetValue').textContent=offset+' s';markLabel();render(true);}
 async function useText(text){ready();const parsed=parseLyrics(text);if(!parsed.entries.length)throw Error('El archivo no contiene frases.');entries=parsed.entries;offset=0;$('#lyricOffset').value=0;$('#lyricOffsetValue').textContent='0 s';$('#lyricText').value=entries.map(e=>e.text).join('\n');await save();markLabel();render(true);say(parsed.timed?'Letra sincronizada guardada. Probala con esta versión de la canción.':'Texto guardado. Reproducí la pista y marcá cada frase cuando empiece.');}
 $('#lyricFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>150000)throw Error('Elegí un archivo de texto de hasta 150 KB.');await useText(await f.text());}catch(err){say(err.message,true);}finally{e.target.value='';}};
 $('#useLyricText').onclick=async()=>{try{await useText($('#lyricText').value);}catch(e){say(e.message,true);}};
 $('#markLyric').onclick=async()=>{try{ready();if(index>=entries.length)return;const time=Math.max(0,getPosition()-offset);const previous=entries.slice(0,index).filter(e=>e.time!==null).at(-1);if(previous&&time<previous.time)throw Error('Avanzá hasta después de la frase anterior o usá Reiniciar marcas.');entries[index].time=time;await save();markLabel();render(true);}catch(e){say(e.message,true);}};
 $('#resetLyricTimes').onclick=async()=>{try{ready();const previous=entries.map(e=>({...e}));entries=entries.map(e=>({...e,time:null}));await save();markLabel();render(true);say('Marcas reiniciadas. Podés volver a sincronizar las frases.');const undo=$('#undoLyricReset');undo.hidden=false;undo.onclick=async()=>{entries=previous;await save();markLabel();render(true);undo.hidden=true;};}catch(e){say(e.message,true);}};
 $('#lyricOffset').onchange=async()=>{try{ready();offset=Number($('#lyricOffset').value);$('#lyricOffsetValue').textContent=offset+' s';await save();render(true);}catch(e){say(e.message,true);}};
 $('#exportLyrics').onclick=()=>{try{ready();if(!entries.some(e=>e.time!==null))throw Error('Marcá al menos una frase antes de descargar LRC.');download(new Blob([toLrc(entries,offset)],{type:'text/plain;charset=utf-8'}),'Mi letra sincronizada.lrc');}catch(e){say(e.message,true);}};
 $('#karaokePlay').onclick=togglePlayback;
 $('#expandLyrics').onclick=()=>{const large=$('#karaokeScreen').classList.toggle('is-expanded');$('#expandLyrics').textContent=large?'Cerrar pantalla grande':'Ver letra en grande';$('#expandLyrics').setAttribute('aria-expanded',String(large));};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#karaokeScreen').classList.contains('is-expanded')){$('#karaokeScreen').classList.remove('is-expanded');$('#expandLyrics').textContent='Ver letra en grande';$('#expandLyrics').setAttribute('aria-expanded','false');}});
 setInterval(()=>render(),120);return{load};
}
