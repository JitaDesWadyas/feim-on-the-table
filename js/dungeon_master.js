import { q, qq, setVal } from './feim_utils.js';

let gameData = {};
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

export function deleteGameData(cat,id){
  gameData[cat] = (gameData[cat]||[]).filter(o=>o.id!==id);
  localStorage.setItem('gamedata', JSON.stringify(gameData));
  renderGameDataList();
  if(cat==='monsters') fillMonsterSelect();
}

export function spawnMonster(id){
  const src = (gameData.monsters||[]).find(m=>m.id===id);
  if(!src) return;
  const m = JSON.parse(JSON.stringify(src));
  m.cur = {
    hp: m.hp,
    stamina: m.stamina || 0,
    mana: m.mana || 0,
    time: m.time || 3
  };
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
  let html = '';
  ['skills','items','monsters'].forEach(cat=>{
    (gameData[cat]||[]).forEach(o=>{
      if(o.name.toLowerCase().includes(f))
        html += `<li>${o.name} <button class="delgd" data-cat="${cat}" data-id="${o.id}">×</button></li>`;
    });
  });
  q('#gamedataList').innerHTML = html || '<li><em>empty</em></li>';
  qq('.delgd').forEach(b=>b.onclick=_=>deleteGameData(b.dataset.cat,b.dataset.id));
}

function renderEncounter(){
  const area = q('#encounterArea');
  area.innerHTML = encounter.monsters.map((m,i)=>{
    return `<div class="monster-card"><strong>${m.name}</strong> <button class="del" data-i="${i}">×</button>
      <div class="slider-wrap">HP <input type="range" class="bar" data-i="${i}" data-k="hp" min="0" max="${m.hp}" value="${m.cur.hp}"><span>${m.cur.hp}</span></div>
      <div class="slider-wrap">ST <input type="range" class="bar" data-i="${i}" data-k="stamina" min="0" max="${m.stamina||0}" value="${m.cur.stamina}"><span>${m.cur.stamina}</span></div>
      <div class="slider-wrap">MP <input type="range" class="bar" data-i="${i}" data-k="mana" min="0" max="${m.mana||0}" value="${m.cur.mana}"><span>${m.cur.mana}</span></div>
      <div class="slider-wrap">TIME <input type="range" step="0.5" class="bar" data-i="${i}" data-k="time" min="0" max="${m.time||3}" value="${m.cur.time}"><span>${m.cur.time}</span></div>
      ${(m.skills||[]).map(s=>`<button class="act" data-s="${s}" data-i="${i}">${s}</button>`).join('')}
      <button class="btn endTurn" data-i="${i}">Finisci turno</button>
    </div>`;
  }).join('');
  qq('.del').forEach(b=>b.onclick=e=>{encounter.monsters.splice(b.dataset.i,1);renderEncounter();persistEncounter();});
  qq('.bar').forEach(sl=>sl.oninput=e=>{
    const m = encounter.monsters[sl.dataset.i];
    m.cur[sl.dataset.k] = +sl.value;
    sl.nextElementSibling.textContent = sl.value;
    persistEncounter();
  });
  qq('.endTurn').forEach(btn=>btn.onclick=_=>{
    const m = encounter.monsters[btn.dataset.i];
    m.cur.time = m.time || 3;
    if(m.stamina) m.cur.stamina = Math.min(m.stamina, (m.cur.stamina||0) + (m.regenStamina||1));
    if(m.mana) m.cur.mana = Math.min(m.mana, (m.cur.mana||0) + (m.regenMana||1));
    renderEncounter();
    persistEncounter();
  });
}

q('#saveBtn').onclick = () => {
  const type = q('#typeSel').value;
  const obj = {
    id: q('#name').value.trim().toLowerCase().replace(/\s+/g,'-'),
    name: q('#name').value.trim(),
    description: q('#desc').value.trim(),
    category: type
  };
  if(type==='skill'){
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
};

q('#typeSel').onchange = () => {
  qq('.type-fields').forEach(div=>div.style.display='none');
  q('#'+q('#typeSel').value+'Fields').style.display='block';
};

q('#addMonster').onclick = () => spawnMonster(q('#monsterSelect').value);
q('#filterInput').oninput = renderGameDataList;

loadGameData();
loadEncounter();
