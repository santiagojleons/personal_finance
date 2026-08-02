// ── RENDER ────────────────────────────────────────────────────────────────
function render(){
  var d=activeData();
  var income=d.income||0;
  var assigned=totalAssigned(d.bd);
  var unalloc=Math.round((income-assigned)*100)/100;
  var base=income>0?income:(assigned||1);

  renderMonthTabs();
  renderMonthPickerList();
  var _txLbl = document.getElementById('txMonthLabel');
  if(_txLbl) _txLbl.textContent = STATE.activeMonth;

  // OVERVIEW
  var ov="";
  for(var c=0;c<d.bd.length;c++){
    var cat=d.bd[c],b=0,sp=0;
    for(var s=0;s<cat.subs.length;s++){b+=cat.subs[s].budget;sp+=cat.subs[s].spent;}
    b=Math.round(b*100)/100; sp=Math.round(sp*100)/100;
    var left=Math.round((b-sp)*100)/100;
    var livePct=income>0?Math.round((b/income)*100):0;
    ov+='<div class="brow">'+
      '<div><div class="bname">'+cat.name+'<span class="bpct">'+livePct+'%</span></div>'+
      '<div class="blbl">Spent '+money(sp)+' of '+money(b)+'</div></div>'+
      '<div style="text-align:right"><strong class="'+(left>=0?'good':'bad')+'">'+money(left)+'</strong><div class="blbl">left</div></div>'+
    '</div>';
  }
  $id("overview").innerHTML=ov;

  // UNALLOCATED
  var uBox="";
  if(income>0){
    var isOver=unalloc<0;
    var hint=isOver
      ?"Over by "+money(Math.abs(unalloc))+". Reduce a subcategory budget."
      :unalloc===0?"Every dollar is allocated — nothing left unassigned."
      :"You have "+money(unalloc)+" left — consider Emergency Fund or Investing.";
    uBox='<div class="unalloc-box '+(isOver?'over':'ok')+'">'+
      '<div class="unalloc-label">Unallocated Income</div>'+
      '<div class="unalloc-amt '+(isOver?'over':'ok')+'">'+money(unalloc)+'</div>'+
      '<div class="unalloc-hint">'+hint+'</div>'+
    '</div>';
  }
  $id("unallocBox").innerHTML=uBox;

  // CATEGORY GRID
  var gr=""; var gr_full="";
  for(var c=0;c<d.bd.length;c++){
    var cat=d.bd[c],subTotal=0,sp=0;
    for(var s=0;s<cat.subs.length;s++){subTotal+=cat.subs[s].budget;sp+=cat.subs[s].spent;}
    subTotal=Math.round(subTotal*100)/100; sp=Math.round(sp*100)/100;
    // Always use pool as the category's assigned budget
    var dispAssigned = cat.pool||0;
    var unsubbed = Math.round((dispAssigned-subTotal)*100)/100; // pool not yet split into subs
    var remaining=Math.round((dispAssigned-sp)*100)/100;
    var livePct=income>0?Math.round((subTotal/income)*100):0;
    var pool=cat.pool;
    var poolLeft=Math.round((pool-subTotal)*100)/100;
    var poolPct=pool>0?Math.min(100,Math.round((subTotal/pool)*100)):0;
    var poolOver=pool>0&&subTotal>pool;

    // Editable subcards (Categories tab)
    var sc="";
    for(var s=0;s<cat.subs.length;s++){
      var sub=cat.subs[s];
      var sl=Math.round((sub.budget-sub.spent)*100)/100;
      var spPct=sub.budget>0?Math.min(100,Math.round(sub.spent/sub.budget*100)):0;
      var subOfCat=subTotal>0?Math.round((sub.budget/subTotal)*100):0;
      var spColor=sub.spent>0?'#f87171':'#6b7a99';
      var spAmt=sub.spent>0?'-'+money(sub.spent):'$0.00';
      sc+='<div class="scard" style="padding:10px 12px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">'+
          '<input class="name-inp" type="text" value="'+sub.name.replace(/"/g,'&quot;')+'" onchange="setSubName('+c+','+s+',this.value)" title="Rename" style="flex:1;"/>'+
          '<button class="xbtn" style="padding:3px 7px;font-size:.72rem;" onclick="deleteSub('+c+','+s+')" title="Delete">&times;</button>'+
        '</div>'+
        '<input class="budget-inp" type="number" min="0" step="0.01" value="'+sub.budget.toFixed(2)+'" onchange="setBudget('+c+','+s+',this.value)" style="margin-bottom:6px;"/>'+
        '<div class="prog-wrap" style="margin:0 0 6px;"><div class="prog-bar'+(sub.spent>sub.budget?' over':'')+'" style="width:'+spPct+'%"></div></div>'+
        '<div style="display:flex;justify-content:space-between;">'+
          '<span style="font-size:.74rem;color:#6b7a99;">'+spPct+'% spent</span>'+
          '<span style="font-size:.74rem;font-weight:600;color:'+spColor+';">'+spAmt+'</span>'+
        '</div>'+
      '</div>';
    }
    sc+=(function(){
      var presets = getPresets(cat.name);
      var existingNames = cat.subs.map(function(s){ return s.name.toLowerCase(); });
      var chips = '';
      for(var p=0;p<presets.length;p++){
        var taken = existingNames.indexOf(presets[p].toLowerCase()) !== -1;
        chips += '<button class="preset-chip'+(taken?' taken':'')+'" '+(taken?'disabled':'')+' onclick="quickAddSub('+c+',\''+presets[p].replace(/'/g,"\\'")+'\')">'+
          (taken?'&#10003; ':'+ ')+presets[p]+'</button>';
      }
      return '<div class="presets-wrap">'+
        '<div class="preset-label">Quick Add:</div>'+
        '<div class="preset-chips">'+chips+'</div>'+
      '</div>'+
      '<div class="add-sub-row">'+
        '<input class="add-sub-inp" id="newSubName-'+c+'" type="text" placeholder="Custom subcategory..." onkeydown="if(event.key===\'Enter\')addSub('+c+')"/>'+
        '<button class="gbtn sm" onclick="addSub('+c+')">+ Add</button>'+
      '</div>';
    })();

    // Read-only subcards (Dashboard tab)
    var sc_ro="";
    for(var s=0;s<cat.subs.length;s++){
      var sub=cat.subs[s];
      var sl=Math.round((sub.budget-sub.spent)*100)/100;
      var spPct=sub.budget>0?Math.min(100,Math.round(sub.spent/sub.budget*100)):0;
      var spColor=sub.spent>0?'#f87171':'#6b7a99';
      var spAmt=sub.spent>0?'-'+money(sub.spent):'$0.00';
      sc_ro+='<div class="scard" style="padding:10px 12px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'+
          '<span style="font-size:.82rem;font-weight:600;color:var(--text);">'+sub.name+'</span>'+
          '<span style="font-size:.8rem;font-weight:700;color:var(--text);">'+money(sub.budget)+'</span>'+
        '</div>'+
        '<div class="prog-wrap" style="margin:0 0 6px;"><div class="prog-bar'+(sub.spent>sub.budget?' over':'')+'" style="width:'+spPct+'%"></div></div>'+
        '<div style="display:flex;justify-content:space-between;">'+
          '<span style="font-size:.74rem;color:#6b7a99;">'+spPct+'% spent</span>'+
          '<span style="font-size:.74rem;font-weight:600;color:'+spColor+';">'+spAmt+'</span>'+
        '</div>'+
      '</div>';
    }

    // Dashboard card (read-only)
    gr+='<div class="ccard">'+
      '<div class="chead"><h3>'+cat.name+'</h3><span class="badge" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:#ffffff;">'+Math.round(dispAssigned>0?Math.min(100,Math.round(sp/dispAssigned*100)):0)+'% spent</span></div>'+


      '<div class="row"><span>Budget</span><strong>'+money(dispAssigned)+'</strong></div>'+
      '<div class="row"><span>Spent</span><strong>'+money(sp)+'</strong></div>'+
      '<div class="row"><span>Left to Spend</span><strong class="'+(remaining>=0?'good':'bad')+'">'+money(remaining)+'</strong></div>'+
      sc_ro+
    '</div>';

    // Categories card (editable)
    gr_full+='<div class="ccard">'+
      '<div class="chead"><h3>'+cat.name+'</h3><span class="badge" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:#ffffff;">'+Math.round(dispAssigned>0?Math.min(100,Math.round(sp/dispAssigned*100)):0)+'% spent</span></div>'+


      '<div class="row"><span>Category Budget</span><strong>'+money(dispAssigned)+'</strong></div>'+
      (cat.subs.length>0 ?
        '<div class="row"><span>Sub-budgeted</span><strong>'+money(subTotal)+'</strong></div>'+
        '<div class="row"><span style="color:'+(unsubbed<0?'#f87171':'#ffffff')+'">'+
          (unsubbed>=0?'Left to assign':'Over by')+'</span>'+
          '<strong class="'+(unsubbed>=0?'good':'bad')+'">'+money(Math.abs(unsubbed))+'</strong></div>'
      : '<div class="row" style="font-size:.75rem;color:var(--muted);"><span>Add subcategories below to split this budget</span></div>')+
      '<div class="row" style="margin-top:4px;border-top:1px solid var(--border2);padding-top:4px;"><span>Spent</span><strong>'+money(sp)+'</strong></div>'+
      '<div class="row"><span>Left to Spend</span><strong class="'+(remaining>=0?'good':'bad')+'">'+money(remaining)+'</strong></div>'+
      sc+
    '</div>';
  }
  $id("catGrid").innerHTML=gr;
  var cgf=document.getElementById('catGridFull'); if(cgf) cgf.innerHTML=gr_full;
  renderStatCards();

  // TRANSACTIONS
  if(!d.txs.length){ $id("txBody").innerHTML='<tr><td colspan="6" class="empty">No transactions yet.</td></tr>'; return; }
  var rows="";
  for(var i=0;i<d.txs.length;i++){
    var tx=d.txs[i];
    rows+='<tr>'+
      '<td>'+tx.name+'</td><td>'+tx.cat+'</td><td>'+tx.sub+'</td>'+
      '<td>'+tx.date+'</td><td>'+money(tx.amt)+'</td>'+
      '<td><div class="action-btns">'+
        '<button class="ebtn" onclick="openEdit(\''+tx.id+'\')">&#9998;</button>'+
        '<button class="xbtn" onclick="deleteTx(\''+tx.id+'\')">&#10005;</button>'+
      '</div></td>'+
    '</tr>';
  }
  $id("txBody").innerHTML=rows;
  // also populate mobile card view
  var _cards="";
  for(var i=0;i<d.txs.length;i++){
    var tx=d.txs[i];
    _cards+='<div class="tx-card"><div class="tx-card-top"><span class="tx-card-name">'+tx.name+'</span><span class="tx-card-amt">'+money(tx.amt)+'</span></div>'+
      '<div class="tx-card-meta">'+tx.cat+(tx.sub?' &middot; '+tx.sub:'')+' &middot; '+tx.date+'</div>'+
      '<div class="tx-card-actions"><button class="ebtn" onclick="openEdit(\'' + tx.id + '\')">Edit</button><button class="xbtn" onclick="deleteTx(\'' + tx.id + '\')">Del</button></div></div>';
  }
  var _tc=document.getElementById('txCards'); if(_tc) _tc.innerHTML=_cards;
  renderRecentTx();
}

function renderRecentTx(){
  var d=activeData();
  var el=document.getElementById('recentTxBody');
  if(!el) return;
  if(!d.txs.length){ el.innerHTML='<tr><td colspan="5" class="empty">No transactions yet.</td></tr>'; return; }
  var sorted=d.txs.slice().sort(function(a,b){ return b.date>a.date?1:b.date<a.date?-1:0; });
  var rows='';
  for(var i=0;i<sorted.length;i++){
    var tx=sorted[i];
    rows+='<tr style="border-bottom:1px solid var(--border);">'+
      '<td style="padding:8px 10px;font-size:.82rem;">'+tx.name+'</td>'+
      '<td style="padding:8px 10px;font-size:.8rem;color:var(--muted);">'+tx.cat+' · '+tx.sub+'</td>'+
      '<td style="padding:8px 10px;font-size:.8rem;color:var(--muted);">'+tx.date+'</td>'+
      '<td style="padding:8px 10px;font-size:.82rem;font-weight:700;color:#f87171;text-align:right;">-'+money(tx.amt)+'</td>'+
      '<td style="padding:8px 10px;text-align:right;"><button class="xbtn" style="padding:3px 8px;font-size:.72rem;" onclick="deleteTx(&quot;'+tx.id+'&quot;)">&times;</button></td>'+
    '</tr>';
  }
  el.innerHTML=rows;
  // mobile card view for recent transactions
  var _rc=''; var _rtc=document.getElementById('recentTxCards');
  if(_rtc){
    for(var _i=0;_i<sorted.length;_i++){
      var _t=sorted[_i];
      _rc+='<div class="tx-card"><div class="tx-card-top"><span class="tx-card-name">'+_t.name+'</span><span class="tx-card-amt">'+money(_t.amt)+'</span></div>'+
        '<div class="tx-card-meta">'+_t.cat+(_t.sub?' &middot; '+_t.sub:'')+' &middot; '+_t.date+'</div>'+
        '<div class="tx-card-actions"><button class="ebtn" onclick="openEdit(\'' + _t.id + '\')">Edit</button><button class="xbtn" onclick="deleteTx(\'' + _t.id + '\')">Del</button></div></div>';
    }
    _rtc.innerHTML=_rc;
  }
}

function renderStatCards(){
  var d = activeData();
  var income = d.income || 0;
  var assigned = totalAssigned(d.bd);
  var totalSpent = 0;
  for(var c=0;c<d.bd.length;c++) for(var s=0;s<d.bd[c].subs.length;s++) totalSpent += d.bd[c].subs[s].spent;
  totalSpent = Math.round(totalSpent*100)/100;

  // Key metrics
  var leftToSpend  = Math.round((assigned - totalSpent)*100)/100;   // budget - spent
  var unallocated  = Math.round((income - assigned)*100)/100;        // income - budgeted
  var spentPct     = assigned>0 ? Math.min(100,Math.round(totalSpent/assigned*100)) : 0;

  var label = document.getElementById('dashMonthLabel');
  if(label) label.textContent = STATE.activeMonth;

  // Card 1: Take-Home Income (anchor — always green)
  var c1 = '<div class="stat-card">'+
    '<div class="stat-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:middle;"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Take-Home Income</div>'+
    '<div class="stat-val green">'+money(income)+'</div>'+
    '<div class="stat-sub">Your net monthly pay</div>'+
  '</div>';

  // Card 2: Planned / Allocated (how much of income has a job)
  var allocPct = income>0 ? Math.round(assigned/income*100) : 0;
  var c2 = '<div class="stat-card">'+
    '<div class="stat-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>Planned Budget</div>'+
    '<div class="stat-val '+(assigned>0?'':'muted')+'">'+money(assigned)+'</div>'+
    '<div class="stat-sub">'+(unallocated>0 ? '<span style="color:var(--warn);">'+money(unallocated)+' still unplanned</span>' : unallocated<0 ? '<span style="color:var(--red);">Over-planned by '+money(Math.abs(unallocated))+'</span>' : '<span style="color:rgba(255,255,255,0.85);">Every dollar has a job</span>')+'</div>'+
  '</div>';

  // Card 3: Spent so far (red — signals real money gone)
  var spentColor = totalSpent===0 ? 'muted' : totalSpent>assigned ? 'red' : 'red';
  var c3 = '<div class="stat-card">'+
    '<div class="stat-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:middle;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Spent So Far</div>'+
    '<div class="stat-val '+spentColor+'">'+money(totalSpent)+'</div>'+
    '<div class="stat-sub" style="display:flex;flex-direction:column;gap:4px;">'+
      '<span>'+spentPct+'% of planned budget used</span>'+
      '<div style="height:4px;border-radius:4px;background:var(--border2);overflow:hidden;margin-top:2px;">'+
        '<div style="height:100%;border-radius:4px;background:'+(totalSpent>assigned?'var(--red)':'var(--red)')+';width:'+spentPct+'%;transition:width .4s;"></div>'+
      '</div>'+
    '</div>'+
  '</div>';

  // Card 4: Left to Spend (budget remaining — what they can still spend)
  var leftColor = leftToSpend<0 ? 'red' : leftToSpend===0 ? 'muted' : 'green';
  var leftLabel = leftToSpend<0 ? 'Over budget by '+money(Math.abs(leftToSpend)) : leftToSpend===0 ? 'Budget fully used' : 'Still available to spend';
  var c4 = '<div class="stat-card">'+
    '<div class="stat-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>Left to Spend</div>'+
    '<div class="stat-val '+leftColor+'">'+money(Math.abs(leftToSpend))+'</div>'+
    '<div class="stat-sub"><span style="color:'+(leftToSpend<0?'var(--red)':leftToSpend===0?'var(--muted)':'rgba(255,255,255,0.85)')+'">'+leftLabel+'</span></div>'+
  '</div>';

  var sr = document.getElementById('statRow');
  if(sr) sr.innerHTML = c1+c2+c3+c4;
}

// ── ANIMATED DASHBOARD TITLE ──────────────────────────────────────────────
var DASH_TITLE_PHRASES = [
  'Your Finances',
  'Your Savings',
  'Your Future',
  'Your Budget',
  'Your Goals'
];
var DASH_TITLE_INTERVAL = null;
var DASH_TITLE_IDX = 0;

function startDashTitleAnimation(){
  stopDashTitleAnimation();
  DASH_TITLE_IDX = 0;
  var el = document.getElementById('dashTitleText');
  if(el) el.textContent = DASH_TITLE_PHRASES[0];
  DASH_TITLE_INTERVAL = setInterval(function(){
    DASH_TITLE_IDX = (DASH_TITLE_IDX + 1) % DASH_TITLE_PHRASES.length;
    var el = document.getElementById('dashTitleText');
    if(!el) return;
    el.classList.remove('fade-in');
    el.classList.add('fade-out');
    setTimeout(function(){
      el.textContent = DASH_TITLE_PHRASES[DASH_TITLE_IDX];
      el.classList.remove('fade-out');
      el.classList.add('fade-in');
    }, 350);
  }, 2500);
}

function stopDashTitleAnimation(){
  if(DASH_TITLE_INTERVAL){
    clearInterval(DASH_TITLE_INTERVAL);
    DASH_TITLE_INTERVAL = null;
  }
}
