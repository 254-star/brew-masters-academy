/* Fills the page from content/site.json (edited with admin/config.yml).
   If the file cannot be loaded, the text already written in index.html stays in place. */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var SVG='http://www.w3.org/2000/svg';
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function icon(id){var s=document.createElementNS(SVG,'svg');s.setAttribute('class','ic');s.setAttribute('aria-hidden','true');var u=document.createElementNS(SVG,'use');u.setAttribute('href','#'+id);s.appendChild(u);return s}
function setText(sel,t){var e=$(sel);if(e&&typeof t==='string'&&t.trim())e.textContent=t}
function safeSlug(s){return /^[a-z0-9][a-z0-9-]*$/i.test(s||'')?s:''}
function safeImagePath(s){return /^\/images\/[a-z0-9_./-]+\.(?:webp|png|jpe?g)$/i.test(s||'')&&!s.includes('..')?s:''}
function courseId(c){return safeSlug(c.id)||safeSlug(c.title)||'course'}
function courseImage(s){var image=safeImagePath(s),slug=safeSlug(s);return image||(slug?'/images/client-gallery/thumbs/'+slug+'.webp':'')}
function durationValue(s){var m=/^\s*(\d+)\s*(day|week|month)s?\s*$/i.exec(s||'');return m?'P'+m[1]+({day:'D',week:'W',month:'M'}[m[2].toLowerCase()]):''}
function priceValue(s){var m=/^\s*(?:KSh\s*)?([\d,]+)(\.\d{1,2})?\s*$/i.exec(s||'');return m?m[1].replace(/,/g,'')+(m[2]||''):''}
function gallerySources(item){
  var slug=safeSlug(item.slug),full=safeImagePath(item.image)||(slug?'/images/client-gallery/large/'+slug+'.webp':'');
  return {full:full,thumb:safeImagePath(item.thumbnail)||full};
}
function galleryButton(item,cls){
  var source=gallerySources(item);if(!source.full)return null;
  var button=el('button',cls);button.type='button';button.setAttribute('data-full',source.full);button.setAttribute('aria-haspopup','dialog');
  var image=document.createElement('img');image.src=source.thumb;image.width=item.w||720;image.height=item.h||960;image.alt=item.alt||'';image.loading='lazy';image.decoding='async';
  button.appendChild(image);return button;
}
function updateCourseSchemas(courses){
  var entries=courses.map(function(c){
    var entry={'@type':'Course','name':c.title||'','description':c.desc||''};
    var duration=durationValue(c.duration),price=priceValue(c.fee),id=courseId(c);
    if(duration)entry.timeRequired=duration;
    entry.provider={'@id':'https://www.brewmastersacademy.co.ke/#brew-masters-coffee-academy'};
    entry.url='https://www.brewmastersacademy.co.ke/barista-courses/#'+id;
    if(price)entry.offers={'@type':'Offer','price':price,'priceCurrency':'KES','url':entry.url};
    return entry;
  });
  var home=$('#homeCourseSchema');
  if(home){var homeData=JSON.parse(home.textContent);homeData.hasCourse=entries;home.textContent=JSON.stringify(homeData)}
  var detail=$('#coursePageSchema');
  if(detail){var detailData=JSON.parse(detail.textContent);detailData['@graph']=entries;detail.textContent=JSON.stringify(detailData)}
}
var ICONS=['i-cup','i-cap','i-brief','i-users'];

