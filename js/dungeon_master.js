import { q, qq, setVal } from './feim_utils.js';

let gameData = {};
let encounter = { turn: 1, monsters: [], log: [] };

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
  encounter.monsters.push(m);
  renderEncounter();
  persistEncounter();
}

export function updateBar(node,val){
  setVal(node,val);
  node.nextElementSibling.textContent = val;
}

export function log(msg){
  encounter.log.push(msg);
  const li = document.createElement('li');
  li.textContent = msg;
  q('#log').appendChild(li);
  persistEncounter();
}

export function nextTurn(){
  encounter.turn++;
  log('Turno '+encounter.turn);
}

function persistEncounter(){
  sessionStorage.setItem('encounter', JSON.stringify(encounter));
}

function loadEncounter(){
  const ls = sessionStorage.getItem('encounter');
  if(ls) encounter = JSON.parse(ls);
  renderEncounter();
  q('#log').innerHTML = encounter.log.map(l=>`<li>${l}</li>`).join('');
}

function fillMonsterSelect(){
  const sel = q('#monsterSelect');
  sel.innerHTML = (gameData.monsters||[]).map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
}

function renderGameDataList(){
  const f = q('#filterInput').value.toLowerCase();
  const lists = [...(gameData.skills||[]),(gameData.items||[]),...(gameData.monsters||[])].flat();
  q('#gamedataList').innerHTML = lists.filter(o=>o.name.toLowerCase().includes(f)).map(o=>`<li>${o.name}</li>`).join('');
}

function renderEncounter(){
  const area = q('#encounterArea');
  area.innerHTML = encounter.monsters.map((m,i)=>{
    return `<div class="monster-card"><strong>${m.name}</strong> <button class="del" data-i="${i}">×</button>
      <div class="slider-wrap">HP <input type="range" class="bar" data-i="${i}" data-k="hp" min="0" max="${m.hp}" value="${m.hp}"><span>${m.hp}</span></div>
      <div class="slider-wrap">ST <input type="range" class="bar" data-i="${i}" data-k="stamina" min="0" max="${m.stamina||0}" value="${m.stamina||0}"><span>${m.stamina||0}</span></div>
      <div class="slider-wrap">MP <input type="range" class="bar" data-i="${i}" data-k="mana" min="0" max="${m.mana||0}" value="${m.mana||0}"><span>${m.mana||0}</span></div>
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
q('#nextTurn').onclick = nextTurn;

loadGameData();
loadEncounter();
