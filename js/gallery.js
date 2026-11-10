(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

var PAGE=12;
var panel=$('#gallery-all'), grid=$('#gGrid'), moreBtn=$('#gMore'), statusEl=$('#gStatus'), toggle=$('#galleryToggle');
var items=[];
var shown=0;
var wired=false;

/* masonry: each item spans enough 8px rows for its image ratio */
function layout(){
  var colW=items.length?items[0].getBoundingClientRect().width:0;
  items.forEach(function(li){
    if(li.hidden) return;
    var w=+li.dataset.w||1,h=+li.dataset.h||1;
    var rows=Math.round((colW*h/w+16)/8);
    li.style.gridRowEnd='span '+rows;
  });
}
function render(){
  items.forEach(function(li,i){li.hidden=i>=shown});
  layout();
  statusEl.textContent='Showing '+Math.min(shown,items.length)+' of '+items.length+' photos';
  moreBtn.hidden=shown>=items.length;
}
function loadMore(){shown=Math.min(items.length,shown+PAGE);render()}
function setup(){
  items=$$('.g-item',grid);
  if(!items.length) return;
  shown=PAGE; render();
  if(!wired){
    wired=true;
    moreBtn.addEventListener('click',loadMore);
    if('ResizeObserver' in window) new ResizeObserver(layout).observe(grid);
    window.addEventListener('resize',layout);
    grid.addEventListener('load',layout,true);
  }
}
setup();
/* content.js rebuilds the grid from content/site.json, then asks for a refresh */
document.addEventListener('bm:content',setup);
if(window.__bmContent) setup();

/* View Gallery button: show or hide the full grid (open by default so it works without JS) */
if(toggle&&panel){
  toggle.addEventListener('click',function(){
    var open=panel.hidden; panel.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.firstChild.nodeValue=open?'Hide Gallery':'View Gallery';
    if(open){layout();panel.scrollIntoView({behavior:'smooth',block:'start'})}
  });
  toggle.firstChild.nodeValue='Hide Gallery';
}

/* lightbox: every .g-btn on the page is part of one set, de-duplicated by full-size URL */
var lb=$('#lightbox'), img=$('#lbImg'), spin=$('#lbSpin'), cap=$('#lbCap');
var list=[], idx=0, opener=null;
function build(){
  var seen={}; list=[];
  $$('.g-btn').forEach(function(b){
    var src=b.getAttribute('data-full'); if(!src||seen[src]) return;
    seen[src]=true; list.push({src:src,alt:($('img',b)||{}).alt||''});
  });
}
function show(i){
  idx=(i+list.length)%list.length;
  var it=list[idx];
  spin.classList.remove('off'); img.classList.remove('ready');
  img.onload=function(){spin.classList.add('off');img.classList.add('ready')};
  img.onerror=function(){spin.classList.add('off');cap.textContent='This photo could not be loaded.'};
  img.alt=it.alt; img.src=it.src;
  cap.textContent='';
  [1,-1].forEach(function(d){var n=list[(idx+d+list.length)%list.length];if(n){var p=new Image();p.src=n.src}});
}
function open(src,btn){
  build(); if(!list.length) return;
  var i=0; list.forEach(function(it,k){if(it.src===src)i=k});
  opener=btn;
  if(typeof lb.showModal==='function') lb.showModal(); else lb.setAttribute('open','');
  document.body.classList.add('lb-open');
  show(i);
  $('#lbClose').focus();
}
function close(){
  if(typeof lb.close==='function'&&lb.open) lb.close(); else lb.removeAttribute('open');
  document.body.classList.remove('lb-open');
  img.removeAttribute('src');
  if(opener) opener.focus();
}
document.addEventListener('click',function(e){
  var b=e.target.closest('.g-btn'); if(!b) return;
  e.preventDefault(); open(b.getAttribute('data-full'),b);
});
$('#lbClose').addEventListener('click',close);
$('#lbPrev').addEventListener('click',function(){show(idx-1)});
$('#lbNext').addEventListener('click',function(){show(idx+1)});
/* click outside the photo (on the dark backdrop) closes */
lb.addEventListener('click',function(e){
  if(e.target===lb||e.target.id==='lbStage') close();
});
lb.addEventListener('cancel',function(e){e.preventDefault();close()}); /* Escape */
document.addEventListener('keydown',function(e){
  if(!lb.hasAttribute('open')) return;
  if(e.key==='ArrowLeft'){e.preventDefault();show(idx-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();show(idx+1)}
  else if(e.key==='Escape'){e.preventDefault();close()}
});
/* swipe on touch screens */
var sx=null;
lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',function(e){
  if(sx===null) return;
  var dx=e.changedTouches[0].clientX-sx; sx=null;
  if(Math.abs(dx)>50) show(idx+(dx<0?1:-1));
},{passive:true});
})();
