(function(){
'use strict';
/* Set this to your form service URL (for example a Formspree or Web3Forms endpoint) so enquiries reach your inbox.
   While it is empty the form validates but sends nothing, and says so honestly. */
var WEB3FORMS_KEY='45bff65e-b3d9-4b78-9b7a-2bddc766f7f5';   /* paste your free Web3Forms access key here (see README) */
var FORM_ENDPOINT=WEB3FORMS_KEY?'https://api.web3forms.com/submit':'';

var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

/* year */
var yr=$('#yr'); if(yr) yr.textContent=new Date().getFullYear();

/* mobile menu */
var menuBtn=$('#menuBtn'), nav=$('#nav');
function setMenu(open){
  nav.classList.toggle('open',open);
  menuBtn.setAttribute('aria-expanded',String(open));
  menuBtn.setAttribute('aria-label',open?'Close menu':'Open menu');
}
menuBtn.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menuBtn.focus()}});

/* smooth in-page links (also works inside preview frames) + preselect program */
document.addEventListener('click',function(e){
  var a=e.target.closest('a[href^="#"]'); if(!a) return;
  var id=a.getAttribute('href').slice(1); if(!id) return;
  var t=document.getElementById(id); if(!t) return;
  e.preventDefault();
  setMenu(false);
  if(a.hasAttribute('data-program')){
    var sel=$('#program'), v=a.getAttribute('data-program');
    if(sel){sel.value=v;if(sel.value!==v)sel.value=''}
  }
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var head=$('.site').offsetHeight;
  var y=t.getBoundingClientRect().top+window.pageYOffset-(id==='home'?0:head-1);
  window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  try{history.replaceState(null,'','#'+id)}catch(_){}
});

/* scrollspy */
var links=$$('.nav .l');
if('IntersectionObserver' in window){
  var map={};
  links.forEach(function(l){map[l.getAttribute('href').slice(1)]=l});
  var io=new IntersectionObserver(function(ents){
    ents.forEach(function(en){
      if(en.isIntersecting){
        links.forEach(function(l){l.classList.remove('on');l.removeAttribute('aria-current')});
        var l=map[en.target.id]; if(l){l.classList.add('on');l.setAttribute('aria-current','true')}
      }
    });
  },{rootMargin:'-40% 0px -55% 0px'});
  Object.keys(map).forEach(function(id){var s=document.getElementById(id); if(s) io.observe(s)});
}

/* form */
var form=$('#form'), status=$('#status'), send=$('#send');
function say(kind,msg){status.hidden=false;status.className=kind;status.textContent=msg}
function setErr(id,msg){
  var f=$('#'+id), e=$('#e-'+id); if(!f||!e) return;
  e.textContent=msg||'';
  if(msg) f.setAttribute('aria-invalid','true'); else f.removeAttribute('aria-invalid');
}
var loadedAt=Date.now();
function clean(v,max){return String(v||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim().slice(0,max)}
form.addEventListener('submit',function(ev){
  ev.preventDefault();
  var d=new FormData(form);
  if(d.get('website')) return; /* honeypot: bots fill the hidden field */
  if(Date.now()-loadedAt<2500){say('bad','Please take a moment to fill in the form, then send again.');return} /* too fast to be a person */
  try{var last=+sessionStorage.getItem('bm_last')||0;if(Date.now()-last<30000){say('info','Your enquiry was just sent. Please wait a little before sending another.');return}}catch(_){}
  ['name','email','phone','message','program'].forEach(function(k){if(d.has(k))d.set(k,clean(d.get(k),k==='message'?1500:120))});
  var name=(d.get('name')||'').trim(), email=(d.get('email')||'').trim(), msg=(d.get('message')||'').trim();
  var bad=false;
  setErr('name',name?'':'Please enter your name.'); if(!name) bad=true;
  var okMail=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  setErr('email',okMail?'':'Please enter a valid email address.'); if(!okMail) bad=true;
  setErr('message',msg?'':'Please write a short message.'); if(!msg) bad=true;
  if(bad){say('bad','Please fix the highlighted fields and try again.');var f=form.querySelector('[aria-invalid="true"]');if(f)f.focus();return}
  if(WEB3FORMS_KEY){d.append('access_key',WEB3FORMS_KEY);d.append('subject','New enquiry from the Brew Masters website');d.append('from_name','Brew Masters website');}
  if(!FORM_ENDPOINT){
    say('info','Thanks. This form is not connected to an inbox yet, so nothing was sent. Please call 0757 471 255 or email brewmasterscoffeeacademy@gmail.com in the meantime.');
    return;
  }
  send.disabled=true; send.textContent='Sending...'; say('info','Sending your enquiry...');
  fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json'},body:d})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok||j.success===false) throw new Error('bad');return j})})
    .then(function(){try{sessionStorage.setItem('bm_last',String(Date.now()))}catch(_){}form.reset();say('ok','Thank you. Your enquiry has been sent and we will get back to you.')})
    .catch(function(){say('bad','Sorry, your enquiry could not be sent. Please try again or call 0757 471 255.')})
    .then(function(){send.disabled=false;send.textContent='Send Enquiry'});
});
$$('#form input,#form textarea').forEach(function(f){f.addEventListener('input',function(){if(f.id&&$('#e-'+f.id))setErr(f.id,'')})});
})();
