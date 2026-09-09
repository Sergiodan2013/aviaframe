(function(){
  function getLang(){ try{ return localStorage.getItem('aviaframe-lang')||'en'; }catch(e){ return 'en'; } }
  function setLang(l){ try{ localStorage.setItem('aviaframe-lang',l); }catch(e){} }

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
    var en = document.getElementById('legal-content-en');
    var ar = document.getElementById('legal-content-ar');
    if(en) en.hidden = (lang==='ar');
    if(ar) ar.hidden = (lang!=='ar');
    setLang(lang);
    var btn = document.getElementById('legal-lang-toggle');
    if(btn){
      btn.querySelectorAll('.lt-opt').forEach(function(o){
        o.classList.toggle('lt-active', o.getAttribute('data-l')===lang);
      });
    }
  }

  var currentLang = getLang();

  document.addEventListener('DOMContentLoaded', function(){
    applyLang(currentLang);
    var btn = document.getElementById('legal-lang-toggle');
    if(btn) btn.addEventListener('click', function(){
      currentLang = currentLang==='en' ? 'ar' : 'en';
      applyLang(currentLang);
    });
  });
  if(document.readyState !== 'loading') applyLang(currentLang);
})();
