// ── TRANSACTIONS ──────────────────────────────────────────────────────────
function syncSubs(){} // legacy, replaced by row-based

function buildCatOptions(){
  var d=activeData(); var html="";
  for(var i=0;i<d.bd.length;i++) html+='<option value="'+i+'">'+d.bd[i].name+'</option>';
  return html;
}

function buildSubOptions(ci){
  var d=activeData(); var html="";
  for(var i=0;i<d.bd[ci].subs.length;i++) html+='<option value="'+i+'">'+d.bd[ci].subs[i].name+'</option>';
  return html;
}

function syncRowSubs(catSel){
  var ci=parseInt(catSel.value,10);
  var row=catSel.closest('tr');
  var subSel=row.querySelector('.row-sub');
  subSel.innerHTML=buildSubOptions(ci);
}

function removeExpenseRow(btn){ btn.closest('tr').remove(); }

var rowCount=0;
function addExpenseRow(){
  var tbody=document.getElementById('addExpenseRows');
  var d=activeData();
  var today=new Date().toISOString().split('T')[0];
  var rId='row-'+rowCount++;
  var catOpts=buildCatOptions();
  var subOpts=buildSubOptions(0);
  var tr=document.createElement('tr');
  tr.id=rId;
  tr.style.borderBottom='1px solid var(--border)';
  tr.innerHTML=
    '<td style="padding:8px 10px;"><input class="inp row-name" type="text" placeholder="Rent, Netflix..." style="min-width:130px;padding:6px 10px;font-size:.82rem;"/></td>'+
    '<td style="padding:8px 10px;"><select class="sel row-cat" onchange="syncRowSubs(this)" style="font-size:.82rem;padding:6px 10px;">'+catOpts+'</select></td>'+
    '<td style="padding:8px 10px;"><select class="sel row-sub" style="font-size:.82rem;padding:6px 10px;">'+subOpts+'</select></td>'+
    '<td style="padding:8px 10px;"><input class="inp row-date" type="date" value="'+today+'" style="font-size:.82rem;padding:6px 10px;"/></td>'+
    '<td style="padding:8px 10px;"><input class="inp row-amt" type="number" min="0" step="0.01" placeholder="0.00" style="min-width:90px;padding:6px 10px;font-size:.82rem;text-align:right;"/></td>'+
    '<td style="padding:8px 10px;text-align:right;"><button class="xbtn" style="padding:3px 8px;" onclick="removeExpenseRow(this)">&times;</button></td>';
  tbody.appendChild(tr);
}

function saveAllExpenses(){
  var d=activeData();
  var rows=document.querySelectorAll('#addExpenseRows tr');
  var saved=0; var errors=[];
  for(var r=0;r<rows.length;r++){
    var tr=rows[r];
    var name=tr.querySelector('.row-name').value.trim();
    var ci=parseInt(tr.querySelector('.row-cat').value,10);
    var si=parseInt(tr.querySelector('.row-sub').value,10);
    var amt=parseFloat(tr.querySelector('.row-amt').value);
    var date=tr.querySelector('.row-date').value;
    if(!name||isNaN(amt)||amt<=0||!date){ errors.push(name||'(unnamed)'); continue; }
    d.bd[ci].subs[si].spent=Math.round((d.bd[ci].subs[si].spent+amt)*100)/100;
    d.txs.push({id:Date.now()+''+Math.random(),name:name,cat:d.bd[ci].name,sub:d.bd[ci].subs[si].name,ci:ci,si:si,amt:Math.round(amt*100)/100,date:date});
    saved++;
    tr.remove();
  }
  if(saved>0){ saveAndRender(); renderRecentTx(); }
  if(errors.length) alert('Skipped rows with missing data: '+errors.join(', '));
  if(saved>0 && document.querySelectorAll('#addExpenseRows tr').length===0) addExpenseRow();
}

function syncCatDropdown(){
  var d=activeData();
  var eCatEl=$id("eCat");
  if(!eCatEl) return;
  var prev=parseInt(eCatEl.value,10)||0;
  var html="";
  for(var i=0;i<d.bd.length;i++) html+='<option value="'+i+'">'+d.bd[i].name+'</option>';
  eCatEl.innerHTML=html;
  eCatEl.value=Math.min(prev,d.bd.length-1);
  syncSubs();
}

function addExpense(){} // replaced by saveAllExpenses

function deleteTx(id){
  var d=activeData();
  var idx=-1; for(var i=0;i<d.txs.length;i++){ if(d.txs[i].id===id){idx=i;break;} }
  if(idx<0) return;
  var tx=d.txs[idx];
  if(!confirm('Delete "'+tx.name+'" for '+money(tx.amt)+'?')) return;
  if(tx.si>=0) d.bd[tx.ci].subs[tx.si].spent=Math.round(Math.max(0,d.bd[tx.ci].subs[tx.si].spent-tx.amt)*100)/100;
  d.txs.splice(idx,1);
  saveAndRender();
}

// ── EDIT MODAL ────────────────────────────────────────────────────────────
var EDIT_ID = null;

