(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var NAMES={today:'Today',podcast:'Podcast',inbox:'Inbox',coaching:'Coaching',speaking:'Speaking',newsletter:'Newsletter',circle:'Members circle',numbers:'Numbers'};
var t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);var tm;
function toast(m){t.textContent=m;t.classList.add('show');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('show')},3200)}
// date
var d=new Date();$$('[data-today]').forEach(function(e){e.textContent=d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})});
var h=d.getHours();var g=h<12?'Good morning':(h<17?'Good afternoon':'Good evening');var gh=$('#v-today h1');if(gh)gh.innerHTML=g+', <em>Katie.</em>';
// nav
function go(v,push){
  if(!NAMES[v])v='today';
  $$('.view').forEach(function(s){s.classList.toggle('on',s.id==='v-'+v)});
  $$('.snav [data-go], .tabs [data-go]').forEach(function(b){b.setAttribute('aria-current',b.dataset.go===v?'true':'false')});
  var more=['speaking','newsletter','circle','numbers'].indexOf(v)>-1;var mb=$('.tabs [data-more]');if(mb)mb.setAttribute('aria-current',more?'true':'false');
  $('#crumb').textContent='Inward Desk · '+NAMES[v];
  closeSheet();window.scrollTo({top:0});
  if(push!==false)history.replaceState(null,'','#'+v);
  if(v==='numbers')charts();
}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-go]');
  if(b){e.preventDefault();go(b.dataset.go);if(b.dataset.open)openMsg(b.dataset.open);return}
  var a=e.target.closest('[data-approve]');
  if(a){var c=a.closest('.appr');if(c)c.classList.add('approved');toast(a.dataset.approve+' (preview)');return}
  var tt=e.target.closest('[data-toast]');
  if(tt){e.preventDefault();toast(tt.dataset.toast);return}
});
// more sheet
var sheet=$('#sheet'),scrim=$('#scrim');
function closeSheet(){sheet.classList.remove('open');if(!chat.classList.contains('open'))scrim.classList.remove('on')}
$('.tabs [data-more]').addEventListener('click',function(){sheet.classList.add('open');scrim.classList.add('on')});
// todos
$$('.todo li').forEach(function(li){li.addEventListener('click',function(){li.classList.toggle('ok')})});
// episodes
$$('.ecard').forEach(function(c){c.addEventListener('click',function(){$$('.ecard').forEach(function(x){x.classList.remove('sel')});c.classList.add('sel');var h=$('.week-head .eb');if(h)h.textContent=c.dataset.ep+' · Example';})});
// inbox
var M=window.MSGS||{};var ibx=$('#ibx');
function esc(s){return s.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function openMsg(k){var m=M[k];if(!m)return;
  $$('.msg').forEach(function(x){x.classList.toggle('sel',x.dataset.msg===k)});
  var ini=m.n.split(' ').slice(0,2).map(function(w){return /[A-Za-z]/.test(w[0])?w[0]:''}).join('');
  var h='<button class="back" id="back"><svg class="ico" viewBox="0 0 24 24" width="16" height="16"><path d="M20 12H4M10 6l-6 6 6 6"/></svg>All messages</button>'+
  '<div class="who"><span class="av" style="background:var(--p3);color:var(--ink)">'+(ini||'—')+'</span><div><h2>'+esc(m.n)+'</h2><span class="eb">'+m.ch+' · '+m.t+' · '+(m.sens?'Personal':m.cat)+'</span></div></div>'+
  '<div class="bubble">'+esc(m.sn)+'</div>';
  if(m.sens){h+='<div class="sens"><span class="flag" style="background:#fff;color:#0a0a0a">For Katie personally</span><p>Your assistant doesn’t write replies to personal or sensitive messages — this one waits for you. If a message ever suggests someone may be in danger, you’re alerted straight away and they’re pointed to crisis support.</p><div class="bs" style="margin-top:16px"><button class="b sm" style="border-color:#fff;color:#fff" data-toast="Opens a blank reply for you to write (preview).">Write a reply</button><button class="b sm" style="border-color:#666;color:#fff" data-toast="Marked as read and kept private (preview).">Mark read</button></div></div>';}
  else{h+='<div class="draft"><span class="lb">Drafted in your voice</span><textarea aria-label="Draft reply">'+esc(m.dr)+'</textarea></div><div class="bs"><button class="b p" data-toast="Reply approved and sent to '+esc(m.n)+' (preview — nothing was sent).">Approve &amp; send</button><button class="b g" data-toast="Edit the draft above, then approve (preview).">Edit</button><button class="b g" data-toast="Archived (preview).">Archive</button></div><p class="mut" style="font-size:12px">Category: '+m.cat+'. Your assistant suggests replies; nothing is sent without your approval.</p>';}
  $('#det').innerHTML=h;ibx.classList.add('reading');
  var bk=$('#back');if(bk)bk.addEventListener('click',function(){ibx.classList.remove('reading')});
}
$$('.msg').forEach(function(b){b.addEventListener('click',function(){openMsg(b.dataset.msg)})});
openMsg('m1');ibx.classList.remove('reading');
$$('.filters button').forEach(function(f){f.addEventListener('click',function(){
  $$('.filters button').forEach(function(x){x.setAttribute('aria-pressed',x===f?'true':'false')});
  var v=f.dataset.f;$$('.msg').forEach(function(m){m.style.display=(v==='all'||(v==='sens'?m.dataset.sens==='1':m.dataset.ch===v))?'':'none'});
})});
// calendar (March, example)
var cal=$('#cal');if(cal){var hd=['S','M','T','W','T','F','S'],s='';hd.forEach(function(x){s+='<div class="h">'+x+'</div>'});
  var start=0;for(var i=0;i<start;i++)s+='<div></div>';
  for(var dd=1;dd<=31;dd++){var c=dd===12?'ho':(dd===19||dd===20?'x':(dd===27||dd===28?'o':''));s+='<div class="'+c+'">'+dd+'</div>'}cal.innerHTML=s;}
// charts
var drawn=false;
function svgLine(el,data,prev,opts){
  var W=560,H=210,p={l:34,r:8,t:12,b:24};var mx=Math.max.apply(null,data.concat(prev||[]))*1.12,mn=0;
  var x=function(i){return p.l+i*(W-p.l-p.r)/(data.length-1)},y=function(v){return p.t+(H-p.t-p.b)*(1-(v-mn)/(mx-mn))};
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+opts.label+'">';
  for(var k=0;k<=3;k++){var v=mn+(mx-mn)*k/3,yy=y(v);s+='<line x1="'+p.l+'" x2="'+(W-p.r)+'" y1="'+yy+'" y2="'+yy+'" stroke="#e6e6e6"/><text x="0" y="'+(yy+3)+'">'+(opts.fmt?opts.fmt(v):Math.round(v))+'</text>'}
  var path=function(arr){return arr.map(function(v,i){return(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)}).join(' ')};
  if(opts.area){s+='<path d="'+path(data)+' L'+x(data.length-1)+' '+(H-p.b)+' L'+x(0)+' '+(H-p.b)+'Z" fill="#0a0a0a" opacity=".06"/>'}
  if(prev)s+='<path d="'+path(prev)+'" fill="none" stroke="#9a9a9a" stroke-width="1.2" stroke-dasharray="3 4"/>';
  s+='<path class="ln" d="'+path(data)+'" fill="none" stroke="#0a0a0a" stroke-width="1.6"/>';
  data.forEach(function(v,i){if(i===data.length-1)s+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.5" fill="#0a0a0a"/>'});
  (opts.xl||[]).forEach(function(l,i){if(l)s+='<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle">'+l+'</text>'});
  el.innerHTML=s+'</svg>';
}
function svgBars(el,data,data2,labels,opts){
  var W=560,H=210,p={l:34,r:8,t:12,b:24};var tot=data.map(function(v,i){return v+(data2?data2[i]:0)});var mx=Math.max.apply(null,tot)*1.15;
  var n=data.length,bw=(W-p.l-p.r)/n;var y=function(v){return(H-p.t-p.b)*(v/mx)};
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+opts.label+'">';
  for(var k=0;k<=3;k++){var v=mx*k/3,yy=H-p.b-y(v);s+='<line x1="'+p.l+'" x2="'+(W-p.r)+'" y1="'+yy+'" y2="'+yy+'" stroke="#e6e6e6"/><text x="0" y="'+(yy+3)+'">'+(opts.fmt?opts.fmt(v):Math.round(v))+'</text>'}
  data.forEach(function(v,i){var x0=p.l+i*bw+bw*.28,w=bw*.44,h1=y(v),base=H-p.b;
    s+='<rect x="'+x0+'" y="'+(base-h1)+'" width="'+w+'" height="'+h1+'" fill="#0a0a0a"/>';
    if(data2){var h2=y(data2[i]);s+='<rect x="'+x0+'" y="'+(base-h1-h2-1)+'" width="'+w+'" height="'+h2+'" fill="#cfcfcf"/>'}
    s+='<text x="'+(x0+w/2)+'" y="'+(H-6)+'" text-anchor="middle">'+labels[i]+'</text>'});
  el.innerHTML=s+'</svg>';
}
function charts(){if(drawn)return;drawn=true;
  var wk=['','W2','','W4','','W6','','W8','','W10','','W12'];
  svgLine($('#ch-dl'),[1210,1290,1260,1380,1420,1405,1530,1580,1610,1690,1720,1810],[1050,1100,1120,1090,1180,1210,1190,1260,1300,1310,1350,1380],{label:'Weekly downloads, example data',xl:wk});
  svgLine($('#ch-sub'),[1820,1930,2050,2190,2332,2418],null,{label:'Subscribers, example data',area:true,xl:['Jun','Jul','Aug','Sep','Oct','Nov'],fmt:function(v){return (v/1000).toFixed(1)+'k'}});
  svgBars($('#ch-open'),[57,59,58,62,60,59,63,61],null,['24','25','26','27','28','29','30','31'],{label:'Open rate, example data',fmt:function(v){return Math.round(v)+'%'}});
  svgBars($('#ch-enq'),[4,5,6,7,8,9],[1,2,2,3,4,5],['Jun','Jul','Aug','Sep','Oct','Nov'],{label:'Enquiries, example data'});
}
// chat
var chat=$('#chat'),body=$('#cbody'),fab=$('#fab');
function add(txt,who){var m=document.createElement('div');m.className='cm '+who;m.innerHTML=txt;body.appendChild(m);body.scrollTop=body.scrollHeight;return m}
var R=[
 [/need|today|morning/i,'Here’s today:<ul><li>4 approvals — clips, the letter, quote cards, 5 replies (about 6 minutes)</li><li>Discovery call with Elena R. at 10:00</li><li>Client M. at 1:30 — prep is ready</li><li>1 personal message waiting just for you</li></ul>'],
 [/1:30|who is|client/i,'Client M. — session 4 of 8. Last time she committed to one honest no; this week she turned down a board seat. I’d open with how that felt in her body.'],
 [/episode|download|did/i,'Last week’s episode had 1,284 plays in 7 days — about 12% above your average. The clip about “performing” was the most shared.'],
 [/rachel|reply|draft/i,'Drafted: “Hi Rachel, thank you for thinking of Katie. March 12 is currently open — I’ve attached her speaker kit…” Want me to send it, or adjust the tone?'],
 [/letter|newsletter|email/i,'This week’s letter is drafted around “the life beneath the life”, going out Thursday at 7:00 am to 2,418 subscribers. Approve it from the Newsletter tab.']];
function reply(q){var ty=add('<span class="typing"><i></i><i></i><i></i></span>','a');setTimeout(function(){var r='In the live version I’d take care of that for you. This preview uses example data.';for(var i=0;i<R.length;i++)if(R[i][0].test(q)){r=R[i][1];break}ty.innerHTML=r;body.scrollTop=body.scrollHeight},900)}
function ask(q){if(!q.trim())return;add(esc(q),'u');reply(q)}
var seeded=false;
function openChat(){chat.classList.add('open');chat.setAttribute('aria-hidden','false');scrim.classList.add('on');if(!seeded){seeded=true;add('Good morning, Katie. Everything’s in order — four small approvals and one message I’ve kept for you personally. What would you like to do?','a')}setTimeout(function(){$('#cin').focus({preventScroll:true})},400)}
function closeChat(){chat.classList.remove('open');chat.setAttribute('aria-hidden','true');scrim.classList.remove('on')}
fab.addEventListener('click',openChat);$('#chat-x').addEventListener('click',closeChat);
scrim.addEventListener('click',function(){closeChat();closeSheet()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeChat();closeSheet()}});
$$('#sugg button').forEach(function(b){b.addEventListener('click',function(){ask(b.textContent)})});
$('#cform').addEventListener('submit',function(e){e.preventDefault();var i=$('#cin');ask(i.value);i.value=''});
window.openChat=openChat;
go((location.hash||'#today').slice(1),false);
})();
