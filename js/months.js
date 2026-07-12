// ── MONTH MANAGEMENT ───────────────────────────────────────────────────────
function addMonth(){
  var now = new Date();
  var suggestions = [];
  for(var i=0;i<12;i++){
    var d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    var k = MONTH_NAMES[d.getMonth()]+" "+d.getFullYear();
    if(!STATE.months[k]) suggestions.push(k);
  }
  var label = suggestions.length ? suggestions[0] : "";
  var input = prompt("New month name:", label);
  if(!input || !input.trim()) return;
  var key = input.trim();
  // Automatically carry over subcategory structure from current month (reset spent)
  ensureMonth(key, activeData().bd);
  STATE.activeMonth = key;
  renderMonthTabs();
  loadMonthIntoUI();
  render();
  saveState();
}

function switchMonth(key){
  STATE.activeMonth = key;
  loadMonthIntoUI();
  render();
  if(CURRENT_TAB==='income'){ renderWeightInputs(); updateIncomePreview(); }
  saveState();
}

function loadMonthIntoUI(){
  var d = activeData();
  if(!d) return;
  // Restore per-check amount (not monthly total)
  var incEl = $id("incIn");
  if(incEl) incEl.value = d.perCheck || "";
  // Restore pay frequency
  var freqEl = document.getElementById('payFreq');
  if(freqEl && d.payFreq) freqEl.value = d.payFreq;
  syncCatDropdown();
}

function renderMonthTabs(){
  var keys = Object.keys(STATE.months);
  var containers = [$id('monthTabs'), $id('monthTabsMobile'), $id('monthTabsMobileTx')].filter(Boolean);
  containers.forEach(function(el){
    el.innerHTML = '';
    for(var i=0;i<keys.length;i++){
      (function(k){
        var wrap = document.createElement('div');
        wrap.className = 'mtab-wrap';

        var btn = document.createElement('button');
        btn.className = 'mtab' + (k===STATE.activeMonth ? ' active' : '');
        btn.textContent = k;
        btn.onclick = function(){ switchMonth(k); };
        wrap.appendChild(btn);

        if(keys.length > 1){
          var del = document.createElement('button');
          del.className = 'mtab-del';
          del.title = 'Delete month';
          del.innerHTML = '&#10005;';
          del.onclick = function(e){
            e.stopPropagation();
            deleteMonth(k);
          };
          wrap.appendChild(del);
        }

        el.appendChild(wrap);
      })(keys[i]);
    }
  });
}

function deleteMonth(key){
  if(!confirm('Delete "'+key+'" and ALL its data? This cannot be undone.')) return;
  // Fully wipe this month
  delete STATE.months[key];
  // If we deleted the active month, switch to another
  if(STATE.activeMonth === key){
    var remaining = Object.keys(STATE.months);
    if(remaining.length){
      STATE.activeMonth = remaining[remaining.length-1];
    } else {
      // No months left - create a fresh one
      var now = new Date();
      STATE.activeMonth = MONTH_NAMES[now.getMonth()]+' '+now.getFullYear();
      ensureMonth(STATE.activeMonth, null);
    }
  }
  loadMonthIntoUI();
  render();
  if(CURRENT_TAB==='income'){ renderWeightInputs(); updateIncomePreview(); }
  saveState();
}
