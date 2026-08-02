// ── MONTH MANAGEMENT ───────────────────────────────────────────────────────
function computeMonthSuggestions(){
  var now = new Date();
  var suggestions = [];
  for(var i=0;i<12;i++){
    var d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    var k = MONTH_NAMES[d.getMonth()]+" "+d.getFullYear();
    if(!STATE.months[k]) suggestions.push(k);
  }
  return suggestions;
}

// ── New Month modal (replaces native prompt(), which iOS Safari silently
//    blocks when the app is running as a home-screen standalone PWA) ──────
function openNewMonthModal(){
  var suggestions = computeMonthSuggestions();
  var label = suggestions.length ? suggestions[0] : "";
  var input = $id("nmInput");
  if(input) input.value = label;
  var el = $id("newMonthModal");
  if(el) el.classList.add("open");
  if(input) input.focus();
}

function closeNewMonthModal(){
  var el = $id("newMonthModal");
  if(el) el.classList.remove("open");
}

function confirmNewMonth(){
  var input = $id("nmInput");
  var val = input ? input.value : "";
  if(!val || !val.trim()){ closeNewMonthModal(); return; }
  var key = val.trim();
  // Automatically carry over subcategory structure from current month (reset spent)
  ensureMonth(key, activeData().bd);
  STATE.activeMonth = key;
  closeNewMonthModal();
  renderMonthTabs();
  loadMonthIntoUI();
  render();
  saveState();
}

// Backward-compatible name kept so any existing onclick="addMonth()" wiring
// (side nav "+ New Month" button) continues to work unchanged.
function addMonth(){
  openNewMonthModal();
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
            openDeleteMonthModal(k);
          };
          wrap.appendChild(del);
        }

        el.appendChild(wrap);
      })(keys[i]);
    }
  });
  renderMonthPickerDropdown();
}

// ── Month Picker dropdown (Dashboard header button) ───────────────────────
// Populates the <select> used by the "Select Month" control on the Home
// Screen dashboard and keeps it in sync with the active month.
function renderMonthPickerDropdown(){
  var sel = $id('dashMonthSelect');
  if(!sel) return;
  var keys = Object.keys(STATE.months);
  // Sort chronologically (by actual date, not alphabetically) so the
  // dropdown reads naturally regardless of insertion order.
  keys.sort(function(a,b){ return monthKeyToDate(a) - monthKeyToDate(b); });
  var opts = '';
  for(var i=0;i<keys.length;i++){
    var k = keys[i];
    opts += '<option value="'+k+'"'+(k===STATE.activeMonth?' selected':'')+'>'+k+'</option>';
  }
  sel.innerHTML = opts;
}

function monthKeyToDate(key){
  var parts = key.split(' ');
  var mi = MONTH_NAMES.indexOf(parts[0]);
  var yr = parseInt(parts[1],10) || 0;
  return new Date(yr, mi<0?0:mi, 1).getTime();
}

function onMonthPickerChange(){
  var sel = $id('dashMonthSelect');
  if(!sel || !sel.value) return;
  switchMonth(sel.value);
}

// ── Delete Month modal (replaces native confirm(), same iOS standalone-app
//    bug as prompt() — dialogs return instantly without ever showing) ─────
var PENDING_DELETE_MONTH = null;

function openDeleteMonthModal(key){
  PENDING_DELETE_MONTH = key;
  var msg = $id('delMonthMsg');
  if(msg) msg.textContent = 'Delete "'+key+'" and ALL its data? This cannot be undone.';
  var el = $id('deleteMonthModal');
  if(el) el.classList.add('open');
}

function closeDeleteMonthModal(){
  PENDING_DELETE_MONTH = null;
  var el = $id('deleteMonthModal');
  if(el) el.classList.remove('open');
}

function confirmDeleteMonth(){
  var key = PENDING_DELETE_MONTH;
  closeDeleteMonthModal();
  if(!key) return;
  deleteMonth(key);
}

function deleteMonth(key){
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
  renderMonthTabs();
  loadMonthIntoUI();
  render();
  if(CURRENT_TAB==='income'){ renderWeightInputs(); updateIncomePreview(); }
  saveState();
}
