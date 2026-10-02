
const KEY="middleman_tracking_v1";
let db=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(window.INITIAL_DATA);
let view="dashboard", editing=null, invoiceRecord=null;

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>n==null||n===""?"—":Number(n).toLocaleString("en-BD",{maximumFractionDigits:0})+" ৳";
const date=v=>v?new Date(v).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—";
const norm=s=>String(s??"").toLowerCase();
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.className="show";setTimeout(()=>e.className="",2200)}
function allRecords(){
  return Object.entries(db.sheets).flatMap(([source,rows])=>rows.map((r,i)=>({...r,_source:source,_id:source+"::"+i})));
}
function latestResult(r){return r["3rd Exam Result"]||r["2nd Exam Result"]||r["1st Exam Result"]||"Pending"}
function badge(v){let c=norm(v);let cls=c.includes("pass")?"pass":c.includes("fail")?"fail":c.includes("absent")?"absent":c.includes("pending")?"pending":"neutral";return `<span class="badge ${cls}">${esc(v||"—")}</span>`}
function render(){
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const titles={dashboard:"Dashboard",search:"Search Console",passengers:"Passengers",agent:"Testing Ag",contractor:"Testing Tc",isra:"Isra",invoice:"Invoices",settings:"Settings"};
  document.getElementById("pageTitle").textContent=titles[view]||"Dashboard";
  const content=document.getElementById("content"); content.className="page";
  if(view==="dashboard") content.innerHTML=dashboard();
  else if(view==="search") content.innerHTML=searchPage();
  else if(view==="passengers") content.innerHTML=tablePage("all");
  else if(view==="agent") content.innerHTML=tablePage("Testing Ag");
  else if(view==="contractor") content.innerHTML=tablePage("Testing Tc");
  else if(view==="isra") content.innerHTML=tablePage("Isra");
  else if(view==="invoice") content.innerHTML=invoicePage();
  else if(view==="settings") content.innerHTML=settingsPage();
  bind();
}
function dashboard(){
 const rec=allRecords(), unique=[...new Map(rec.map(r=>[String(r["Passport number"]),r])).values()];
 const pass=rec.filter(r=>latestResult(r)==="Pass").length, pending=rec.filter(r=>latestResult(r)==="Pending").length;
 const received=rec.reduce((s,r)=>s+(Number(r["Amount Received"])||Number(r["Payment Amount"])||0),0);
 const due=rec.reduce((s,r)=>s+(Number(r["Balance Due"])||0),0);
 return `<div class="cards">
  <div class="card"><div class="metric-label">Unique Passengers</div><div class="metric">${unique.length}</div><div class="metric-sub">Across all tracking sections</div></div>
  <div class="card"><div class="metric-label">Passed Exams</div><div class="metric">${pass}</div><div class="metric-sub">Latest recorded result</div></div>
  <div class="card"><div class="metric-label">Pending</div><div class="metric">${pending}</div><div class="metric-sub">Need follow-up</div></div>
  <div class="card"><div class="metric-label">Balance Due</div><div class="metric">${money(due)}</div><div class="metric-sub">From agent records</div></div>
 </div>
 <div class="grid2">
  <div class="panel"><div class="panel-head"><h2>Recent passengers</h2><button class="btn secondary" onclick="setView('passengers')">View all</button></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Passport</th><th>Section</th><th>Result</th><th>Payment</th></tr></thead><tbody>
  ${unique.slice(-8).reverse().map(r=>`<tr><td><b>${esc(r["Passenger Name"])}</b></td><td>${esc(r["Passport number"])}</td><td>${esc(r._source)}</td><td>${badge(latestResult(r))}</td><td>${money(r["Payment Amount"]||r["Amount Received"])}</td></tr>`).join("")}</tbody></table></div></div>
  <div class="panel"><div class="panel-head"><h2>System overview</h2></div><div class="panel-body">
  <div class="list">${Object.entries(db.sheets).map(([k,v])=>`<div class="list-row"><span>${esc(k)}</span><b>${v.length} records</b></div>`).join("")}</div>
  <div class="notice" style="margin-top:15px">Your browser stores changes locally. Use <b>Export Excel</b> to keep a backup or move the data to another device.</div>
  </div></div>
 </div>`;
}
function tablePage(type){
 let rows=type==="all"?allRecords(): (db.sheets[type]||[]).map((r,i)=>({...r,_source:type,_id:type+"::"+i}));
 return `<div class="toolbar"><input id="tableSearch" class="input search" placeholder="Search name, passport, occupation..." value="${esc(window._q||"")}">
 <select id="statusFilter" class="select"><option value="">All results</option><option>Pass</option><option>Fail</option><option>Pending</option><option>Absent</option></select>
 <button class="btn primary" id="tableAdd">＋ Add</button></div>
 <div class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Passport</th><th>Occupation</th><th>Exam Location</th><th>Latest</th><th>Financial</th><th>Actions</th></tr></thead><tbody id="tableBody"></tbody></table></div></div>`;
}
function fillTable(){
 const type=view==="passengers"?"all":view==="agent"?"Testing Ag":view==="contractor"?"Testing Tc":view==="isra"?"Isra":null;
 if(!type)return;
 let rows=type==="all"?allRecords():(db.sheets[type]||[]).map((r,i)=>({...r,_source:type,_index:i}));
 const q=norm(window._q||""); const sf=document.getElementById("statusFilter")?.value||"";
 rows=rows.filter(r=>(!q||[r["Passenger Name"],r["Passport number"],r["Occupation"],r["Exam Location"],r["S.A."],r["T.C."]].some(x=>norm(x).includes(q)))&&(!sf||latestResult(r)===sf));
 const body=document.getElementById("tableBody"); if(!body)return;
 body.innerHTML=rows.length?rows.map(r=>`<tr>
 <td><b>${esc(r["Passenger Name"])}</b></td><td>${esc(r["Passport number"])}</td><td>${esc(r["Occupation"])}</td><td>${esc(r["Exam Location"])}</td><td>${badge(latestResult(r))}</td>
 <td>${money(r["Amount Received"]||r["Payment Amount"])}${r["Balance Due"]!=null?`<div style="font-size:10px;color:#b45309">Due ${money(r["Balance Due"])}</div>`:""}</td>
 <td class="actions"><button class="iconbtn" onclick="editRecord('${esc(r._source)}',${r._index})">Edit</button><button class="iconbtn" onclick="showRecord('${esc(r._source)}',${r._index})">View</button><button class="iconbtn danger" onclick="deleteRecord('${esc(r._source)}',${r._index})">Delete</button></td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No records found.</div></td></tr>`;
}
function searchPage(){
 return `<div class="panel"><div class="panel-head"><h2>Find a passenger</h2><span class="metric-label">Search all sections</span></div><div class="panel-body">
 <div class="big-search"><input id="searchAll" class="input" placeholder="Passport number, passenger name, occupation..."><button class="btn primary" id="doSearch">Search</button></div>
 <div id="searchResults"><div class="empty">Enter a passport number or name to search.</div></div></div></div>`;
}
function runSearch(){
 const q=norm(document.getElementById("searchAll").value.trim()); const box=document.getElementById("searchResults");
 if(!q){box.innerHTML='<div class="empty">Enter a passport number or name to search.</div>';return}
 const rows=allRecords().filter(r=>[r["Passenger Name"],r["Passport number"],r["Occupation"],r["Exam Location"]].some(v=>norm(v).includes(q)));
 box.innerHTML=rows.length?rows.map(r=>`<div class="card" style="margin-bottom:10px;box-shadow:none"><div style="display:flex;justify-content:space-between;gap:12px"><div><h3 style="margin:0 0 5px">${esc(r["Passenger Name"])}</h3><div class="metric-label">Passport: ${esc(r["Passport number"])} · ${esc(r._source)}</div></div>${badge(latestResult(r))}</div><div class="profile" style="margin-top:13px"><div class="kv"><label>Occupation</label><div>${esc(r["Occupation"])}</div></div><div class="kv"><label>Exam Location</label><div>${esc(r["Exam Location"])}</div></div><div class="kv"><label>Amount / Pass Cost</label><div>${money(r["Amount Received"]||r["Payment Amount"])} / ${money(r["Passing Fee"]||r["Pass Cost"]||r["Contract Total"])}</div></div><div class="kv"><label>Payment Date</label><div>${date(r["Payment Date"])}</div></div></div><div class="exam-grid" style="margin-top:12px">${[1,2,3].map(n=>`<div class="exam"><b>${n}st Exam</b><small>${date(r[`${n}st Exam Date`])}</small>${badge(r[`${n}st Exam Result`]||"Not recorded")}</div>`).join("")}</div></div>`).join(""):`<div class="empty">No matching passenger found.</div>`;
}
function invoicePage(){
 let r=invoiceRecord;
 if(!r)return `<div class="panel"><div class="panel-head"><h2>Invoice</h2></div><div class="panel-body"><div class="empty">Select a passenger from the table and choose View, then generate an invoice.</div></div></div>`;
 return `<div class="invoice"><div class="invoice-head"><div><h2>Middleman Tracking System</h2><div class="metric-label">Passenger Payment Invoice</div></div><div class="right"><b>#${esc(r["Passport number"])}</b><div>${date(new Date())}</div></div></div>
 <div class="profile" style="margin-top:20px"><div class="kv"><label>Passenger</label><div>${esc(r["Passenger Name"])}</div></div><div class="kv"><label>Passport</label><div>${esc(r["Passport number"])}</div></div><div class="kv"><label>Occupation</label><div>${esc(r["Occupation"])}</div></div><div class="kv"><label>Section</label><div>${esc(r._source)}</div></div></div>
 <table><tr><th>Description</th><th class="right">Amount</th></tr>
 <tr><td>Registration / Contract Cost</td><td class="right">${money(r["Reg. Fee"]||r["Reg. Cost"])}</td></tr>
 <tr><td>Passing / Contract Cost</td><td class="right">${money(r["Passing Fee"]||r["Contract Total"]||r["Pass Cost"])}</td></tr>
 <tr><td>Payment recorded</td><td class="right">${money(r["Payment Amount"]||r["Amount Received"])}</td></tr>
 <tr><th>Balance Due</th><th class="right">${money(r["Balance Due"]||r["Penalty"])}</th></tr></table>
 <div style="margin-top:25px;display:flex;justify-content:flex-end"><button class="btn primary" onclick="window.print()">Print Invoice</button></div></div>`;
}
function settingsPage(){
 return `<div class="settings-grid">${Object.entries(db.settings).map(([key,vals])=>`<div class="setting-box"><b>${esc(key)}</b><div class="chips">${vals.map(v=>`<span class="chip">${esc(v)}</span>`).join("")}</div><div class="add-setting"><input class="input settingInput" data-key="${esc(key)}" placeholder="Add ${esc(key)}"><button class="btn secondary addSetting" data-key="${esc(key)}">Add</button></div></div>`).join("")}</div>
 <div class="panel" style="margin-top:15px"><div class="panel-body"><button class="btn secondary" id="resetBtn">Reset browser data to original Excel import</button><div class="footer-note">Reset removes changes made in this browser only.</div></div></div>`;
}
function formHTML(source="Testing Ag", idx=null){
 const r=idx!=null?(db.sheets[source]||[])[idx]:{};
 const contractor=source==="Testing Tc"||source==="Isra";
 const fields=[
 ["Passenger Name","text"],["Passport number","text"],["Occupation","select:Occupations"],[contractor?"S.A.":"T.C.",`select:${contractor?"S.A.":"T.C."}`],["Exam Location","select:Exam Locations"],
 ["1st Exam Date","date"],["1st Exam Result","select:Exam Status"],["2nd Exam Date","date"],["2nd Exam Result","select:Exam Status"],["3rd Exam Date","date"],["3rd Exam Result","select:Exam Status"],
 [contractor?"Reg. Cost":"Reg. Fee","number"],[contractor?"Contract Total":"Passing Fee","number"],[contractor?"Pass Cost":"Amount Received","number"],[contractor?"Penalty":"Balance Due","number"],["Payment Date","date"],["Payment Amount","number"]
 ];
 return `<div class="dialog"><div class="dialog-head"><h2>${idx==null?"Add":"Edit"} ${source} record</h2><button class="iconbtn" onclick="closeModal()">✕</button></div><div class="dialog-body"><div class="form-grid">
 ${fields.map(([label,type])=>{let [kind,arg]=type.split(":");let val=r[label]??""; if(kind==="select")return `<div class="field"><label>${esc(label)}</label><select class="select fieldVal" data-key="${esc(label)}"><option value="">Select</option>${(db.settings[arg]||[]).map(v=>`<option ${String(v)===String(val)?"selected":""}>${esc(v)}</option>`).join("")}</select></div>`;return `<div class="field"><label>${esc(label)}</label><input class="input fieldVal" data-key="${esc(label)}" type="${kind}" value="${esc(val&&String(val).slice(0,10))}"></div>`}).join("")}
 </div></div><div class="dialog-foot"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" id="saveRecord">Save Record</button></div></div>`;
}
function openForm(source,idx=null){editing={source,idx};document.getElementById("modal").innerHTML=formHTML(source,idx);document.getElementById("modal").classList.remove("hidden");document.getElementById("saveRecord").onclick=saveRecord}
function saveRecord(){
 const {source,idx}=editing; const obj={}; document.querySelectorAll(".fieldVal").forEach(e=>{let v=e.value; if(e.type==="number"&&v!=="")v=Number(v);obj[e.dataset.key]=v||null});
 const rows=db.sheets[source]||[]; if(idx==null){obj["Serial Number"]=rows.length+1;rows.push(obj)}else{obj["Serial Number"]=rows[idx]["Serial Number"]||idx+1;rows[idx]={...rows[idx],...obj}}
 db.sheets[source]=rows;save();closeModal();toast("Record saved");render();
}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function editRecord(source,idx){openForm(source,idx)}
function showRecord(source,idx){
 const r=db.sheets[source][idx]; invoiceRecord={...r,_source:source};
 document.getElementById("modal").innerHTML=`<div class="dialog"><div class="dialog-head"><h2>${esc(r["Passenger Name"])}</h2><button class="iconbtn" onclick="closeModal()">✕</button></div><div class="dialog-body">
 <div class="profile">${["Passport number","Occupation","Exam Location","Payment Date","Payment Amount","Balance Due"].map(k=>`<div class="kv"><label>${esc(k)}</label><div>${k.includes("Date")?date(r[k]):k.includes("Amount")||k.includes("Due")?money(r[k]):esc(r[k]||"—")}</div></div>`).join("")}</div>
 <h3 class="section-title" style="margin-top:18px">Exam history</h3><div class="exam-grid">${[1,2,3].map(n=>`<div class="exam"><b>${n}st Exam</b><small>${date(r[`${n}st Exam Date`])}</small>${badge(r[`${n}st Exam Result`]||"Not recorded")}</div>`).join("")}</div>
 </div><div class="dialog-foot"><button class="btn secondary" onclick="closeModal()">Close</button><button class="btn primary" onclick="closeModal();setView('invoice')">Generate Invoice</button></div></div>`;
 document.getElementById("modal").classList.remove("hidden");
}
function deleteRecord(source,idx){if(confirm("Delete this record?")){db.sheets[source].splice(idx,1);db.sheets[source].forEach((r,i)=>r["Serial Number"]=i+1);save();toast("Record deleted");render()}}
function setView(v){view=v;window._q="";render()}
function bind(){
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>setView(b.dataset.view));
 document.getElementById("addBtn").onclick=()=>openForm(view==="contractor"?"Testing Tc":view==="isra"?"Isra":"Testing Ag");
 document.getElementById("globalSearchBtn").onclick=()=>setView("search");
 document.getElementById("tableAdd")?.addEventListener("click",()=>openForm(view==="contractor"?"Testing Tc":view==="isra"?"Isra":"Testing Ag"));
 document.getElementById("tableSearch")?.addEventListener("input",e=>{window._q=e.target.value;fillTable()});
 document.getElementById("statusFilter")?.addEventListener("change",fillTable);
 document.getElementById("doSearch")?.addEventListener("click",runSearch);
 document.getElementById("searchAll")?.addEventListener("keydown",e=>{if(e.key==="Enter")runSearch()});
 document.querySelectorAll(".addSetting").forEach(b=>b.onclick=()=>{let inp=document.querySelector(`.settingInput[data-key="${CSS.escape(b.dataset.key)}"]`);if(inp.value.trim()){db.settings[b.dataset.key].push(inp.value.trim());save();render();toast("Setting added")}});
 document.getElementById("resetBtn")?.addEventListener("click",()=>{if(confirm("Reset all browser data to the original Excel data?")){db=structuredClone(window.INITIAL_DATA);save();render();toast("Reset complete")}});
 if(["passengers","agent","contractor","isra"].includes(view))fillTable();
}
document.getElementById("importBtn").onclick=()=>document.getElementById("fileInput").click();
document.getElementById("fileInput").onchange=e=>{
 const file=e.target.files[0]; if(!file)return; const reader=new FileReader();
 reader.onload=ev=>{try{
  const book=XLSX.read(ev.target.result,{type:"array"}); const newSheets={};
  ["Testing Ag","Testing Tc","Isra"].forEach(s=>{if(book.SheetNames.includes(s)){const rows=XLSX.utils.sheet_to_json(book.Sheets[s],{defval:null,range:3});newSheets[s]=rows.filter(r=>r["Passenger Name"]).map((r,i)=>({...r,"Serial Number":i+1}))}});
  Object.assign(db.sheets,newSheets); if(book.SheetNames.includes("Settings")){const a=XLSX.utils.sheet_to_json(book.Sheets.Settings,{header:1,defval:null});const keys=a[0]||[];keys.forEach((k,c)=>{if(k)db.settings[k]=a.slice(1).map(r=>r[c]).filter(v=>v!=null&&v!=="").map(String)})}
  save();render();toast("Excel imported successfully");
 }catch(err){alert("Could not import this Excel file: "+err.message)}}; reader.readAsArrayBuffer(file);e.target.value="";
};
document.getElementById("exportBtn").onclick=()=>{
 const book=XLSX.utils.book_new();
 Object.entries(db.sheets).forEach(([name,rows])=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>{let x={...r};delete x._source;delete x._index;delete x._id;return x}));XLSX.utils.book_append_sheet(book,ws,name.slice(0,31))});
 const settings=[Object.keys(db.settings),...Array.from({length:Math.max(...Object.values(db.settings).map(a=>a.length))},(_,i)=>Object.keys(db.settings).map(k=>db.settings[k][i]||""))];
 XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(settings),"Settings");
 XLSX.writeFile(book,"Middleman_Tracking_System.xlsx");toast("Excel exported");
};
window.setView=setView;window.editRecord=editRecord;window.showRecord=showRecord;window.deleteRecord=deleteRecord;window.closeModal=closeModal;
render();
