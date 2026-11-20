// All sounds are synthesized locally after a user gesture. The scene is silent by default.
(() => {
  const toggle=document.getElementById("sound");
  const Audio=window.AudioContext || window.webkitAudioContext;
  if(!Audio){toggle.disabled=true;return;}
  let audio, volume, breeze, phraseTimer;

  function prepare(){
    audio=new Audio();
    volume=audio.createGain();
    volume.gain.value=.095;
    volume.connect(audio.destination);
    const wind=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);
    const data=wind.getChannelData(0);
    let value=0;
    for(let i=0;i<data.length;i++){
      value=(value+.07*(Math.random()*2-1))/1.04;
      data[i]=value*3;
    }
    const loop=audio.createBufferSource();
    loop.buffer=wind;loop.loop=true;
    breeze=audio.createBiquadFilter();
    breeze.type="lowpass";breeze.Q.value=.35;
    loop.connect(breeze).connect(volume);
    loop.start();
  }
  function tone(from,to,start,length,level,type="sine"){
    if(!audio || audio.state!=="running")return;
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(from,start);
    oscillator.frequency.exponentialRampToValueAtTime(to,start+length);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(level,start+length*.22);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    oscillator.connect(gain).connect(volume);
    oscillator.start(start);oscillator.stop(start+length+.02);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function phrase(){
    clearTimeout(phraseTimer);
    if(!toggle.checked || document.hidden || audio?.state!=="running")return;
    const district=document.body.dataset.district;
    const rain=document.body.classList.contains("rainy"),now=audio.currentTime+.02;
    breeze.frequency.setTargetAtTime(rain?2300:district==="quay"?1450:640,now,.8);
    if(!rain){
      if(district==="quay"){
        tone(365,360,now,1.5,.14);
        tone(730,716,now+.01,.7,.045);
      }else{
        const pitch=district==="orchard"?2350:1710;
        tone(pitch,pitch*1.3,now,.13,.17);
        tone(pitch*1.33,pitch*.94,now+.16,.15,.12);
      }
    }
    phraseTimer=setTimeout(phrase,5000+Math.random()*5500);
  }
  async function synchronize(){
    clearTimeout(phraseTimer);
    if(!toggle.checked || document.hidden){
      if(audio?.state==="running")await audio.suspend();
      return;
    }
    try{
      if(!audio)prepare();
      await audio.resume();
      phrase();
    }catch{toggle.checked=false;}
  }
  toggle.onchange=synchronize;
  document.addEventListener("visibilitychange",synchronize);
  document.addEventListener("valley-visit",()=>{if(toggle.checked)phrase();});
  window.addEventListener("pagehide",()=>{
    clearTimeout(phraseTimer);
    if(audio)void audio.suspend();
  });
  window.addEventListener("pageshow",()=>{if(toggle.checked)void synchronize();});
})();
