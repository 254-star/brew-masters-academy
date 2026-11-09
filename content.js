/* Fills the page from content/site.json (edited with admin/index.html).
   If the file cannot be loaded, the text already written in index.html stays in place. */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var SVG='http://www.w3.org/2000/svg';
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function icon(id){var s=document.createElementNS(SVG,'svg');s.setAttribute('class','ic');s.setAttribute('aria-hidden','true');var u=document.createElementNS(SVG,'use');u.setAttribute('href','#'+id);s.appendChild(u);return s}
function setText(sel,t){var e=$(sel);if(e&&typeof t==='string'&&t.trim())e.textContent=t}
function safeSlug(s){return /^[a-z0-9][a-z0-9-]*$/i.test(s||'')?s:''}
var ICONS=['i-cup','i-cap','i-brief','i-users'];

function render(c){
  var alt={};(c.gallery||[]).forEach(function(g){alt[g.slug]=g.alt});
  if(c.hero){setText('.hero h1',c.hero.headline);setText('.hero .lead',c.hero.lead)}

  var p=c.programs;
  if(p){
    setText('.courses-intro h2',p.heading);setText('.courses-intro > p:not(.eyebrow)',p.intro);
    var wrap=$('#courseCards');
    if(wrap&&p.courses&&p.courses.length){
      wrap.textContent='';
      p.courses.forEach(function(k,i){
        var slug=safeSlug(k.photo);
        var a=el('article','card');
        var ci=el('div','card-img');
        if(slug){var im=document.createElement('img');im.src='images/client-gallery/thumbs/'+slug+'.webp';im.width=720;im.height=960;im.alt=alt[slug]||k.title||'';im.loading='lazy';im.style.objectPosition=/^\d+% \d+%$/.test(k.pos||'')?k.pos:'50% 25%';ci.appendChild(im)}
        a.appendChild(ci);
        var b=el('span','ic-badge');b.appendChild(icon(ICONS[i%ICONS.length]));a.appendChild(b);
        var body=el('div','card-body');
        body.appendChild(el('h3',null,k.title||''));
        body.appendChild(el('p',null,k.desc||''));
        if(k.duration||k.fee){
          var ul=el('ul','facts');
          if(k.duration){var li=el('li');li.appendChild(icon('i-clock'));li.appendChild(document.createTextNode(k.duration));ul.appendChild(li)}
          if(k.fee){var l2=el('li');l2.appendChild(el('strong',null,k.fee));ul.appendChild(l2)}
          body.appendChild(ul);
        }
        var btn=el('a','btn sm');btn.href='#contact';btn.setAttribute('data-program',k.title||'');
        btn.appendChild(document.createTextNode(k.button||'Enquire'));btn.appendChild(icon('i-arrow'));
        body.appendChild(btn);a.appendChild(body);wrap.appendChild(a);
      });
      /* keep the form's course list in step with the courses */
      var sel=$('#program');
      if(sel){
        sel.textContent='';
        var o=document.createElement('option');o.value='';o.textContent='Select an option';sel.appendChild(o);
        p.courses.map(function(k){return k.title}).concat(['Consulting','Something else']).forEach(function(t){var x=document.createElement('option');x.textContent=t;sel.appendChild(x)});
      }
    }
  }

  var a=c.about;
  if(a){
    setText('.about-text h2',a.heading);
    if(a.paragraphs&&a.paragraphs.length){
      var box=$('.about-text'),btn2=$('.btn',box);
      Array.prototype.slice.call(box.querySelectorAll(':scope > p:not(.eyebrow)')).forEach(function(x){x.remove()});
      a.paragraphs.forEach(function(t){if(t&&t.trim())box.insertBefore(el('p',null,t),btn2)});
    }
  }

  var s=c.consulting;
  if(s){
    setText('.consult h2',s.heading);setText('.consult .lead-dark',s.intro);
    var ul2=$('.consult .srv');
    if(ul2&&s.services&&s.services.length){
      ul2.textContent='';
      s.services.forEach(function(v,i){
        var li=el('li');var ic=el('span','line-ic');ic.appendChild(icon(ICONS[i%ICONS.length]));li.appendChild(ic);
        var d=el('div');d.appendChild(el('h3',null,v.title||''));d.appendChild(el('p',null,v.desc||''));li.appendChild(d);ul2.appendChild(li);
      });
    }
  }

  var g=c.gallery,grid=$('#gGrid');
  if(g&&g.length&&grid){
    grid.textContent='';
    g.forEach(function(it){
      var slug=safeSlug(it.slug);if(!slug)return;
      var li=el('li','g-item');li.dataset.w=it.w||3;li.dataset.h=it.h||4;
      var b=el('button','g-btn');b.type='button';b.setAttribute('data-full','images/client-gallery/large/'+slug+'.webp');b.setAttribute('aria-haspopup','dialog');
      var im=document.createElement('img');im.src='images/client-gallery/thumbs/'+slug+'.webp';im.width=it.w||720;im.height=it.h||960;im.alt=it.alt||'';im.loading='lazy';im.decoding='async';
      b.appendChild(im);li.appendChild(b);grid.appendChild(li);
    });
    window.__bmContent=true;
    document.dispatchEvent(new Event('bm:content'));
  }
}

fetch('content/site.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(render).catch(function(){});
})();
