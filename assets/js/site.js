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
  document.querySelectorAll('.wave').forEach(function(w){
    var n=72,s=7;for(var i=0;i<n;i++){s=(s*9301+49297)%233280;var r=s/233280;var h=18+Math.abs(Math.sin(i*.37))*55+r*27;var x=document.createElement('i');x.style.height=Math.min(100,h)+'%';w.appendChild(x);}
  });
})();
