const KEY="select_record_shared_v5";
const LEGACY_KEYS=["select_record_shared_v4","select_record_shared_v3","select_record_web_v2","select_record_web_v1"];
let data={groups:[],choices:[],records:[]};

const BUILTIN_ICONS=[
  ["amiibo","S3 Brand amiibo.png"],["アイロニック","S3 Brand Zink.png"],["アタリメイド","S3 Brand Cuttlegear.png"],
  ["アナアキ","S3 Brand Annaki.png"],["アロメ","S3 Brand Tentatek.png"],["エゾッコ","S3 Brand Zekko.png"],
  ["エゾッコリー","S3 Brand Z+F.png"],["エンペリー","S3 Brand Enperry.png"],["クマサン商会","S3 Brand Grizzco.png"],
  ["クラーゲス","S3 Brand Krak-On.png"],["シグレニ","S3 Brand Inkline.png"],["シチリン","S3 Brand Emberz.png"],
  ["ジモン","S3 Brand Splash Mob.png"],["タタキケンサキ","S3 Brand Toni Kensa.png"],["バトロイカ","S3 Brand SquidForce.png"],
  ["バラズシ","S3 Brand Barazushi.png"],["フォーリマ","S3 Brand Forge.png"],["ホタックス","S3 Brand Skalop.png"],
  ["ホッコリー","S3 Brand Firefin.png"],["ヤコ","S3 Brand Takoroka.png"],["ロッケンベルグ","S3 Brand Rockenberg.png"]
].map(([name,file])=>({id:"builtin_icon_"+name,name,image:"https://splatoonwiki.org/wiki/Special:Redirect/file/"+encodeURIComponent(file).replace(/%20/g,"_")}));

const BUILTIN_CHOICES=[
  ["インク効率アップ(メイン)","S3 Ability Ink Saver (Main).png"],["インク効率アップ(サブ)","S3 Ability Ink Saver (Sub).png"],
  ["インク回復力アップ","S3 Ability Ink Recovery Up.png"],["ヒト移動速度アップ","S3 Ability Run Speed Up.png"],
  ["イカダッシュ速度アップ","S3 Ability Swim Speed Up.png"],["スペシャル増加量アップ","S3 Ability Special Charge Up.png"],
  ["スペシャル減少量ダウン","S3 Ability Special Saver.png"],["スペシャル性能アップ","S3 Ability Special Power Up.png"],
  ["復活時間短縮","S3 Ability Quick Respawn.png"],["スーパージャンプ時間短縮","S3 Ability Quick Super Jump.png"],
  ["サブ性能アップ","S3 Ability Sub Power Up.png"],["相手インク影響軽減","S3 Ability Ink Resistance Up.png"],
  ["サブ影響軽減","S3 Ability Sub Resistance Up.png"],["アクション強化","S3 Ability Intensify Action.png"],
  ["ラストスパート","S3 Ability Last-Ditch Effort.png"],["逆境強化","S3 Ability Tenacity.png"],
  ["カムバック","S3 Ability Comeback.png"],["イカニンジャ","S3 Ability Ninja Squid.png"],
  ["リベンジ","S3 Ability Haunt.png"],["サーマルインク","S3 Ability Thermal Ink.png"],
  ["復活ペナルティアップ","S3 Ability Respawn Punisher.png"],["追加ギアパワー倍化","S3 Ability Ability Doubler.png"],
  ["ステルスジャンプ","S3 Ability Stealth Jump.png"],["対物攻撃力アップ","S3 Ability Object Shredder.png"],
  ["スタートダッシュ","S3 Ability Opening Gambit.png"],["受け身術","S3 Ability Drop Roller.png"]
].map(([name,file])=>({id:"builtin_choice_"+name,name,image:"https://splatoonwiki.org/wiki/Special:Redirect/file/"+encodeURIComponent(file).replace(/%20/g,"_")}));

