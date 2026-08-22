const KEY="select_record_shared_v4";
let data={groups:[],choices:[],records:[]};

function migrate(){
  try{const cur=JSON.parse(localStorage.getItem(KEY)||"null");if(cur&&typeof cur==="object"){data.groups=Array.isArray(cur.groups)?cur.groups:[];data.choices=Array.isArray(cur.choices)?cur.choices:[];data.records=Array.isArray(cur.records)?cur.records:[];}}catch(e){}
  if(data.groups.length||data.choices.length||data.records.length)return;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i); if(!k||k===KEY)continue;
    try{
      const v=JSON.parse(localStorage.getItem(k));
      if(!v||typeof v!=="object")continue;
      if(Array.isArray(v.groups))for(const g of v.groups){
        if(!g?.name)continue;
        const gid=g.id||crypto.randomUUID();
        if(!data.groups.some(x=>x.id===gid||x.name===g.name))data.groups.push({id:gid,name:g.name});
        if(Array.isArray(g.choices))for(const c of g.choices){
          if(!c?.name)continue;
          if(!data.choices.some(x=>x.name===c.name))data.choices.push({id:c.id||crypto.randomUUID(),name:c.name,image:c.image||null});
        }
      }
      if(Array.isArray(v.choices))for(const c of v.choices)if(c?.name&&!data.choices.some(x=>x.name===c.name))data.choices.push({id:c.id||crypto.randomUUID(),name:c.name,image:c.image||null});
      if(Array.isArray(v.records))for(const r of v.records)if(r&&(r.choiceName||r.name||r.choice))data.records.push({groupId:r.groupId||"",groupName:r.groupName||"",choiceName:r.choiceName||r.name||r.choice,date:r.date||r.createdAt||new Date().toISOString()});
    }catch(e){}
  }
  localStorage.setItem(KEY,JSON.stringify(data));
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
  const g=group();if(!g)return;main.style.paddingBottom="150px";
  main.innerHTML=`${data.choices.length?`<div class="grid">${data.choices.map(c=>`<button class="cell ${selectedId===c.id?"selected":""}" data-c="${c.id}">${c.image?`<img src="${c.image}">`:`<div class="placeholder">＋</div>`}<div class="cellName">${esc(c.name)}</div></button>`).join("")}</div>`:`<div class="empty">選択肢がありません。<br>「選択肢を管理」から追加してください。</div>`}<div class="confirm"><div style="text-align:center;margin-bottom:7px">${selectedId?`選択中：${esc(data.choices.find(c=>c.id===selectedId)?.name||"")}`:"選択肢をタップしてください"}</div><button id="ok" ${selectedId?"":"disabled"}>決定</button></div>`;
  main.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.c;render()});
  document.getElementById("ok").onclick=()=>{const c=data.choices.find(c=>c.id===selectedId);if(!c)return;data.records.unshift({groupId:g.id,groupName:g.name,choiceName:c.name,date:new Date().toISOString()});save();alert("記録しました");selectedId=null;render()};
}
function history(){main.innerHTML=data.records.length?data.records.map(r=>`<div class="record"><b>${esc(r.choiceName)}</b><small>${esc(r.groupName||"")}　${new Date(r.date).toLocaleString("ja-JP")}</small></div>`).join(""):`<div class="empty">記録はまだありません。</div>`}
back.onclick=()=>{screen="home";render()};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{screen=b.dataset.tab;render();document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b))});
render();