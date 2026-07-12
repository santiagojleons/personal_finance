// ── SUBCATEGORY MANAGEMENT ─────────────────────────────────────────────────
function setBudget(ci,si,val){
  var d=activeData();
  var income=d.income||0;
  var v=parseFloat(val); if(isNaN(v)||v<0) v=0;
  v=Math.round(v*100)/100;
  if(income>0){
    var other=0;
    for(var c=0;c<d.bd.length;c++) for(var s=0;s<d.bd[c].subs.length;s++) if(!(c===ci&&s===si)) other+=d.bd[c].subs[s].budget;
    var max=Math.round((income-other)*100)/100;
    if(v>max){ v=max<0?0:max; alert("Capped at "+money(v)+" — only "+money(max)+" of unallocated income remains."); }
  }
  d.bd[ci].subs[si].budget=v;
  saveAndRender();
}

function setSubName(ci,si,val){
  var d=activeData();
  d.bd[ci].subs[si].name=val.trim()||"Subcategory";
  saveState();
  syncCatDropdown();
}


var SUBCATEGORY_PRESETS = {
  'Essentials': ['Rent/Mortgage','Electricity','Water','Internet','Groceries','Gas','Car Insurance','Health Insurance','Phone Bill','Public Transit'],
  'Growth':     ['401k/IRA','Index Funds','Stocks','Crypto','Roth IRA','Emergency Fund Top-up','Side Business','Education/Courses'],
  'Lifestyle':  ['Dining Out','Coffee','Streaming Services','Gym','Hobbies','Shopping','Travel','Gaming','Personal Care','Subscriptions'],
  'Savings':    ['Emergency Fund','Vacation Fund','New Car','Down Payment','Holiday Gifts','Medical Fund','Home Repairs','Tech Upgrades'],
  'Housing':    ['Rent','Mortgage','HOA','Repairs','Furniture','Cleaning','Security','Parking'],
  'Transport':  ['Car Payment','Gas','Insurance','Maintenance','Uber/Lyft','Parking','Tolls','Public Transit'],
  'Health':     ['Health Insurance','Doctor Visits','Dentist','Gym','Medication','Mental Health','Vision'],
  'Food':       ['Groceries','Dining Out','Coffee','Meal Prep','Work Lunches','Snacks'],
  'Entertainment':['Streaming','Movies','Concerts','Sports','Books','Games','Hobbies'],
  'Personal':   ['Haircut','Skincare','Clothing','Shoes','Accessories','Spa/Massage'],
  '_default':   ['Bills','Subscriptions','Insurance','Miscellaneous','Other']
};

function getPresets(catName){
  var name = catName.toLowerCase();
  for(var key in SUBCATEGORY_PRESETS){
    if(key !== '_default' && name.indexOf(key.toLowerCase().split('/')[0]) !== -1){
      return SUBCATEGORY_PRESETS[key];
    }
  }
  return SUBCATEGORY_PRESETS['_default'];
}

function quickAddSub(ci, name){
  var d = activeData();
  // Prevent duplicates
  for(var i=0;i<d.bd[ci].subs.length;i++){
    if(d.bd[ci].subs[i].name.toLowerCase()===name.toLowerCase()) return;
  }
  d.bd[ci].subs.push({name:name, budget:0, spent:0});
  saveState();
  render();
}

function addSub(ci){
  var inp=$id("newSubName-"+ci);
  var name=inp.value.trim();
  if(!name){ alert("Enter a subcategory name."); return; }
  activeData().bd[ci].subs.push({name:name,budget:0,spent:0});
  inp.value="";
  saveAndRender();
}

function deleteSub(ci,si){
  var d=activeData();
  var sub=d.bd[ci].subs[si];
  if(sub.spent>0){ if(!confirm("This subcategory has $"+sub.spent.toFixed(2)+" in recorded spending. Delete anyway?")) return; }
  else if(!confirm("Delete subcategory \""+sub.name+"\"?")) return;
  d.bd[ci].subs.splice(si,1);
  // fix transaction refs
  for(var i=0;i<d.txs.length;i++){
    if(d.txs[i].ci===ci&&d.txs[i].si===si){ d.txs[i].si=-1; }
    else if(d.txs[i].ci===ci&&d.txs[i].si>si){ d.txs[i].si--; }
  }
  saveAndRender();
}
