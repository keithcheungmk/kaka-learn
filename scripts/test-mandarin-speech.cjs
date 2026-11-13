const fs = require('fs'); const vm = require('vm'); const assert = require('assert');
const source = fs.readFileSync('js/speech.js', 'utf8');
function run(voices, strict = true, loadAfterFirst = false) {
  const spoken=[]; let unavailable=0; let end=0; let timers=[];
  const synth={getVoices:()=>voices,cancel(){},speak(u){spoken.push(u)},resume(){}};
  class Utter { constructor(text){this.text=text} addEventListener(){} }
  const ctx={window:{speechSynthesis:synth},speechSynthesis:synth,SpeechSynthesisUtterance:Utter,document:{addEventListener(){},removeEventListener(){}},setTimeout(fn,ms){if(ms<100)timers.push(fn);return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},console};
  vm.createContext(ctx); vm.runInContext(source,ctx);
  ctx.window.KakaSpeech.speakTerm('月亮',{lang:'zh-CN',requireMandarinVoice:strict,delayMs:0,onUnavailable(){unavailable++},onEnd(){end++}});
  while(timers.length)timers.shift()();
  if (loadAfterFirst) {
    voices.push({name:'Tingting',lang:'zh-CN'});
    ctx.window.KakaSpeech.speakTerm('月亮',{lang:'zh-CN',requireMandarinVoice:true,delayMs:0,onUnavailable(){unavailable++}});
    while(timers.length)timers.shift()();
  }
  return {spoken,unavailable,end};
}
let r=run([{name:'Sinji Cantonese',lang:'zh-HK'}]); assert.equal(r.spoken.length,0); assert.equal(r.unavailable,1); assert.equal(r.end,1);
r=run([{name:'Cantonese',lang:'zh-CN'}]); assert.equal(r.spoken.length,0); assert.equal(r.unavailable,1);
r=run([{name:'Sinji Cantonese',lang:'zh-HK'},{name:'Tingting',lang:'zh-CN'}]); assert.equal(r.spoken[0].voice.name,'Tingting');
r=run([{name:'Meijia',lang:'zh-TW'}]); assert.equal(r.spoken[0].voice.name,'Meijia');
r=run([],true,true); assert.equal(r.unavailable,1); assert.equal(r.spoken[0].voice.name,'Tingting');
r=run([],false); assert.equal(r.spoken.length,1); assert.equal(r.unavailable,0);
console.log('Mandarin voice selection and no unsafe fallback passed');