function applyBuiltins(){
  const oldChoiceByName=new Map(data.choices.map(c=>[c.name,c]));
  data.icons=BUILTIN_ICONS.map(i=>({...i}));
  data.choices=BUILTIN_CHOICES.map(c=>({...c}));
  data.groups.forEach(g=>{
    if(g.icon&&!data.icons.some(i=>i.image===g.icon))g.icon=null;
  });
  data.records.forEach(r=>{
    const c=oldChoiceByName.get(r.choiceName);
    if(c){const next=data.choices.find(x=>x.name===c.name);if(next){r.choiceId=next.id;r.choiceName=next.name;}}
    else if(r.choiceId&&!data.choices.some(x=>x.id===r.choiceId)){r.choiceId="";r.choiceName="";}
  });
  save();
}


function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():"id_"+Date.now()+"_"+Math.random().toString(36).slice(2)}
function normalize(raw){
  if(!raw||typeof raw!=="object")return null;
  const out={groups:[],choices:[],records:[],icons:[]};
  if(Array.isArray(raw.groups)) raw.groups.forEach(g=>{
    if(!g)return;
    const group={id:String(g.id||uid()),name:String(g.name||"無題のグループ"),memo:g.memo||"",icon:g.icon||null,createdAt:g.createdAt||g.created_at||0};
    if(!out.groups.some(x=>x.id===group.id))out.groups.push(group);
    if(Array.isArray(g.choices))g.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})});
  });
  if(Array.isArray(raw.choices))raw.choices.forEach(c=>{if(c)out.choices.push({id:String(c.id||uid()),name:String(c.name||""),image:c.image||null})});
  if(Array.isArray(raw.icons))raw.icons.forEach(i=>{if(i)out.icons.push({id:String(i.id||uid()),name:String(i.name||""),image:i.image||i.src||null})});
  out.groups.forEach(g=>{if(g.icon&&!out.icons.some(i=>i.image===g.icon))out.icons.push({id:uid(),name:g.name+" のアイコン",image:g.icon})});
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
  add.icons.forEach(i=>{if(!i||!i.image)return;const same=base.icons.find(x=>x.id===i.id||x.image===i.image);if(!same)base.icons.push(i);});
}
function migrate(){
  const merged={groups:[],choices:[],records:[],icons:[]}, candidates=[];
  try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(v)candidates.push(v)}catch(e){}
  LEGACY_KEYS.forEach(k=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");if(v)candidates.push(v)}catch(e){}});
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k||k===KEY||LEGACY_KEYS.includes(k))continue;
      try{const v=JSON.parse(localStorage.getItem(k));if(v&&(Array.isArray(v.groups)||Array.isArray(v.choices)||Array.isArray(v.records)||Array.isArray(v.icons)))candidates.push(v)}catch(e){}
    }
  }catch(e){}
  candidates.forEach(v=>merge(merged,normalize(v)));
  data=merged;
  localStorage.setItem(KEY,JSON.stringify(data));
}
migrate();
applyBuiltins();