function render(c){
  var alt={};(c.gallery||[]).forEach(function(g){var image=safeImagePath(g.image),thumbnail=safeImagePath(g.thumbnail);if(image)alt[image]=g.alt||'';if(thumbnail)alt[thumbnail]=g.alt||'';var slug=safeSlug(g.slug);if(slug)alt[slug]=g.alt||''});
  if(c.hero){setText('.hero h1',c.hero.headline);setText('.hero .lead',c.hero.lead)}

  var p=c.programs;
  if(p){
    setText('.courses-intro h2',p.heading);setText('.courses-intro > p:not(.eyebrow)',p.intro);
    var wrap=$('#courseCards');
    if(wrap&&p.courses&&p.courses.length){
      wrap.textContent='';
      p.courses.forEach(function(k,i){
        var a=el('article','card');
        var ci=el('div','card-img');
        var image=courseImage(k.photo);
        if(image){var im=document.createElement('img');im.src=image;im.width=720;im.height=960;im.alt=alt[image]||k.title||'';im.loading='lazy';im.decoding='async';im.style.objectPosition=/^\d+% \d+%$/.test(k.pos||'')?k.pos:'50% 25%';ci.appendChild(im)}
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
        var requested=new URLSearchParams(window.location.search).get('program');
        if(requested)Array.prototype.some.call(sel.options,function(option){
          if(option.value===requested||option.textContent===requested){sel.value=option.value;return true}
          return false;
        });
      }
      updateCourseSchemas(p.courses);
    }
  }

  var detailGrid=$('#courseCardsDetail');
  if(detailGrid&&p&&p.courses&&p.courses.length){
    detailGrid.textContent='';
    p.courses.forEach(function(k){
      var id=courseId(k),title=k.title||'',query='/?program='+encodeURIComponent(title)+'#contact';
      var card=el('article','card');card.id=id;
      var body=el('div','card-body');body.appendChild(el('h2',null,title));body.appendChild(el('p',null,k.desc||''));
      if(k.duration){var facts=el('ul','facts');facts.appendChild(el('li',null,'Duration: '+k.duration));body.appendChild(facts)}
      if(k.fee)body.appendChild(el('p','price',k.fee));
      var link=el('a','btn sm',k.button==='Enroll'?'Enquire about this course':'Ask about this training');link.href=query;body.appendChild(link);
      card.appendChild(body);detailGrid.appendChild(card);
    });
    var first=p.courses[0],primary=$('.detail-hero .detail-actions .btn');
    if(first&&primary)primary.href='/?program='+encodeURIComponent(first.title||'')+'#contact';
    updateCourseSchemas(p.courses);
  }

  var a=c.about;
  if(a){
    setText('.about-text h2',a.heading);
    var aboutImage=$('.about-photo img'),aboutSrc=safeImagePath(a.image);
    if(aboutImage&&aboutSrc){aboutImage.src=aboutSrc;if(typeof a.image_alt==='string')aboutImage.alt=a.image_alt}
    if(a.paragraphs&&a.paragraphs.length){
      var box=$('.about-text'),btn2=$('.btn',box);
      Array.prototype.slice.call(box.querySelectorAll(':scope > p:not(.eyebrow)')).forEach(function(x){x.remove()});
      a.paragraphs.forEach(function(t){if(t&&t.trim())box.insertBefore(el('p',null,t),btn2)});
    }
  }

  var s=c.consulting;
  if(s){
    setText('.consult h2',s.heading);setText('.consult .lead-dark',s.intro);
    var consultingImage=$('.consult-photo img'),consultingSrc=safeImagePath(s.image);
    if(consultingImage&&consultingSrc){consultingImage.src=consultingSrc;if(typeof s.image_alt==='string')consultingImage.alt=s.image_alt}
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
  var mosaic=$('#galleryMosaic');
  if(g&&g.length&&mosaic){
    mosaic.textContent='';
    g.slice(0,5).forEach(function(it){var button=galleryButton(it,'g-btn');if(button)mosaic.appendChild(button)});
  }
  if(g&&g.length&&grid){
    grid.textContent='';
    g.forEach(function(it){
      var source=gallerySources(it);if(!source.full)return;
      var li=el('li','g-item');li.dataset.w=it.w||3;li.dataset.h=it.h||4;
      var button=galleryButton(it,'g-btn');li.appendChild(button);grid.appendChild(li);
    });
    window.__bmContent=true;
    document.dispatchEvent(new Event('bm:content'));
  }
}

fetch('/content/site.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(render).catch(function(){});
})();
