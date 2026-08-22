const KEY="select_record_shared_v5";
const LEGACY_KEYS=["select_record_shared_v4","select_record_shared_v3","select_record_web_v2","select_record_web_v1"];
let data={groups:[],choices:[],records:[]};

function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():"id_"+Date.now()+"_"+Math.random().toString(36).slice(2)}
function normalize(raw){
  if(!raw||typeof raw!=="object")return null;
  const out={groups:[],choices:[],records:[]};
  if(Array.isArray(raw.groups))raw.groups.forEach(g=>{if(!g)return;const group={id:String(g.id||uid()),name:String(g.name||"無題のグループ")};if(!out.groups.some(x=>x.id===group.id))out.groups.push(group);if(Array.isArray(g.choices))g.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})})});
  if(Array.isArray(raw.choices))raw.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})});
  if(Array.isArray(raw.records))raw.records.forEach(r=>{if(r)out.records.push({id:String(r.id||uid()),groupId:String(r.groupId||""),groupName:String(r.groupName||""),choiceName:String(r.choiceName||r.name||r.choice||""),date:r.date||r.createdAt||new Date().toISOString()})});
  out.groups=out.groups.filter((g,i,a)=>a.findIndex(x=>x.id===g.id||x.name===g.name)===i);
  out.choices=out.choices.filter(c=>c.name).filter((c,i,a)=>a.findIndex(x=>x.name===c.name)===i);
  return out;
}
function merge(base,add){if(!add)return;add.groups.forEach(g=>{if(!base.groups.some(x=>x.id===g.id||x.name===g.name))base.groups.push(g)});add.choices.forEach(c=>{const same=base.choices.find(x=>x.id===c.id||x.name===c.name);if(!same)base.choices.push(c);else if(!same.image&&c.image)same.image=c.image});add.records.forEach(r=>{if(!base.records.some(x=>x.id===r.id))base.records.push(r)})}
function migrate(){
  const merged={groups:[],choices:[],records:[]}, candidates=[];
  try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(v)candidates.push(v)}catch(e){}
  LEGACY_KEYS.forEach(k=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");if(v)candidates.push(v)}catch(e){}});
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||k===KEY||LEGACY_KEYS.includes(k))continue;try{const v=JSON.parse(localStorage.getItem(k));if(v&&(Array.isArray(v.groups)||Array.isArray(v.choices)||Array.isArray(v.records)))candidates.push(v)}catch(e){}}}catch(e){}
  candidates.forEach(v=>merge(merged,normalize(v))); data=merged; localStorage.setItem(KEY,JSON.stringify(data));
}
migrate();

let screen="home",currentGroupId=null,selectedId=null;
const main=document.getElementById("main"),title=document.getElementById("title"),back=document.getElementById("backBtn");
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const group=()=>data.groups.find(g=>g.id===currentGroupId);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const fileToData=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});