let screen="home",currentGroupId=null,selectedId=null,recordGroupId=null;
let homeFilterIcon=null,historyFilterIcon=null,homeSort="created",historySort="created";
const main=document.getElementById("main"),title=document.getElementById("title"),back=document.getElementById("backBtn");
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function group(){return data.groups.find(g=>g.id===currentGroupId)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fileToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function render(){
  main.style.paddingBottom="88px";
  title.textContent=screen==="home"?"ホーム":screen==="history"?"記録":screen==="createGroup"?"グループを作る":screen==="manage"?"選択肢を管理":screen==="icons"?"アイコンを管理":screen==="pickIcon"?"アイコンを選択":group()?.name||"選択";
  back.classList.toggle("hidden",["home","history"].includes(screen));
  if(screen==="home")renderHome();
  else if(screen==="history")renderHistory();
  else if(screen==="createGroup")renderCreateGroup();
  else if(screen==="manage")renderManage();
  else if(screen==="icons")renderIcons();
  else if(screen==="pickIcon")renderPickIcon();
  else if(screen==="select")renderSelect();
}
function sortGroups(list, mode){
  return list.slice().sort((a,b)=>{
    if(mode==="name") return a.name.localeCompare(b.name,"ja");
    const at=a.createdAt?new Date(a.createdAt).getTime():0, bt=b.createdAt?new Date(b.createdAt).getTime():0;
    return bt-at;
  });
}
function iconByImage(image){return data.icons.find(i=>i.image===image)||null}
function iconFilterLabel(image){return "アイコンで絞り込み中"}
function showIconFilter(kind){
  const icons=data.icons.filter(i=>i.image);
  if(!icons.length){alert("登録されたアイコンがありません。");return}
  const current=kind==="home"?homeFilterIcon:historyFilterIcon;
  openChoiceModal("絞り込み", icons.map(i=>({id:i.id,label:"",image:i.image,selected:i.image===current})), item=>{
    if(kind==="home") homeFilterIcon=item.image; else historyFilterIcon=item.image;
    render();
  }, {
    clearLabel:"",
    onClear:()=>{
      if(kind==="home") homeFilterIcon=null; else historyFilterIcon=null;
      render();
    }
  });
}
function showSort(kind){
  const current=kind==="home"?homeSort:historySort;
  openChoiceModal("並び替え", [
    {id:"name",label:"50音順",selected:current==="name"},
    {id:"created",label:"作成日順",selected:current==="created"}
  ], item=>{
    if(kind==="home") homeSort=item.id; else historySort=item.id;
    render();
  });
}
function openChoiceModal(titleText,items,onPick,options={}){
  const wrap=document.createElement("div");
  wrap.className="choiceModal";
  wrap.innerHTML=`<div class="choiceModalBackdrop"></div><div class="choiceModalPanel"><div class="choiceModalTitle">${esc(titleText)}</div><div class="choiceModalList">${items.map(i=>`<button class="modalChoice ${i.selected?"selected":""}" data-modal-id="${esc(i.id)}">${i.image?`<img src="${esc(i.image)}" alt="">`:``}${i.label?`<span>${esc(i.label)}</span>`:""}</button>`).join("")}</div>${options.clearLabel?`<button class="filterClearBtn">${esc(options.clearLabel)}</button>`:""}<button class="modalCancel">キャンセル</button></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector(".choiceModalBackdrop").onclick=()=>wrap.remove();
  wrap.querySelector(".modalCancel").onclick=()=>wrap.remove();
  const clearBtn=wrap.querySelector(".filterClearBtn");
  if(clearBtn) clearBtn.onclick=()=>{wrap.remove();if(options.onClear)options.onClear()};
  wrap.querySelectorAll("[data-modal-id]").forEach(b=>b.onclick=()=>{const item=items.find(i=>i.id===b.dataset.modalId);wrap.remove();if(item)onPick(item)});
}
function renderHome(){
  let groups=data.groups;
  if(homeFilterIcon) groups=groups.filter(g=>g.icon===homeFilterIcon);
  groups=sortGroups(groups,homeSort);
  main.innerHTML=`<button class="primary" id="newGroup">＋ 新しいグループを作る</button>
  <div class="homeControlRow"><button class="secondary controlBtn" id="homeFilter">絞り込み</button><button class="secondary controlBtn" id="homeSort">並び替え</button></div>
  ${homeFilterIcon?`<div class="activeFilter">アイコンで絞り込み中</div>`:""}
  <div class="sectionTitle">グループ一覧</div>
  ${groups.length?groups.map(g=>`<div class="groupItem">
    <button class="groupCard" data-g="${g.id}">${g.icon?`<img class="groupIcon groupImage" src="${esc(g.icon)}" alt="">`:`<div class="groupIcon">📝</div>`}<div><b>${esc(g.name)}</b></div></button>
    <div class="groupActions"><button class="editGroupBtn" data-edit-group="${g.id}">編集</button><button class="deleteGroupBtn" data-delete-group="${g.id}">削除</button></div>
  </div>`).join(""):`<div class="empty">${homeFilterIcon?"このアイコンのグループはありません。":"まだグループがありません。<br>「新しいグループを作る」から始めてください。"}</div>`}`;
  document.getElementById("newGroup").onclick=()=>{screen="createGroup";render()};
  document.getElementById("homeFilter").onclick=()=>{if(homeFilterIcon){homeFilterIcon=null;render()}else{showIconFilter("home")}};
  document.getElementById("homeSort").onclick=()=>showSort("home");
  main.querySelectorAll("[data-edit-group]").forEach(b=>b.onclick=()=>editGroupIcon(b.dataset.editGroup));
  main.querySelectorAll("[data-delete-group]").forEach(b=>b.onclick=()=>{
    const g=data.groups.find(x=>x.id===b.dataset.deleteGroup);if(!g)return;
    if(!confirm(`「${g.name}」を削除しますか？\nこのグループの記録も削除されます。`))return;
    data.groups=data.groups.filter(x=>x.id!==g.id);data.records=data.records.filter(r=>r.groupId!==g.id);if(currentGroupId===g.id)currentGroupId=null;save();render();
  });
  main.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{currentGroupId=b.dataset.g;selectedId=null;screen="select";render()});
}

let editingGroupIconId=null;
function editGroupIcon(groupId){
  if(!data.groups.some(x=>x.id===groupId))return;
  editingGroupIconId=groupId;
  screen="pickIcon";
  render();
}
function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function renderCreateGroup(step=1){
  const icons=data.icons||[], choices=data.choices||[];
  const cur=window.__creatingGroup||{icon:null,name:"",choiceIds:[]};
  window.__creatingGroup=cur;
  if(step===1){
    main.innerHTML=`<section class="panel"><h2>グループを作る</h2>
      <div class="stepTitle">① アイコンを選択</div>
      <div class="pickerGrid">${icons.map(ic=>`<button class="pickerItem ${cur.icon===ic.id?'selected':''}" data-group-icon="${ic.id}">${ic.image?`<img src="${ic.image}" alt="">`:(ic.label||"＋")}</button>`).join("")}</div>
      <button class="primary" id="nextGroupStep">次へ</button><button class="secondary" id="cancelGroup">キャンセル</button></section>`;
    main.querySelectorAll("[data-group-icon]").forEach(b=>b.onclick=()=>{cur.icon=b.dataset.groupIcon;renderCreateGroup(1)});
    main.querySelector("#nextGroupStep").onclick=()=>cur.icon?renderCreateGroup(2):alert("アイコンを選択してください");
  }else if(step===2){
    main.innerHTML=`<section class="panel"><h2>グループを作る</h2>
      <div class="stepTitle">② 名前を入力</div><input id="groupNameInput" class="textInput" type="text" placeholder="グループ名を入力" value="${escapeHtml(cur.name||"")}">
      <button class="primary" id="nextGroupStep">次へ</button><button class="secondary" id="backGroupStep">戻る</button></section>`;
    main.querySelector("#groupNameInput").oninput=e=>cur.name=e.target.value;
    main.querySelector("#nextGroupStep").onclick=()=>{cur.name=(cur.name||"").trim();cur.name?renderCreateGroup(3):alert("グループ名を入力してください")};
    main.querySelector("#backGroupStep").onclick=()=>renderCreateGroup(1);
  }else{
    main.innerHTML=`<section class="panel"><h2>グループを作る</h2>
      <div class="stepTitle">③ 選択肢を選択</div><div class="pickerGrid">${choices.map(ch=>`<button class="choicePickerItem ${cur.choiceIds.includes(ch.id)?'selected':''}" data-group-choice="${ch.id}">${ch.image?`<img src="${ch.image}" alt="">`:(ch.label||ch.name||"")}</button>`).join("")}</div>
      <button class="primary" id="finishCreateGroup">完了</button><button class="secondary" id="backGroupStep">戻る</button></section>`;
    main.querySelectorAll("[data-group-choice]").forEach(b=>b.onclick=()=>{const id=b.dataset.groupChoice;cur.choiceIds=cur.choiceIds.includes(id)?cur.choiceIds.filter(x=>x!==id):[...cur.choiceIds,id];b.classList.toggle("selected",cur.choiceIds.includes(id))});
    main.querySelector("#backGroupStep").onclick=()=>renderCreateGroup(2);
    main.querySelector("#finishCreateGroup").onclick=()=>{data.groups=data.groups||[];data.groups.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:cur.name,icon:cur.icon,choiceIds:[...cur.choiceIds],createdAt:Date.now()});window.__creatingGroup=null;save();render()};
  }
}

function renderIcons(){
  main.innerHTML=`<div class="sectionTitle">初期アイコン（${data.icons.length}）</div>
  <div class="grid">${data.icons.map(i=>`<button class="cell" disabled><img src="${esc(i.image)}" alt=""></button>`).join("")}</div>`;
}
async function iconEditor(editId=null){
  const old=data.icons.find(i=>i.id===editId);
  const input=document.createElement("input");input.type="file";input.accept="image/*";
  input.onchange=async()=>{
    const file=input.files?.[0];if(!file)return;
    const image=await fileToData(file);
    const name=prompt("アイコン名",old?.name||"アイコン");if(name===null)return;
    if(old){const prev=old.image;old.name=name.trim()||"アイコン";old.image=image;data.groups.forEach(g=>{if(g.icon===prev)g.icon=image})}
    else data.icons.push({id:uid(),name:name.trim()||"アイコン",image});
    save();render();
  };
  input.click();
}
function renderPickIcon(){
  main.innerHTML=`${data.icons.length?`<div class="grid">${data.icons.map(i=>`<button class="cell" data-pick-icon="${i.id}"><img src="${esc(i.image)}" alt=""></button>`).join("")}</div>`:`<div class="empty">アイコンがありません。</div>`}`;
  main.querySelectorAll("[data-pick-icon]").forEach(b=>b.onclick=()=>{
    const i=data.icons.find(x=>x.id===b.dataset.pickIcon);
    if(!i)return;
    if(editingGroupIconId){
      const g=data.groups.find(x=>x.id===editingGroupIconId);
      if(g){g.icon=i.image;save();}
      editingGroupIconId=null; screen="home"; render(); return;
    }
    screen="createGroup"; render();
    const preview=document.getElementById("groupIconPreview");
    preview.outerHTML=`<img id="groupIconPreview" class="groupIcon groupImage" src="${esc(i.image)}" alt="">`;
    document.getElementById("groupIconText").textContent="アイコンを変更";
    window.__selectedGroupIcon=i.image;
  });
}
function renderManage(){
  main.innerHTML=`<div class="sectionTitle">初期選択肢（${data.choices.length}）</div>
  <div class="grid">${data.choices.map(c=>`<button class="cell" disabled><img src="${esc(c.image)}" alt=""></button>`).join("")}</div>`;
}
function choiceEditor(){return;}
function renderSelect(){
  const g=group();if(!g){screen="home";return render()}
  const chosen=data.choices.find(c=>c.id===selectedId);
  main.innerHTML=`${data.choices.length?`<div class="grid">${data.choices.map(c=>`<button class="cell ${selectedId===c.id?"selected":""}" data-c="${c.id}"><img src="${esc(c.image)}" alt=""></button>`).join("")}</div>`:`<div class="empty">選択肢がありません。</div>`}
    <div class="memoArea"><label>📝 メモ</label><textarea id="recordMemo" placeholder="メモを入力してください"></textarea></div>
    <div class="confirm"><div class="note" style="text-align:center;margin-bottom:7px">${chosen?`選択中：<img src="${esc(chosen.image)}" class="recordIcon" alt="">`:"選択肢は未選択（メモだけでも保存できます）"}</div><button id="confirm">完了</button></div>`;
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
    let groupsWithRecords=data.groups.filter(g=>data.records.some(r=>r.groupId===g.id));
    if(historyFilterIcon) groupsWithRecords=groupsWithRecords.filter(g=>g.icon===historyFilterIcon);
    groupsWithRecords=sortGroups(groupsWithRecords,historySort);
    main.innerHTML=`<div class="historyControlRow"><button class="secondary controlBtn" id="historyFilter">絞り込み</button><button class="secondary controlBtn" id="historySort">並び替え</button></div>${historyFilterIcon?`<div class="activeFilter">アイコンで絞り込み中</div>`:""}${groupsWithRecords.length?groupsWithRecords.map(g=>`<button class="historyGroup" data-record-group="${g.id}">${g.icon?`<img class="groupIcon groupImage" src="${esc(g.icon)}" alt="">`:`<div class="groupIcon">📝</div>`}<div><b>${esc(g.name)}</b><div class="muted">${data.records.filter(r=>r.groupId===g.id).length}件</div></div></button>`).join(""):`<div class="empty">${historyFilterIcon?"このアイコンの記録はありません。":"まだ記録がありません。"}</div>`}`;
    document.getElementById("historyFilter").onclick=()=>{if(historyFilterIcon){historyFilterIcon=null;render()}else{showIconFilter("history")}};
    document.getElementById("historySort").onclick=()=>showSort("history");
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
    const list=data.choices.map((c,i)=>`${i+1}. ${c.name}`).join("\n");const current=r.choiceId?data.choices.findIndex(c=>c.id===r.choiceId)+1:"";
    const answer=prompt("選択肢を変更する場合は番号を入力してください。\n空欄＝選択肢なし\n\n"+list,String(current));if(answer===null)return;
    const memo=prompt("メモを編集",r.memo||"");if(memo===null)return;
    if(answer.trim()===""){r.choiceId="";r.choiceName=""}else{const n=parseInt(answer,10);if(!Number.isInteger(n)||n<1||n>data.choices.length){alert("正しい番号を入力してください。");return}const c=data.choices[n-1];r.choiceId=c.id;r.choiceName=c.name}
    r.memo=memo;save();render();
  });
}

back.onclick=()=>{if(screen==="pickIcon"){screen="createGroup";render();return}if(screen==="select"||screen==="manage"||screen==="createGroup"||screen==="icons"){screen="home";render()}};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{screen=b.dataset.tab;if(screen==="history")recordGroupId=null;render();document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b))});
render();

// v14: filter button toggles between opening icon selection and clearing an active filter.
function toggleFilter(){
  if (typeof state !== "undefined" && state.filterIcon) {
    state.filterIcon = null;
    if (typeof save === "function") save();
    if (typeof render === "function") render();
    return;
  }
  if (typeof openFilterPicker === "function") {
    openFilterPicker();
  } else if (typeof showFilterPicker === "function") {
    showFilterPicker();
  }
}

function toggleFilterButton(){
  try {
    const active =
      (typeof state !== "undefined" && (state.filterIcon || state.filterByIcon)) ||
      (typeof appState !== "undefined" && (appState.filterIcon || appState.filterByIcon));
    if (active) {
      if (typeof state !== "undefined") {
        if ("filterIcon" in state) state.filterIcon = null;
        if ("filterByIcon" in state) state.filterByIcon = null;
      }
      if (typeof appState !== "undefined") {
        if ("filterIcon" in appState) appState.filterIcon = null;
        if ("filterByIcon" in appState) appState.filterByIcon = null;
      }
      if (typeof save === "function") save();
      if (typeof render === "function") render();
      return;
    }
  } catch(e) {}
  if (typeof openFilterPicker === "function") openFilterPicker();
  else if (typeof showFilterPicker === "function") showFilterPicker();
}
