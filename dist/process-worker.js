// The former granular/stereo-subtraction engine has been retired.
self.onmessage=({data})=>{if(data.shift||data.mode!=='original'){self.postMessage({error:'La separación y el cambio de tono requieren el motor local especializado.'});return;}self.postMessage({channels:data.channels});};
