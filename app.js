const KEY="select_record_web_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"groups":[],"records":[]}');
let screen="home", currentGroupId=null, selectedId=null;

const main=document.getElementById("main"), title=document.getElementById("title"), back=document.getElementById("backBtn");

function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function group(){return data.groups.find(g=>g.id===currentGroupId)}
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fileToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

function render(){
  title.textContent=screen==="home"?"ホーム":screen==="history"?"記録":screen==="createGroup"?"グループを作る":screen==="manage"?"選択肢を管理":group()?.name||"選択";
  back.classList.toggle("hidden",["home","history"].includes(screen));
  if(screen==="home") renderHome();
  if(screen==="history") renderHistory();
  if(screen==="createGroup") renderCreateGroup();
  if(screen==="manage") renderManage();
  if(screen==="select") renderSelect();
}
function renderHome(){
  main.innerHTML=`<button class="primary" id="newGroup">＋ 新しいグループを作る</button>
  <div class="sectionTitle">グループ一覧</div>
  ${data.groups.length?data.groups.map(g=>`<button class="groupCard" data-g="${g.id}">
    <div class="groupIcon">▦</div><div><b>${esc(g.name)}</b><div class="muted">選択肢：${g.choices.length}件</div></div>
  </button>`).join(""):`<div class="empty">まだグループがありません。<br>「新しいグループを作る」から始めてください。</div>`}`;
  document.getElementById("newGroup").onclick=()=>{screen="createGroup";render()};
  main.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{currentGroupId=b.dataset.g;screen="manage";render()});
}
function renderCreateGroup(){
  main.innerHTML=`<div class="form"><label class="label">グループ名</label><input id="gname" class="input" placeholder="例：今日の夕食">
  <button class="primary" id="create">作成する</button><p class="note">グループを作った後、画像と名前を自由に追加できます。</p></div>`;
  document.getElementById("create").onclick=()=>{const n=document.getElementById("gname").value.trim();if(!n)return;const id=crypto.randomUUID();data.groups.push({id,name:n,choices:[]});save();currentGroupId=id;screen="manage";render()};
}
function renderManage(){
  const g=group(); if(!g){screen="home";return render()}
  main.innerHTML=`<button class="primary" id="add">＋ 選択肢を追加する</button>
  <button class="primary" id="start">このグループから選択する</button>
  <div class="sectionTitle">登録済み（${g.choices.length}）</div>
  <div class="choiceList">${g.choices.length?g.choices.map(c=>`<div class="choiceRow">
    ${c.image?`<img class="thumb" src="${c.image}">`:`<div class="thumb"></div>`}
    <div class="grow"><b>${esc(c.name)}</b></div>
    <button class="smallBtn" data-edit="${c.id}">編集</button>
    <button class="smallBtn danger" data-del="${c.id}">削除</button>
  </div>`).join(""):`<div class="empty">選択肢がありません。</div>`}</div>
  <button class="dangerBtn" id="deleteGroup">このグループを削除</button>`;
  document.getElementById("add").onclick=()=>choiceEditor();
  document.getElementById("start").onclick=()=>{selectedId=null;screen="select";render()};
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>choiceEditor(b.dataset.edit));
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("削除しますか？")){g.choices=g.choices.filter(c=>c.id!==b.dataset.del);save();render()}});
  document.getElementById("deleteGroup").onclick=()=>{if(confirm("グループと記録を削除しますか？")){data.groups=data.groups.filter(x=>x.id!==g.id);data.records=data.records.filter(x=>x.groupId!==g.id);save();screen="home";render()}};
}
async function choiceEditor(editId=null){
  const g=group(), old=g.choices.find(c=>c.id===editId);
  const name=prompt("選択肢の名前",old?.name||""); if(name===null||!name.trim())return;
  const input=document.createElement("input");input.type="file";input.accept="image/*";input.capture="environment";
  if(old?.image){ if(!confirm("画像を変更しますか？（キャンセルなら現在の画像を維持）")) {if(old){old.name=name.trim();save();render()}return}}
  input.onchange=async()=>{let image=old?.image||null;if(input.files[0])image=await fileToData(input.files[0]);
    if(old){old.name=name.trim();old.image=image}else g.choices.push({id:crypto.randomUUID(),name:name.trim(),image});
    save();render()};
  input.click();
}
function renderSelect(){
  const g=group();if(!g){screen="home";return render()}
  main.style.paddingBottom="150px";
  main.innerHTML=`<div class="grid">${g.choices.map(c=>`<button class="cell ${selectedId===c.id?"selected":""}" data-c="${c.id}">
    ${c.image?`<img src="${c.image}">`:`<div class="placeholder">＋</div>`}<div class="cellName">${esc(c.name)}</div></button>`).join("")}</div>
    <div class="confirm"><div class="note" style="text-align:center;margin-bottom:7px">${selectedId?`選択中：${esc(g.choices.find(c=>c.id===selectedId)?.name||"")}`:"選択肢をタップしてください"}</div>
    <button id="confirm" ${selectedId?"":"disabled"}>決定</button></div>`;
  main.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.c;render()});
  document.getElementById("confirm").onclick=()=>{const c=g.choices.find(x=>x.id===selectedId);if(!c)return;data.records.unshift({id:crypto.randomUUID(),groupId:g.id,groupName:g.name,choiceName:c.name,date:new Date().toISOString()});save();alert("記録しました");selectedId=null;render()};
}
function renderHistory(){
  main.style.paddingBottom="88px";
  if(!data.records.length){main.innerHTML=`<div class="empty">記録はまだありません。<br>選択画面で「決定」を押すと記録されます。</div>`;return}
  main.innerHTML=data.records.map(r=>`<div class="record"><b>${esc(r.choiceName)}</b><small>${esc(r.groupName)}　${new Date(r.date).toLocaleString("ja-JP")}</small></div>`).join("");
}
function choiceBack(){
  if(screen==="select"||screen==="manage"){screen="home";render()}
  else if(screen==="createGroup"){screen="home";render()}
}
back.onclick=choiceBack;
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{screen=b.dataset.tab;render();document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b))});
render();
