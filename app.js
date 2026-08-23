const KEY="select_record_shared_v5";
const LEGACY_KEYS=["select_record_shared_v4","select_record_shared_v3","select_record_web_v2","select_record_web_v1"];
let data={groups:[],choices:[],records:[]};

function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():"id_"+Date.now()+"_"+Math.random().toString(36).slice(2)}
function normalize(raw){
  if(!raw||typeof raw!=="object")return null;
  const out={groups:[],choices:[],records:[]};
  if(Array.isArray(raw.groups)) raw.groups.forEach(g=>{
    if(!g)return;
    const group={id:String(g.id||uid()),name:String(g.name||"無題のグループ"),memo:g.memo||""};
    if(!out.groups.some(x=>x.id===group.id))out.groups.push(group);
    if(Array.isArray(g.choices))g.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})});
  });
  if(Array.isArray(raw.choices))raw.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})});
  if(Array.isArray(raw.records))raw.records.forEach(r=>{
    if(!r)return;
    out.records.push({
      id:String(r.id||uid()),
      groupId:String(r.groupId||""),
      groupName:String(r.groupName||""),
      choiceId:String(r.choiceId||""),
      choiceName:String(r.choiceName||r.name||r.choice||""),
      memo:String(r.memo||""),
      date:r.date||r.createdAt||new Date().toISOString()
    });
  });
  out.groups=out.groups.filter((g,i,a)=>a.findIndex(x=>x.id===g.id||x.name===g.name)===i);
  out.choices=out.choices.filter(c=>c.name).filter((c,i,a)=>a.findIndex(x=>x.id===c.id||x.name===c.name)===i);
  return out;
}
function merge(base,add){
  if(!add)return;
  add.groups.forEach(g=>{if(!base.groups.some(x=>x.id===g.id||x.name===g.name))base.groups.push(g)});
  add.choices.forEach(c=>{const same=base.choices.find(x=>x.id===c.id||x.name===c.name);if(!same)base.choices.push(c);else if(!same.image&&c.image)same.image=c.image});
  add.records.forEach(r=>{if(!base.records.some(x=>x.id===r.id))base.records.push(r)});
}
function migrate(){
  const merged={groups:[],choices:[],records:[]}, candidates=[];
  try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(v)candidates.push(v)}catch(e){}
  LEGACY_KEYS.forEach(k=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");if(v)candidates.push(v)}catch(e){}});
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||k===KEY||LEGACY_KEYS.includes(k))continue;
      try{const v=JSON.parse(localStorage.getItem(k));if(v&&(Array.isArray(v.groups)||Array.isArray(v.choices)||Array.isArray(v.records)))candidates.push(v)}catch(e){}
    }
  }catch(e){}
  candidates.forEach(v=>merge(merged,normalize(v)));
  data=merged;
  localStorage.setItem(KEY,JSON.stringify(data));
}
migrate();

