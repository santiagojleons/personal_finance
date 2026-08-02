// ── TAB NAVIGATION ──────────────────────────────────────────────────────────
var CURRENT_TAB = 'dashboard';
var TAB_IDS = ['dashboard','transactions','add-expense','categories','income'];
var NAV_IDS = ['dashboard','transactions','categories','income'];

function switchTab(tab){
  CURRENT_TAB = tab;
  TAB_IDS.forEach(function(t){
    var el = document.getElementById('tab-'+t);
    if(el) el.style.display = (t===tab) ? 'flex' : 'none';
  });
  NAV_IDS.forEach(function(n){
    var el = document.getElementById('nav-'+n);
    if(el) el.classList.toggle('active', n===tab);
  });
  document.querySelectorAll('.side-item[id^="nav-"]').forEach(function(b){ b.classList.remove('active'); });
  var _sb=document.getElementById('nav-'+tab); if(_sb) _sb.classList.add('active');
  document.querySelectorAll('.mnav-btn').forEach(function(b){
    b.classList.remove('active');
    var p=b.querySelector('.mnav-pip'); if(p) p.style.display='none';
  });
  var _mb=document.getElementById('mnav-'+tab);
  if(_mb){ _mb.classList.add('active'); var _p=_mb.querySelector('.mnav-pip'); if(_p) _p.style.display='block'; }
  if(tab==='dashboard'){ render(); startDashTitleAnimation(); }
  else { stopDashTitleAnimation(); }
  if(tab==='categories') render();
  if(tab==='settings') showSettingsEmail();
  if(tab==='add-expense'){ aeInit(); renderRecentTx(); }
  if(tab==='transactions') render();
  if(tab==='income'){ loadMonthIntoUI(); renderWeightInputs(); updateIncomePreview(); }
  if(tab==='transactions'){ render(); }
  if(tab==='add-expense'){
    renderRecentTx();
    if(document.querySelectorAll('#addExpenseRows tr').length===0) addExpenseRow();
  }
}
