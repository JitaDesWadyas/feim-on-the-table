import { q, qq, setVal } from './feim_utils.js';

let gameData = {};
let currentObj = null;
let encounter = { monsters: [] };

export async function loadGameData(){
  const ls = localStorage.getItem('gamedata');
  if(ls){
    gameData = JSON.parse(ls);
    renderGameDataList();
    fillMonsterSelect();
  }else{
    const d = await fetch('gamedata.json').then(r=>r.json());
    gameData = d;
    localStorage.setItem('gamedata', JSON.stringify(d));
    renderGameDataList();
    fillMonsterSelect();
  }
}

export function saveGameData(obj){
  const key = obj.category + 's';
  gameData[key] = gameData[key] || [];
  const idx = gameData[key].findIndex(o=>o.id===obj.id);
  if(idx>-1) gameData[key][idx] = obj; else gameData[key].push(obj);
  localStorage.setItem('gamedata', JSON.stringify(gameData));
  renderGameDataList();
  fillMonsterSelect();
}

export function spawnMonster(id){
  const src = (gameData.monsters||[]).find(m=>m.id===id);
  if(!src) return;
  const m = JSON.parse(JSON.stringify(src));
  m.maxHp = m.hp;
  m.maxStamina = m.stamina||0;
  m.maxMana = m.mana||0;
  m.stamina = m.maxStamina;
  m.mana = m.maxMana;
  m.time = 3;
  m.maxTime = 3;
  encounter.monsters.push(m);
  renderEncounter();
  persistEncounter();
}

export function updateBar(node,val){
  setVal(node,val);
  node.nextElementSibling.textContent = val;
}


function persistEncounter(){
  sessionStorage.setItem('encounter', JSON.stringify(encounter));
}

function loadEncounter(){
  const ls = sessionStorage.getItem('encounter');
  if(ls) encounter = JSON.parse(ls);
  renderEncounter();
}

function fillMonsterSelect(){
  const sel = q('#monsterSelect');
  sel.innerHTML = (gameData.monsters||[]).map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
}

function renderGameDataList(){
  const f = q('#filterInput').value.toLowerCase();
  const lists = [
    ...(gameData.skills || []),
    ...(gameData.spells || []),
    ...(gameData.items || []),
    ...(gameData.monsters || [])
  ];
  q('#gamedataList').innerHTML = lists
    .filter(o => o.name.toLowerCase().includes(f))
    .map(o=>`<li data-id="${o.id}" data-cat="${o.category}">${o.name} <button class="del-entry" data-id="${o.id}" data-cat="${o.category}">×</button></li>`)
    .join('');
}

function loadEntry(cat,id){
  const obj = (gameData[cat+'s']||[]).find(o=>o.id===id);
  if(!obj) return;
  currentObj = obj;
  q('#typeSel').value = cat;
  q('#typeSel').dispatchEvent(new Event('change'));
  q('#name').value = obj.name||'';
  q('#desc').value = obj.description||'';
  q('#gd_damage').value = obj.damage||'';
  q('#gd_cooldown').value = obj.cooldown||'';
  q('#gd_element').value = obj.element||'';
  q('#gd_rarity').value = obj.rarity||'';
  q('#gd_effect').value = obj.effect||'';
  q('#gd_stack').value = obj.stack||1;
  q('#gd_hp').value = obj.hp||0;
  q('#gd_stamina').value = obj.stamina||0;
  q('#gd_mana').value = obj.mana||0;
  q('#gd_baseAtk').value = obj.baseAtk||'';
  q('#gd_loot').value = obj.loot||'';
  q('#delBtn').style.display = 'inline-block';
}

function clearFields(){
  currentObj = null;
  q('#name').value='';
  q('#desc').value='';
  ['gd_damage','gd_cooldown','gd_element','gd_rarity','gd_effect','gd_stack','gd_hp','gd_stamina','gd_mana','gd_baseAtk','gd_loot']
    .forEach(id=>{const el=q('#'+id);el.value=el.type==='number'?0:'';});
  q('#delBtn').style.display='none';
}

function deleteGameData(cat,id){
  const key = cat+'s';
  gameData[key] = (gameData[key]||[]).filter(o=>o.id!==id);
  localStorage.setItem('gamedata', JSON.stringify(gameData));
  renderGameDataList();
  fillMonsterSelect();
}