let screen="home",currentGroupId=null,selectedId=null,recordGroupId=null;
const main=document.getElementById("main"),title=document.getElementById("title"),back=document.getElementById("backBtn");
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function group(){return data.groups.find(g=>g.id===currentGroupId)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fileToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function render(){
  main.style.paddingBottom="88px";
  title.textContent=screen==="home"?"ホーム":screen==="history"?"記録":screen==="createGroup"?"グループを作る":screen==="manage"?"選択肢を管理":group()?.name||"選択";
  back.classList.toggle("hidden",["home","history"].includes(screen));
  if(screen==="home")renderHome();
  else if(screen==="history")renderHistory();
  else if(screen==="createGroup")renderCreateGroup();
  else if(screen==="manage")renderManage();
  else if(screen==="select")renderSelect();
}
function renderHome(){
  main.innerHTML=`<button class="primary" id="newGroup">＋ 新しいグループを作る</button>
  <button class="secondary" id="manageAll">選択肢を管理</button>
  <div class="sectionTitle">グループ一覧</div>
  ${data.groups.length?data.groups.map(g=>`<div class="groupItem">
    <button class="groupCard" data-g="${g.id}"><div class="groupIcon">▦</div><div><b>${esc(g.name)}</b><div class="muted">共通選択肢：${data.choices.length}件</div></div></button>
    <div class="groupActions"><button class="manageGroupBtn" data-manage-group="${g.id}">選択肢管理</button><button class="deleteGroupBtn" data-delete-group="${g.id}">削除</button></div>
  </div>`).join(""):`<div class="empty">まだグループがありません。<br>「新しいグループを作る」から始めてください。</div>`}`;
  document.getElementById("newGroup").onclick=()=>{screen="createGroup";render()};
  document.getElementById("manageAll").onclick=()=>{screen="manage";render()};
  main.querySelectorAll("[data-manage-group]").forEach(b=>b.onclick=()=>{currentGroupId=b.dataset.manageGroup;screen="manage";render()});
  main.querySelectorAll("[data-delete-group]").forEach(b=>b.onclick=()=>{
    const g=data.groups.find(x=>x.id===b.dataset.deleteGroup);if(!g)return;
    if(!confirm(`「${g.name}」を削除しますか？\nこのグループの記録も削除されます。`))return;
    data.groups=data.groups.filter(x=>x.id!==g.id);
    data.records=data.records.filter(r=>r.groupId!==g.id);
    if(currentGroupId===g.id)currentGroupId=null;
    save();render();
  });
  main.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{currentGroupId=b.dataset.g;selectedId=null;screen="select";render()});
}
function renderCreateGroup(){
  main.innerHTML=`<div class="form"><label class="label">グループ名</label><input id="gname" class="input" placeholder="例：今日の夕食"><button class="primary" id="create">作成する</button></div>`;
  document.getElementById("create").onclick=()=>{const n=document.getElementById("gname").value.trim();if(!n)return;const id=uid();data.groups.push({id,name:n,memo:""});save();currentGroupId=id;screen="select";render()}
}
function renderManage(){
  main.innerHTML=`<button class="primary" id="add">＋ 選択肢を追加する</button>
  <div class="sectionTitle">全グループ共通（${data.choices.length}）</div>
  <div class="choiceList">${data.choices.length?data.choices.map(c=>`<div class="choiceRow">${c.image?`<img class="thumb" src="${c.image}">`:`<div class="thumb"></div>`}<div class="grow"><b>${esc(c.name)}</b></div><button class="smallBtn" data-edit="${c.id}">編集</button><button class="smallBtn danger" data-del="${c.id}">削除</button></div>`).join(""):`<div class="empty">選択肢がありません。</div>`}</div>`;
  document.getElementById("add").onclick=()=>choiceEditor();
  main.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>choiceEditor(b.dataset.edit));
  main.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("この共通選択肢を削除しますか？")){data.choices=data.choices.filter(c=>c.id!==b.dataset.del);data.records.forEach(r=>{if(r.choiceId===b.dataset.del){r.choiceId="";r.choiceName=""}});save();render()}});
}
async function choiceEditor(editId=null){
  const old=data.choices.find(c=>c.id===editId);
  const name=prompt("選択肢の名前",old?.name||"");
  if(name===null||!name.trim())return;
  const input=document.createElement("input");input.type="file";input.accept="image/*";
  if(old?.image&&!confirm("画像を変更しますか？\nキャンセルなら現在の画像を維持します。")){
    old.name=name.trim();save();render();return;
  }
  input.onchange=async()=>{
    let image=old?.image||null;
    if(input.files[0])image=await fileToData(input.files[0]);
    if(old){old.name=name.trim();old.image=image}
    else data.choices.push({id:uid(),name:name.trim(),image});
    save();render();
  };
  input.click();
}
function renderSelect(){
  const g=group();if(!g){screen="home";return render()}
  const chosen=data.choices.find(c=>c.id===selectedId);
  main.innerHTML=`${data.choices.length?`<div class="grid">${data.choices.map(c=>`<button class="cell ${selectedId===c.id?"selected":""}" data-c="${c.id}">${c.image?`<img src="${c.image}">`:`<div class="placeholder">＋</div>`}<div class="cellName">${esc(c.name)}</div></button>`).join("")}</div>`:`<div class="empty">選択肢がありません。ホームの「選択肢を管理」から追加してください。</div>`}
    <div class="memoArea"><label>📝 メモ</label><textarea id="recordMemo" placeholder="メモを入力してください"></textarea></div>
    <div class="confirm"><div class="note" style="text-align:center;margin-bottom:7px">${chosen?`選択中：${esc(chosen.name)}`:"選択肢は未選択（メモだけでも保存できます）"}</div><button id="confirm">完了</button></div>`;
  main.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.c;render()});
  document.getElementById("confirm").onclick=()=>{
    const memo=document.getElementById("recordMemo").value.trim(),c=data.choices.find(x=>x.id===selectedId);
    if(!c&&!memo){alert("選択肢を選ぶか、メモを入力してください。");return}
    data.records.unshift({id:uid(),groupId:g.id,groupName:g.name,choiceId:c?.id||"",choiceName:c?.name||"",memo,date:new Date().toISOString()});
    save();alert("記録しました");selectedId=null;render();
  }
}
function renderHistory(){
  if(!recordGroupId){
    const groupsWithRecords=data.groups.filter(g=>data.records.some(r=>r.groupId===g.id));
    main.innerHTML=groupsWithRecords.length?groupsWithRecords.map(g=>`<button class="historyGroup" data-record-group="${g.id}"><div class="groupIcon">▦</div><div><b>${esc(g.name)}</b><div class="muted">${data.records.filter(r=>r.groupId===g.id).length}件</div></div></button>`).join(""):`<div class="empty">まだ記録がありません。</div>`;
    main.querySelectorAll("[data-record-group]").forEach(b=>b.onclick=()=>{recordGroupId=b.dataset.recordGroup;render()});
    return;
  }
  const g=data.groups.find(x=>x.id===recordGroupId);
  if(!g){recordGroupId=null;render();return}
  const records=data.records.filter(r=>r.groupId===g.id).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  main.innerHTML=`<button class="backToGroups" id="backRecordGroups">‹ 記録グループ一覧</button><div class="recordGroupTitle">${esc(g.name)}</div>${records.length?`<div class="tableWrap"><table class="recordTable"><thead><tr><th>日付・時間</th><th>選択</th><th>メモ</th><th>編集</th></tr></thead><tbody>${records.map(r=>{const c=r.choiceId?data.choices.find(x=>x.id===r.choiceId):null;const choice=c?(c.image?`<img src="${c.image}" class="recordIcon" alt="${esc(c.name)}">`:`<span>${esc(c.name)}</span>`):"";return `<tr><td>${new Date(r.date).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</td><td class="recordChoice">${choice}</td><td class="recordMemoCell">${esc(r.memo||"")}</td><td><button class="rowEdit" data-record-edit="${r.id}">編集</button></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">このグループには記録がありません。</div>`}`;
  document.getElementById("backRecordGroups").onclick=()=>{recordGroupId=null;render()};
  main.querySelectorAll("[data-record-edit]").forEach(btn=>btn.onclick=()=>{
    const r=data.records.find(x=>String(x.id)===String(btn.dataset.recordEdit));if(!r)return;
    const list=data.choices.map((c,i)=>`${i+1}. ${c.name}`).join("\n");
    const current=r.choiceId?data.choices.findIndex(c=>c.id===r.choiceId)+1:"";
    const answer=prompt("選択肢を変更する場合は番号を入力してください。\n空欄＝選択肢なし\n\n"+list,String(current));if(answer===null)return;
    const memo=prompt("メモを編集",r.memo||"");if(memo===null)return;
    if(answer.trim()===""){r.choiceId="";r.choiceName=""}else{const n=parseInt(answer,10);if(!Number.isInteger(n)||n<1||n>data.choices.length){alert("正しい番号を入力してください。");return}const c=data.choices[n-1];r.choiceId=c.id;r.choiceName=c.name}
    r.memo=memo;save();render();
  });
}
back.onclick=()=>{if(screen==="select"||screen==="manage"||screen==="createGroup"){screen="home";render()}};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{screen=b.dataset.tab;if(screen==="history")recordGroupId=null;render();document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b))});
render();
