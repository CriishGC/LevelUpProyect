(function(){
  function updateAuthUI(){
    try{
      var raw = localStorage.getItem('lvlup_user');
      var authButtons = document.querySelector('.auth-buttons');
      var profileLink = document.querySelector('.profile-link');
      var headerNombre = document.getElementById('header-nombre-usuario');

      if(raw){
        try{ var user = JSON.parse(raw); }catch(e){ user = null; }
        if(authButtons) authButtons.classList.add('d-none');
        if(profileLink) profileLink.classList.remove('d-none');
        if(headerNombre) headerNombre.textContent = (user && (user.nombre || user.correo)) || '';
      } else {
        if(authButtons) authButtons.classList.remove('d-none');
        if(headerNombre) headerNombre.textContent = '';
      }
    }catch(err){
      console.warn('Error actualizando UI de auth en header:', err);
    }
  }

  try{ updateAuthUI(); }catch(e){}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthUI);
  } else {
    setTimeout(updateAuthUI, 0);
  }

  window.addEventListener('storage', function(e){ if(e.key === 'lvlup_user') updateAuthUI(); });
})();
