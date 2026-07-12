// ═══════════════════════════════════════════════════════════
// BUDGET PROFILES — synced across Dashboard & Income tab
// ═══════════════════════════════════════════════════════════
var BUDGET_PROFILES = [
  {
    id:'default', emoji:'', name:'Default', label:'50/15/25/10', weights:[50,15,25,10],
    tip:'The classic 50/15/25/10 split. A solid starting point for most people with steady income.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'balanced', emoji:'', name:'Balanced', label:'50/20/20/10', weights:[50,20,20,10],
    tip:'More investing, slightly less lifestyle. Great if you want to grow wealth without sacrificing fun.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'saver', emoji:'', name:'Aggressive Saver', label:'50/30/10/10', weights:[50,30,10,10],
    tip:'Maximize wealth-building. Cut lifestyle spending to fast-track your financial goals.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'debt', emoji:'', name:'Debt Crusher', label:'50/30/10/10', weights:[50,30,10,10],
    tip:'Use the Growth bucket for debt payments, NOT investing. Once debt-free, flip it to wealth-building.',
    catColors:['#ffffff','rgba(255,80,80,0.8)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'enjoy', emoji:'', name:'Enjoy Life', label:'40/15/35/10', weights:[40,15,35,10],
    tip:'Good if you live somewhere affordable. Make sure your essentials truly fit in 40%.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'highcost', emoji:'', name:'High Cost of Living', label:'60/15/15/10', weights:[60,15,15,10],
    tip:'Common in NYC, SF, Miami. High rent eats income — still invest what you can.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  },
  {
    id:'custom', emoji:'', name:'Custom', label:'Custom', weights:null,
    tip:'Set your own split using the sliders below.',
    catColors:['#ffffff','rgba(255,255,255,0.6)','rgba(255,255,255,0.4)','rgba(255,255,255,0.45)']
  }
];

var _activeProfileId = 'default';

function _getActiveProfile() {
  for (var i = 0; i < BUDGET_PROFILES.length; i++) {
    if (BUDGET_PROFILES[i].id === _activeProfileId) return BUDGET_PROFILES[i];
  }
  return BUDGET_PROFILES[0];
}

function _renderChips(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var html = '';
  for (var i = 0; i < BUDGET_PROFILES.length; i++) {
    var p = BUDGET_PROFILES[i];
    var sel = p.id === _activeProfileId;
    html += '<button onclick="selectBudgetProfile(\'' + p.id + '\')" style="'
      + 'display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;'
      + 'font-family:Inter,sans-serif;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .15s;border-style:solid;border-width:1.5px;'
      + (sel
          ? 'background:rgba(255,255,255,0.07);border-color:#ffffff;color:#ffffff;'
          : 'background:transparent;border-color:var(--border2);color:var(--muted2);')
      + '">' + p.emoji + ' ' + p.name + '</button>';
  }
  el.innerHTML = html;
}

function _renderBreakdown(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var p = _getActiveProfile();
  var d = activeData();
  var income = getIncome();
  if (!p || !p.weights) {
    el.innerHTML = '<p style="font-size:.8rem;color:var(--muted);margin:0;">Set your custom split using the sliders below.</p>';
    return;
  }
  var catFallback = ['Essentials','Growth','Lifestyle','Savings'];
  var html = '';
  for (var i = 0; i < 4; i++) {
    var w = p.weights[i];
    var col = p.catColors[i];
    var catName = (d && d.bd && d.bd[i]) ? d.bd[i].name : catFallback[i];
    var dollar = income > 0 ? ('<span style="font-size:.76rem;color:var(--muted);font-weight:400;"> — ' + money(Math.round(income * w / 100 * 100) / 100) + '</span>') : '';
    html += '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 14px;">'
      + '<div style="font-size:1.15rem;font-weight:800;color:' + col + ';">' + w + '%' + dollar + '</div>'
      + '<div style="font-size:.82rem;font-weight:700;color:#e8edf5;margin:3px 0 0;">' + catName + '</div>'
      + '</div>';
  }
  el.innerHTML = html;
}

function renderDashboardProfiles() {
  var p = _getActiveProfile();
  _renderChips('dashProfileChips');
  _renderBreakdown('dashProfileBreakdown');
  var tipEl = document.getElementById('dashProfileTip');
  if (tipEl) {
    if (p && p.tip) {
      tipEl.innerHTML = '<span style="color:rgba(255,255,255,0.45);font-weight:600;">' + p.emoji + ' ' + p.name + ': </span><span style="color:#8a96b0;">' + p.tip + '</span>';
      tipEl.style.display = 'block';
    } else { tipEl.style.display = 'none'; }
  }
  var badge = document.getElementById('dashProfileBadge');
  if (badge) { badge.textContent = p ? (p.emoji + ' ' + p.name) : ''; badge.style.display = p ? 'inline' : 'none'; }
}

function renderIncomeProfiles() {
  _renderChips('incomeProfileChips');
  var badge = document.getElementById('incomeProfileBadge');
  var p = _getActiveProfile();
  if (badge) { badge.textContent = p ? (p.emoji + ' ' + p.name) : ''; badge.style.display = p ? 'inline' : 'none'; }
}

function selectBudgetProfile(id) {
  _activeProfileId = id;
  var p = _getActiveProfile();
  if (p && p.weights) {
    WEIGHTS[0] = p.weights[0]; WEIGHTS[1] = p.weights[1];
    WEIGHTS[2] = p.weights[2]; WEIGHTS[3] = p.weights[3];
  }
  renderDashboardProfiles();
  renderIncomeProfiles();
  if (typeof renderWeightInputs === 'function') renderWeightInputs();
}

function applySelectedProfile() {
  var p = _getActiveProfile();
  if (p && p.weights) {
    WEIGHTS[0] = p.weights[0]; WEIGHTS[1] = p.weights[1];
    WEIGHTS[2] = p.weights[2]; WEIGHTS[3] = p.weights[3];
  }
  switchTab('income');
  setTimeout(function() {
    renderWeightInputs();
    renderIncomeProfiles();
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ffffff;color:#03120a;font-weight:700;font-size:.85rem;padding:10px 20px;border-radius:12px;z-index:9999;box-shadow:0 4px 20px rgba(255,255,255,0.14);white-space:nowrap;pointer-events:none;';
    toast.textContent = (p ? p.emoji + ' ' + p.name : 'Profile') + ' applied! Enter your income below.';
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
  }, 150);
}

// Wrap switchTab / saveIncomeToState so profile panels refresh at the right time.
// NOTE: this relies on switchTab (navigation.js) and saveIncomeToState (income.js)
// having already been defined, so profiles.js must load AFTER those two files.
var _origST_prof = switchTab;
switchTab = function(tab) {
  _origST_prof(tab);
  if (tab === 'dashboard') setTimeout(renderDashboardProfiles, 60);
  if (tab === 'income')    setTimeout(renderIncomeProfiles, 60);
};

var _origSITS_prof = saveIncomeToState;
saveIncomeToState = function() {
  _origSITS_prof();
  setTimeout(renderDashboardProfiles, 60);
};

setTimeout(function() { renderDashboardProfiles(); renderIncomeProfiles(); }, 700);
