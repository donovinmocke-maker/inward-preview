(function(){
  document.documentElement.classList.remove('no-js');
  var hdr=document.querySelector('.hdr');
  var dark=document.body.dataset.hero==='dark';
  function onScroll(){ if(!hdr) return; if(dark){hdr.classList.toggle('solid',window.scrollY>window.innerHeight*0.55);} }
  if(!dark&&hdr) hdr.classList.add('light-page');
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var b=document.querySelector('.burger');
  if(b) b.addEventListener('click',function(){var o=document.body.classList.toggle('menu-open');b.setAttribute('aria-expanded',o);});
  document.querySelectorAll('.mnav a').forEach(function(a){a.addEventListener('click',function(){document.body.classList.remove('menu-open');});});
  var els=document.querySelectorAll('.rv,.img-rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(e){io.observe(e);});
  } else els.forEach(function(e){e.classList.add('in');});
  var t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);
  var tm;function toast(m){t.textContent=m;t.classList.add('show');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('show');},3600);}
  document.querySelectorAll('form[data-preview]').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();toast(f.dataset.preview||'Preview only — this form is not connected yet.');});
  });
  document.querySelectorAll('[data-toast]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();toast(el.dataset.toast);});});

  /* Episode player: one shared audio element, streams from Katie's public podcast feed */
  var au=null,cur=null,bar=null;
  var PAUSE='<svg viewBox="0 0 14 16" aria-hidden="true"><path d="M1 0h4v16H1zM9 0h4v16H9z" fill="currentColor"/></svg>';
  function ensureBar(){ if(bar) return bar; bar=document.createElement('div'); bar.className='nowplaying'; bar.setAttribute('role','region'); bar.setAttribute('aria-label','Now playing');
    bar.innerHTML='<span class="np-l">Now playing</span><span class="np-t"></span><button class="np-x" aria-label="Stop">Stop</button>';
    document.body.appendChild(bar); bar.querySelector('.np-x').addEventListener('click',function(){ if(au){au.pause();} setState(null); bar.classList.remove('show'); }); return bar; }
  function setState(btn){ document.querySelectorAll('[data-audio]').forEach(function(b){ var on=(btn&&b.dataset.audio===btn.dataset.audio); b.classList.toggle('playing',on);
      if(b.classList.contains('play')){ if(!b._ico) b._ico=b.innerHTML; b.innerHTML=on?PAUSE:b._ico; } b.setAttribute('aria-pressed',on?'true':'false'); }); }
  document.querySelectorAll('[data-audio]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault();
      if(!au){ au=new Audio(); au.preload='none'; au.addEventListener('ended',function(){setState(null);}); }
      if(cur===b.dataset.audio && !au.paused){ au.pause(); setState(null); return; }
      if(cur!==b.dataset.audio){ au.src=b.dataset.audio; cur=b.dataset.audio; }
      au.play().then(function(){ setState(b); var x=ensureBar(); x.querySelector('.np-t').textContent=b.dataset.title||''; x.classList.add('show'); })
        .catch(function(){ toast('Couldn’t play this episode here. Try Spotify or Apple Podcasts.'); }); }); });
  document.querySelectorAll('.wave').forEach(function(w){
    var n=72,s=7;for(var i=0;i<n;i++){s=(s*9301+49297)%233280;var r=s/233280;var h=18+Math.abs(Math.sin(i*.37))*55+r*27;var x=document.createElement('i');x.style.height=Math.min(100,h)+'%';w.appendChild(x);}
  });
})();
