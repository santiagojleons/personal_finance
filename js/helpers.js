// ── HELPERS ────────────────────────────────────────────────────────────────
function $id(id){ return document.getElementById(id); }
function money(n){ var v=parseFloat(n)||0; return "$"+v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
function getIncome(){ var d=activeData(); return d?d.income||0:0; }
function totalAssigned(bd){
  var subT=0;
  for(var c=0;c<bd.length;c++) for(var s=0;s<bd[c].subs.length;s++) subT+=bd[c].subs[s].budget;
  subT=Math.round(subT*100)/100;
  if(subT>0) return subT;
  // Fall back to sum of pools if no sub budgets assigned yet
  var poolT=0;
  for(var c=0;c<bd.length;c++) poolT+=(bd[c].pool||0);
  return Math.round(poolT*100)/100;
}

async function saveAndRender(){
  await saveState();
  render();
}