function openEdit(id){
  var d=activeData();
  var tx=null; for(var i=0;i<d.txs.length;i++) if(d.txs[i].id===id){ tx=d.txs[i]; break; }
  if(!tx) return;
  EDIT_ID=id;
  var html=""; for(var i=0;i<d.bd.length;i++) html+='<option value="'+i+'">'+d.bd[i].name+'</option>';
  $id("mCat").innerHTML=html;
  $id("mCat").value=tx.ci;
  mSyncSubs();
  $id("mSub").value=tx.si>=0?tx.si:0;
  $id("mName").value=tx.name;
  $id("mAmt").value=tx.amt;
  $id("mDate").value=tx.date;
  $id("editModal").classList.add("open");
}

function mSyncSubs(){
  var d=activeData();
  var ci=parseInt($id("mCat").value,10);
  var html=""; for(var i=0;i<d.bd[ci].subs.length;i++) html+='<option value="'+i+'">'+d.bd[ci].subs[i].name+'</option>';
  $id("mSub").innerHTML=html;
}

function closeModal(){ $id("editModal").classList.remove("open"); EDIT_ID=null; }

function saveEdit(){
  var d=activeData();
  var idx=-1; for(var i=0;i<d.txs.length;i++) if(d.txs[i].id===EDIT_ID){idx=i;break;}
  if(idx<0){ closeModal(); return; }
  var tx=d.txs[idx];
  var newName=$id("mName").value.trim();
  var newCi=parseInt($id("mCat").value,10);
  var newSi=parseInt($id("mSub").value,10);
  var newAmt=parseFloat($id("mAmt").value);
  var newDate=$id("mDate").value;
  if(!newName||isNaN(newAmt)||newAmt<=0||!newDate){ alert("Fill all fields."); return; }
  // Reverse old spent
  if(tx.si>=0) d.bd[tx.ci].subs[tx.si].spent=Math.round(Math.max(0,d.bd[tx.ci].subs[tx.si].spent-tx.amt)*100)/100;
  // Apply new spent
  d.bd[newCi].subs[newSi].spent=Math.round((d.bd[newCi].subs[newSi].spent+newAmt)*100)/100;
  // Update transaction
  d.txs[idx]={id:EDIT_ID,name:newName,cat:d.bd[newCi].name,sub:d.bd[newCi].subs[newSi].name,ci:newCi,si:newSi,amt:Math.round(newAmt*100)/100,date:newDate};
  closeModal();
  saveAndRender();
}

// ── ADD EXPENSE: single-form native mobile UI ──────────────────────────
function aeInit(){
  var d=activeData();
  var catSel=document.getElementById('aeCatSel');
  if(!catSel) return;
  var prev=parseInt(catSel.value,10)||0;
  var opts='';
  for(var i=0;i<d.bd.length;i++) opts+='<option value="'+i+'">'+d.bd[i].name+'</option>';
  catSel.innerHTML=opts;
  catSel.value=Math.min(prev,d.bd.length-1);
  aeUpdateSubs();
  var dateInp=document.getElementById('aeDateInp');
  if(dateInp && !dateInp.value) dateInp.value=new Date().toISOString().split('T')[0];
}
function aeUpdateSubs(){
  var d=activeData();
  var catSel=document.getElementById('aeCatSel');
  var subSel=document.getElementById('aeSubSel');
  if(!catSel||!subSel) return;
  var ci=parseInt(catSel.value,10)||0;
  var opts='';
  if(d.bd[ci]){
    for(var s=0;s<d.bd[ci].subs.length;s++) opts+='<option value="'+s+'">'+d.bd[ci].subs[s].name+'</option>';
  }
  subSel.innerHTML=opts||'<option value="0">General</option>';
}
function aeSubmit(){
  var d=activeData();
  var name=document.getElementById('aeNameInp').value.trim();
  var ci=parseInt(document.getElementById('aeCatSel').value,10)||0;
  var si=parseInt(document.getElementById('aeSubSel').value,10)||0;
  var date=document.getElementById('aeDateInp').value;
  var amt=parseFloat(document.getElementById('aeAmtInp').value);
  var msg=document.getElementById('aeMsg');
  if(!name){ if(msg) msg.textContent='Please enter a description.'; return; }
  if(!date){ if(msg) msg.textContent='Please pick a date.'; return; }
  if(isNaN(amt)||amt<=0){ if(msg) msg.textContent='Please enter a valid amount.'; return; }
  d.bd[ci].subs[si].spent=Math.round((d.bd[ci].subs[si].spent+amt)*100)/100;
  d.txs.push({id:Date.now()+''+Math.random(),name:name,cat:d.bd[ci].name,sub:d.bd[ci].subs[si].name,ci:ci,si:si,amt:Math.round(amt*100)/100,date:date});
  saveAndRender();
  renderRecentTx();
  // Reset form
  document.getElementById('aeNameInp').value='';
  document.getElementById('aeAmtInp').value='';
  document.getElementById('aeDateInp').value=new Date().toISOString().split('T')[0];
  if(msg){ msg.textContent='Expense saved!'; setTimeout(function(){ msg.textContent=''; },2000); }
}

function exportData(){
  var d=getData();
  var rows=[['Name','Category','Subcategory','Date','Amount']];
  d.txs.forEach(function(t){ rows.push([t.name,t.cat,t.sub,t.date,t.amt]); });
  var csv=rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='budget-export.csv'; a.click();
}
