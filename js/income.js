// ── INCOME ────────────────────────────────────────────────────────────────
var WEIGHTS=[50,15,25,10]; // stored as integers 0-100

function getMonthlyIncome(){
  var amt=parseFloat(document.getElementById('incIn')&&document.getElementById('incIn').value||0)||0;
  var freq=document.getElementById('payFreq')?document.getElementById('payFreq').value:'semimonthly';
  if(freq==='semimonthly') return Math.round(amt*2*100)/100;
  if(freq==='biweekly') return Math.round(amt*(26/12)*100)/100;
  return Math.round(amt*100)/100; // monthly
}

function updateIncomePreview(){
  var monthly=getMonthlyIncome();
  var el=document.getElementById('incomePreview');
  if(!el) return;
  if(!monthly){ el.style.display='none'; return; }
  var freq=document.getElementById('payFreq').value;
  var freqLabel=freq==='semimonthly'?'2 checks/month':freq==='biweekly'?'every 2 weeks (26/yr)':'1 check/month';
  el.style.display='block';
  el.innerHTML='<span style="color:#ffffff;font-weight:700;font-size:.95rem;">'+money(monthly)+'</span> <span style="color:var(--muted);">/month</span> &nbsp;·&nbsp; <span style="font-size:.76rem;">'+freqLabel+'</span>';
  updateWeightInputs();
}

function renderWeightSliders(){
  renderWeightInputs();
}

function renderWeightInputs(){
  var d=activeData();
  var el=document.getElementById('weightInputs');
  if(!el) return;
  var monthly=getMonthlyIncome()||getIncome();
  var html='<div style="display:grid;grid-template-columns:100px 80px 1fr 90px;gap:8px;align-items:center;margin-bottom:4px;">'+
    '<span style="font-size:.7rem;color:var(--muted);text-transform:uppercase;">Category</span>'+
    '<span style="font-size:.7rem;color:var(--muted);text-transform:uppercase;">%</span>'+
    '<span style="font-size:.7rem;color:var(--muted);text-transform:uppercase;">Amount/month</span>'+
    '<span></span>'+
  '</div>';
  for(var i=0;i<d.bd.length;i++){
    var amt=monthly?Math.round(monthly*(WEIGHTS[i]/100)*100)/100:0;
    html+='<div style="display:grid;grid-template-columns:100px 80px 1fr 90px;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">'+
      '<span style="font-size:.85rem;font-weight:600;color:var(--text);">'+d.bd[i].name+'</span>'+
      '<div style="display:flex;align-items:center;gap:4px;">'+
        '<input type="number" min="0" max="100" step="1" value="'+WEIGHTS[i]+'" oninput="updateWeightInput('+i+',this.value)" '+
          'style="width:50px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:5px 7px;font-size:.82rem;text-align:center;outline:none;" id="winput-'+i+'"/>'+
        '<span style="font-size:.78rem;color:var(--muted);">%</span>'+
      '</div>'+
      '<div style="height:6px;background:var(--border);border-radius:4px;overflow:hidden;">'+
        '<div style="height:100%;background:#ffffff;width:'+WEIGHTS[i]+'%;transition:width .2s;border-radius:4px;" id="wbar-'+i+'"></div>'+
      '</div>'+
      '<span style="font-size:.8rem;font-weight:600;color:var(--text);text-align:right;" id="wamt-'+i+'">'+money(amt)+'</span>'+
    '</div>';
  }
  el.innerHTML=html;
  updateWeightTotal();
}

function updateWeightInputs(){ renderWeightInputs(); }

function updateWeightInput(i,val){
  WEIGHTS[i]=Math.max(0,Math.min(100,parseInt(val)||0));
  var monthly=getMonthlyIncome()||getIncome();
  var amt=monthly?Math.round(monthly*(WEIGHTS[i]/100)*100)/100:0;
  var bar=document.getElementById('wbar-'+i);
  var amtEl=document.getElementById('wamt-'+i);
  if(bar) bar.style.width=WEIGHTS[i]+'%';
  if(amtEl) amtEl.textContent=money(amt);
  updateWeightTotal();
}