function renderEncounter(){
  const area = q('#encounterArea');
  area.innerHTML = encounter.monsters.map((m,i)=>{
    return `<div class="monster-card"><strong>${m.name}</strong> <button class="del" data-i="${i}">×</button>
      <div class="slider-wrap">HP <input type="range" class="bar" data-i="${i}" data-k="hp" min="0" max="${m.maxHp}" value="${m.hp}"><span>${m.hp}</span></div>
      <div class="slider-wrap">ST <input type="range" class="bar" data-i="${i}" data-k="stamina" min="0" max="${m.maxStamina}" value="${m.stamina}"><span>${m.stamina}</span></div>
      <div class="slider-wrap">MP <input type="range" class="bar" data-i="${i}" data-k="mana" min="0" max="${m.maxMana}" value="${m.mana}"><span>${m.mana}</span></div>
      <div class="slider-wrap">TIME <input type="range" class="bar" data-i="${i}" data-k="time" min="0" max="${m.maxTime}" value="${m.time}"><span>${m.time}</span></div>
      <button class="finish" data-i="${i}">End Turn</button>
      ${(m.skills||[]).map(s=>`<button class="act" data-s="${s}" data-i="${i}">${s}</button>`).join('')}
    </div>`;
  }).join('');
  qq('.del').forEach(b=>b.onclick=e=>{encounter.monsters.splice(b.dataset.i,1);renderEncounter();persistEncounter();});
  qq('.bar').forEach(sl=>sl.oninput=e=>{
    const i = +sl.dataset.i;
    const key = sl.dataset.k;
    encounter.monsters[i][key] = +sl.value;
    sl.nextElementSibling.textContent = sl.value;
    persistEncounter();
  });
  qq('.finish').forEach(b=>b.onclick=e=>finishTurn(+b.dataset.i));
}

function finishTurn(i){
  const m = encounter.monsters[i];
  if(!m) return;
  m.time = m.maxTime;
  if(m.maxStamina>0) m.stamina = Math.min(m.maxStamina, m.stamina + 1);
  if(m.maxMana>0) m.mana = Math.min(m.maxMana, m.mana + 1);
  renderEncounter();
  persistEncounter();
}

q('#saveBtn').onclick = () => {
  const type = q('#typeSel').value;
  const obj = currentObj || {};
  obj.id = q('#name').value.trim().toLowerCase().replace(/\s+/g,'-');
  obj.name = q('#name').value.trim();
  obj.description = q('#desc').value.trim();
  obj.category = type;
  if(type==='skill' || type==='spell'){
    obj.damage = q('#gd_damage').value;
    obj.cooldown = q('#gd_cooldown').value;
    obj.element = q('#gd_element').value;
  }else if(type==='item'){
    obj.rarity = q('#gd_rarity').value;
    obj.effect = q('#gd_effect').value;
    obj.stack = +q('#gd_stack').value||1;
  }else{
    obj.hp = +q('#gd_hp').value||0;
    obj.stamina = +q('#gd_stamina').value||0;
    obj.mana = +q('#gd_mana').value||0;
    obj.baseAtk = q('#gd_baseAtk').value;
    obj.loot = q('#gd_loot').value;
  }
  saveGameData(obj);
  clearFields();
};

q('#typeSel').onchange = () => {
  qq('.type-fields').forEach(div=>div.style.display='none');
  const val = q('#typeSel').value;
  if(val==='skill' || val==='spell') q('#skillFields').style.display='block';
  else q('#'+val+'Fields').style.display='block';
};

q('#addMonster').onclick = () => spawnMonster(q('#monsterSelect').value);
q('#filterInput').oninput = renderGameDataList;
q('#gamedataList').onclick = e => {
  const del = e.target.closest('.del-entry');
  if(del){
    deleteGameData(del.dataset.cat, del.dataset.id);
    if(currentObj && currentObj.id===del.dataset.id) clearFields();
    return;
  }
  const li = e.target.closest('li[data-id]');
  if(li) loadEntry(li.dataset.cat, li.dataset.id);
};
q('#delBtn').onclick = () => {
  if(currentObj) {
    deleteGameData(currentObj.category, currentObj.id);
    clearFields();
  }
};

loadGameData();
loadEncounter();
