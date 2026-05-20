import { dealHand, damageMultiplier, ELEMENT_COLOR } from './cards.js';

const state = {
  player: { hand: [], active: null },
  opponent: { hand: [], active: null },
  selected: null,
  turn: 'player',
  over: false,
};

const els = {
  playerHand: document.getElementById('player-hand'),
  opponentHand: document.getElementById('opponent-hand'),
  playerSlot: document.getElementById('player-slot'),
  opponentSlot: document.getElementById('opponent-slot'),
  attackBtn: document.getElementById('attack-btn'),
  newGameBtn: document.getElementById('new-game'),
  status: document.getElementById('status'),
  log: document.getElementById('log'),
};

function newGame() {
  state.player.hand = dealHand(4);
  state.opponent.hand = dealHand(4);
  state.player.active = null;
  state.opponent.active = null;
  state.selected = null;
  state.turn = 'player';
  state.over = false;
  els.log.innerHTML = '';
  log('system', 'A new duel begins!');
  setStatus('Click a card to send it into the arena.');
  render();
}

function render() {
  renderHand(els.playerHand, state.player.hand, 'player');
  renderHand(els.opponentHand, state.opponent.hand, 'opponent');
  renderSlot(els.playerSlot, state.player.active, 'player');
  renderSlot(els.opponentSlot, state.opponent.active, 'opponent');

  els.attackBtn.disabled = state.over
    || state.turn !== 'player'
    || !state.player.active
    || !state.opponent.active;
}

function renderHand(container, hand, side) {
  container.innerHTML = '';
  for (const card of hand) {
    const el = makeCardEl(card, { active: false });
    if (side === 'opponent') {
      el.style.cursor = 'default';
    } else {
      if (state.selected === card.instanceId) el.classList.add('selected');
      if (card.currentHp <= 0) el.classList.add('fainted');
      if (state.player.active?.instanceId === card.instanceId) el.classList.add('selected');
      el.addEventListener('click', () => onPlayerCardClick(card));
    }
    container.appendChild(el);
  }
}

function renderSlot(slot, card, side) {
  slot.innerHTML = '';
  if (!card) {
    slot.classList.add('empty');
    return;
  }
  slot.classList.remove('empty');
  const el = makeCardEl(card, { active: true });
  el.dataset.slotSide = side;
  slot.appendChild(el);
}

function makeCardEl(card, { active }) {
  const el = document.createElement('div');
  el.className = 'card' + (active ? ' active' : '');
  el.dataset.instanceId = card.instanceId;
  const hpPct = Math.max(0, (card.currentHp / card.hp) * 100);
  el.innerHTML = `
    <div class="art" style="background-image:url('./cards/${card.id}.png')"></div>
    <div class="info">
      <div class="name">${card.name}</div>
      <span class="element" style="background:${ELEMENT_COLOR[card.element]}">${card.element}</span>
      <div class="stats">
        <span class="atk">⚔ ${card.atk}</span>
        <span class="hp">♥ ${card.currentHp}/${card.hp}</span>
      </div>
      <div class="hpbar"><div style="width:${hpPct}%"></div></div>
    </div>
  `;
  return el;
}

function onPlayerCardClick(card) {
  if (state.over || state.turn !== 'player') return;
  if (card.currentHp <= 0) return;
  state.player.active = card;
  state.selected = card.instanceId;

  if (!state.opponent.active) {
    cpuChooseActive();
  }
  setStatus('Press Attack to strike!');
  render();
}

function cpuChooseActive() {
  const alive = state.opponent.hand.filter(c => c.currentHp > 0);
  if (!alive.length) return;
  const target = state.player.active;
  let best = alive[0];
  let bestScore = -Infinity;
  for (const c of alive) {
    const offense = c.atk * (target ? damageMultiplier(c.element, target.element) : 1);
    const defense = c.currentHp - (target ? target.atk * damageMultiplier(target.element, c.element) : 0);
    const score = offense * 1.2 + defense * 0.4 + Math.random() * 2;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  state.opponent.active = best;
  log('opponent', `Opponent sends out ${best.name}.`);
}

function ensureActives() {
  if (!state.player.active || state.player.active.currentHp <= 0) {
    const alive = state.player.hand.find(c => c.currentHp > 0);
    state.player.active = alive || null;
  }
  if (!state.opponent.active || state.opponent.active.currentHp <= 0) {
    cpuChooseActive();
  }
}

async function attack(attacker, defender, fromSide) {
  const mult = damageMultiplier(attacker.element, defender.element);
  const dmg = Math.max(1, Math.round(attacker.atk * mult));
  defender.currentHp = Math.max(0, defender.currentHp - dmg);

  const effectiveness = mult > 1 ? ' Super effective!' : mult < 1 ? ' Not very effective.' : '';
  log(fromSide, `${attacker.name} hits ${defender.name} for ${dmg}.${effectiveness}`);

  render();
  flashHit(defender.instanceId);
  await sleep(400);

  if (defender.currentHp <= 0) {
    log('system', `${defender.name} fainted!`);
    if (fromSide === 'player') state.opponent.active = null;
    else state.player.active = null;
  }
}

function flashHit(instanceId) {
  const nodes = document.querySelectorAll(`.card[data-instance-id="${instanceId}"]`);
  nodes.forEach(n => {
    n.classList.remove('hit');
    void n.offsetWidth;
    n.classList.add('hit');
  });
}

async function onAttackClick() {
  if (state.over || state.turn !== 'player') return;
  if (!state.player.active || !state.opponent.active) return;

  els.attackBtn.disabled = true;
  await attack(state.player.active, state.opponent.active, 'player');

  if (checkGameOver()) return;
  ensureActives();
  render();

  state.turn = 'opponent';
  setStatus('Opponent is thinking...');
  await sleep(700);

  if (state.opponent.active && state.player.active) {
    await attack(state.opponent.active, state.player.active, 'opponent');
  }

  if (checkGameOver()) return;
  ensureActives();
  state.turn = 'player';
  setStatus('Your turn — pick a card or attack.');
  render();
}

function checkGameOver() {
  const playerAlive = state.player.hand.some(c => c.currentHp > 0);
  const oppAlive = state.opponent.hand.some(c => c.currentHp > 0);
  if (!playerAlive || !oppAlive) {
    state.over = true;
    if (!playerAlive && !oppAlive) {
      log('system', 'Draw!');
      setStatus('Draw — start a new game.');
    } else if (!oppAlive) {
      log('system', 'Victory! You won the duel.');
      setStatus('Victory! Start a new game.');
    } else {
      log('system', 'Defeat. Better luck next time.');
      setStatus('Defeat. Start a new game.');
    }
    render();
    return true;
  }
  return false;
}

function log(kind, msg) {
  const div = document.createElement('div');
  div.className = `entry ${kind}`;
  div.textContent = msg;
  els.log.prepend(div);
}

function setStatus(msg) { els.status.textContent = msg; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

els.attackBtn.addEventListener('click', onAttackClick);
els.newGameBtn.addEventListener('click', newGame);

newGame();