function updateWeightTotal(){
  var total=0; for(var i=0;i<WEIGHTS.length;i++) total+=parseInt(WEIGHTS[i])||0;
  var el=document.getElementById('weightTotal');
  if(!el) return;
  if(total===100){ el.textContent='Total: 100%'; el.style.color='#ffffff'; }
  else { el.textContent='Total: '+total+'% — needs to equal 100%'; el.style.color='#f87171'; }
}

function applyPreset(a,b,c,d){
  WEIGHTS=[a,b,c,d];
  renderWeightInputs();
}

function saveIncomeToState(){
  var monthly=getMonthlyIncome();
  if(monthly>0){
    var _d=activeData();
    _d.income=monthly;
    _d.perCheck=parseFloat(document.getElementById('incIn').value)||0;
    _d.payFreq=(document.getElementById('payFreq')?document.getElementById('payFreq').value:'monthly');
    saveState();
  }
}

function dismissBanner(){ var b=document.getElementById('setupBanner'); if(b) b.remove(); }

function applyTargets(){
  applyTargetsNew();
}

function applyTargetsNew(){
  var monthly=getMonthlyIncome();
  if(!monthly||monthly<=0){ alert("Enter your paycheck amount first."); return; }
  var total=0; for(var i=0;i<WEIGHTS.length;i++) total+=parseInt(WEIGHTS[i])||0;
  if(total!==100){ alert("Weights must total 100%. Currently: "+total+"%"); return; }
  var d=activeData();
  d.income=monthly;
  d.perCheck=parseFloat(document.getElementById('incIn').value)||0;
  d.payFreq=(document.getElementById('payFreq')?document.getElementById('payFreq').value:'monthly');
  for(var c=0;c<d.bd.length;c++){
    d.bd[c].pct=WEIGHTS[c]/100;
    d.bd[c].pool=Math.round(monthly*(WEIGHTS[c]/100)*100)/100;
    // Leave subcategory budgets for user to assign manually
  }
  // incIn already has the per-check value - keep it as is
  saveAndRender();
  // Redirect to categories with banner
  switchTab('categories');
  setTimeout(function(){
    var cgf=document.getElementById('catGridFull');
    if(!cgf) return;
    var existing=document.getElementById('setupBanner');
    if(existing) existing.remove();
    var banner=document.createElement('div');
    banner.id='setupBanner';
    banner.style.cssText='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);border-radius:14px;padding:18px 22px;margin-bottom:20px;';
    banner.innerHTML=
      '<div style="font-size:1rem;font-weight:700;color:#ffffff;margin-bottom:8px;">Budget applied — Now build your subcategories.</div>'+
      '<div style="font-size:.82rem;color:var(--muted);line-height:1.8;">'+
        'Use the <strong style="color:var(--text);">+ Add</strong> button to add subcategories, then set a budget for each one. Here are some examples:<br>'+
        '<strong style="color:var(--text);">Essentials:</strong> Rent · Electricity · Groceries · Internet · Insurance<br>'+
        '<strong style="color:var(--text);">Growth:</strong> S&amp;P 500 · Roth IRA · Robinhood · 401k<br>'+
        '<strong style="color:var(--text);">Lifestyle:</strong> Dining Out · Gym · Subscriptions · Shopping<br>'+
        '<strong style="color:var(--text);">Savings:</strong> Emergency Fund · Travel · Car Fund'+
      '</div>'+
      '<button onclick="dismissBanner()" style="margin-top:10px;background:none;border:none;color:var(--muted);font-size:.75rem;cursor:pointer;">Dismiss</button>';
    cgf.parentNode.insertBefore(banner, cgf);
  }, 300);
}