function render(){
  main.style.paddingBottom="88px";
  title.textContent=screen==="home"?"ホーム":screen==="history"?"記録":screen==="createGroup"?"グループを作る":screen==="manageChoices"?"選択肢を管理":group()?.name||"選択";
  back.classList.toggle("hidden",["home","history"].includes(screen));
  ({home,history,createGroup,manageChoices,select}[screen])();
}
function home(){
  main.innerHTML=`<button class="primary" id="new">＋ 新しいグループを作る</button><button class="secondary" id="manage">選択肢を管理</button><div class="sectionTitle">グループ一覧</div>${data.groups.length?data.groups.map(g=>`<button class="groupCard" data-g="${g.id}"><div class="groupIcon">▦</div><div><b>${esc(g.name)}</b><div class="muted">共有選択肢：${data.choices.length}件</div></div></button>`).join(""):`<div class="empty">まだグループがありません。<br>「新しいグループを作る」から作成してください。</div>`}`;
  document.getElementById("new").onclick=()=>{screen="createGroup";render()};
  document.getElementById("manage").onclick=()=>{screen="manageChoices";render()};
  main.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{currentGroupId=b.dataset.g;selectedId=null;screen="select";render()});
}
function createGroup(){
  main.innerHTML=`<div class="form"><label class="label">グループ名</label><input id="gname" class="input" placeholder="例：今日の夕食"><button class="primary" id="create">作成する</button></div>`;
  document.getElementById("create").onclick=()=>{const n=document.getElementById("gname").value.trim();if(!n)return;const id=crypto.randomUUID();data.groups.push({id,name:n});save();currentGroupId=id;screen="select";render()};
}
function manageChoices(){
  main.innerHTML=`<button class="primary" id="add">＋ 選択肢を追加する</button><div class="sectionTitle">全グループ共通（${data.choices.length}）</div><div class="choiceList">${data.choices.map(c=>`<div class="choiceRow">${c.image?`<img class="thumb" src="${c.image}">`:`<div class="thumb"></div>`}<div class="grow"><b>${esc(c.name)}</b></div><button class="smallBtn" data-e="${c.id}">編集</button><button class="smallBtn danger" data-d="${c.id}">削除</button></div>`).join("")||`<div class="empty">選択肢がありません。</div>`}</div>`;
  document.getElementById("add").onclick=()=>editChoice();
  main.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>editChoice(b.dataset.e));
  main.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{if(confirm("削除しますか？")){data.choices=data.choices.filter(c=>c.id!==b.dataset.d);save();render()}});
}
async function editChoice(id=null){
  const old=data.choices.find(c=>c.id===id),name=prompt("選択肢の名前",old?.name||"");if(name===null||!name.trim())return;
  const input=document.createElement("input");input.type="file";input.accept="image/*";
  if(old?.image&&!confirm("画像を変更しますか？（キャンセルで現在の画像を維持）")){old.name=name.trim();save();render();return}
  input.onchange=async()=>{let image=old?.image||null;if(input.files[0])image=await fileToData(input.files[0]);if(old){old.name=name.trim();old.image=image}else data.choices.push({id:crypto.randomUUID(),name:name.trim(),image});save();render()};input.click();
}
function select(){
  const g=group(); if(!g)return;
  main.style.paddingBottom="150px";
  const chosen=data.choices.find(c=>c.id===selectedId);
  main.innerHTML=`
    ${data.choices.length?`<div class="grid">${data.choices.map(c=>`
      <button class="cell ${selectedId===c.id?"selected":""}" data-c="${c.id}">
        ${c.image?`<img src="${c.image}">`:`<div class="placeholder">＋</div>`}
        <div class="cellName">${esc(c.name)}</div>
      </button>`).join("")}</div>`:`<div class="empty">選択肢がありません。</div>`}
    <div class="memoArea">
      <label>📝 メモ</label>
      <textarea id="recordMemo" placeholder="メモを入力してください"></textarea>
    </div>
    <div class="confirm">
      <div id="selectedInfo" class="selectedInfo">${chosen?`選択中：${esc(chosen.name)}`:"選択肢は未選択（メモだけでも保存できます）"}</div>
      <button id="ok">完了</button>
    </div>`;
  main.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{
    selectedId=b.dataset.c; render();
  });
  document.getElementById("ok").onclick=()=>{
    const memo=document.getElementById("recordMemo").value.trim();
    const c=data.choices.find(x=>x.id===selectedId);
    if(!c && !memo){alert("選択肢を選ぶか、メモを入力してください。");return}
    data.records.unshift({
      id:crypto.randomUUID(),
      groupId:g.id,
      groupName:g.name,
      choiceId:c?.id||"",
      choiceName:c?.name||"",
      memo,
      date:new Date().toISOString()
    });
    save(); alert("記録しました"); selectedId=null; render();
  };
}
function history(){
  main.innerHTML=data.records.length?data.records.map((r,i)=>`
    <div class="record" data-record="${r.id||i}">
      <b>${r.choiceName?esc(r.choiceName):"📝 メモのみ"}</b>
      <small>${esc(r.groupName||"")}　${new Date(r.date).toLocaleString("ja-JP")}</small>
      ${r.memo?`<div class="recordMemo">${esc(r.memo)}</div>`:""}
      <button class="editMemoBtn" data-edit-memo="${r.id||i}">メモを編集</button>
    </div>`).join(""):`<div class="empty">記録はまだありません。</div>`;
  main.querySelectorAll("[data-edit-memo]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.editMemo;
    const r=data.records.find(x=>String(x.id)===String(id)) || data.records[Number(id)];
    if(!r)return;
    const memo=prompt("メモを編集",r.memo||"");
    if(memo===null)return;
    r.memo=memo;
    save(); render();
  });
}
back.onclick=()=>{screen="home";render()};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{screen=b.dataset.tab;render();document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b))});
render();