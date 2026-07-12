// ── MONTHS LIST ────────────────────────────────────────────────────────────
var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function defaultBD(){
  // Empty subcategories on first setup — user builds their own
  return [
    {name:"Essentials",pct:0.50,pool:0,subs:[]},
    {name:"Growth",pct:0.15,pool:0,subs:[]},
    {name:"Lifestyle",pct:0.25,pool:0,subs:[]},
    {name:"Savings",pct:0.10,pool:0,subs:[]}
  ];
}

// STATE
var STATE; // loaded from localStorage or initialised fresh

function initState(){
  var now = new Date();
  var key = MONTH_NAMES[now.getMonth()]+" "+now.getFullYear();
  return {
    activeMonth: key,
    months: {}
  };
}

function ensureMonth(key, copyBudgetsFrom){
  if(!STATE.months[key]){
    // Auto-carry over structure from previous month if one exists, else use defaults
    var allKeys = Object.keys(STATE.months);
    var autoSource = copyBudgetsFrom || (allKeys.length > 0 ? STATE.months[allKeys[allKeys.length-1]].bd : null);
    var bd = autoSource ? JSON.parse(JSON.stringify(autoSource)) : defaultBD();
    // Reset spent amounts and pools — keep names and budgets
    for(var c=0;c<bd.length;c++){
      bd[c].pool=0;
      for(var s=0;s<bd[c].subs.length;s++) bd[c].subs[s].spent=0;
    }
    STATE.months[key]={income:0, bd: bd, txs:[]};
  }
}

function activeData(){
  var d = STATE.months[STATE.activeMonth];
  if(!d){ ensureMonth(STATE.activeMonth, null); d = STATE.months[STATE.activeMonth]; }
  return d;
}

async function saveState(){
  if(!currentUser) return;
  await sb.from('user_states').upsert({
    user_id: currentUser.id,
    state: STATE,
    updated_at: new Date()
  }, { onConflict: 'user_id' });
}

async function loadState(){
  if(!currentUser) return;
  try {
    const { data, error } = await sb.from('user_states')
      .select('state')
      .eq('user_id', currentUser.id)
      .single();
    if(data && data.state){
      STATE = data.state;
    } else {
      STATE = initState();
      ensureMonth(STATE.activeMonth, null);
    }
  } catch(e) {
    console.error('loadState error:', e);
    STATE = initState();
    ensureMonth(STATE.activeMonth, null);
  }
}
