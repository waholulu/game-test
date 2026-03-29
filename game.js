// ============================================================
// 重建余烬 - 美国内战后战术卡牌 Demo
// ============================================================

// ==================== CARD LIBRARY ====================

const CARD_LIBRARY = {
  strike: {
    id: 'strike',
    name: '打击',
    type: 'attack',
    cost: 1,
    description: '造成 6 点伤害',
    effect(state) {
      dealDamageToEnemy(state, 6);
    }
  },
  defend: {
    id: 'defend',
    name: '防御',
    type: 'skill',
    cost: 1,
    description: '获得 5 点格挡',
    effect(state) {
      gainBlock(state, 'player', 5);
    }
  },
  bash: {
    id: 'bash',
    name: '猛击',
    type: 'attack',
    cost: 2,
    description: '造成 8 点伤害\n施加 2 层易伤',
    effect(state) {
      dealDamageToEnemy(state, 8);
      applyVulnerable(state, 2);
    }
  },
  cleave: {
    id: 'cleave',
    name: '劈斩',
    type: 'attack',
    cost: 1,
    description: '造成 8 点伤害',
    effect(state) {
      dealDamageToEnemy(state, 8);
    }
  },
  iron_wave: {
    id: 'iron_wave',
    name: '铁浪',
    type: 'attack',
    cost: 1,
    description: '造成 5 点伤害\n获得 5 点格挡',
    effect(state) {
      dealDamageToEnemy(state, 5);
      gainBlock(state, 'player', 5);
    }
  },
  pommel_strike: {
    id: 'pommel_strike',
    name: '剑柄打击',
    type: 'attack',
    cost: 1,
    description: '造成 9 点伤害\n抽 1 张牌',
    effect(state) {
      dealDamageToEnemy(state, 9);
      drawCards(state, 1);
    }
  },
  shrug_it_off: {
    id: 'shrug_it_off',
    name: '耸肩',
    type: 'skill',
    cost: 1,
    description: '获得 8 点格挡\n抽 1 张牌',
    effect(state) {
      gainBlock(state, 'player', 8);
      drawCards(state, 1);
    }
  },
  twin_strike: {
    id: 'twin_strike',
    name: '双重打击',
    type: 'attack',
    cost: 1,
    description: '造成 5 点伤害 x2',
    effect(state) {
      dealDamageToEnemy(state, 5);
      dealDamageToEnemy(state, 5);
    }
  },
  armaments: {
    id: 'armaments',
    name: '武装',
    type: 'skill',
    cost: 1,
    description: '获得 5 点格挡',
    effect(state) {
      gainBlock(state, 'player', 5);
    }
  },
  anger: {
    id: 'anger',
    name: '怒火',
    type: 'attack',
    cost: 0,
    description: '造成 6 点伤害',
    effect(state) {
      dealDamageToEnemy(state, 6);
    }
  },
  body_slam: {
    id: 'body_slam',
    name: '冲撞',
    type: 'attack',
    cost: 1,
    description: '造成等同于你\n当前格挡的伤害',
    effect(state) {
      dealDamageToEnemy(state, state.player.block);
    }
  },
  bloodletting: {
    id: 'bloodletting',
    name: '放血',
    type: 'skill',
    cost: 0,
    description: '失去 3 点生命\n获得 2 点能量',
    effect(state) {
      state.player.hp = Math.max(1, state.player.hp - 3);
      state.player.energy += 2;
    }
  }
};

const STARTER_DECK = [
  'strike', 'strike', 'strike', 'strike', 'strike',
  'defend', 'defend', 'defend', 'defend',
  'bash'
];

const REWARD_POOL = [
  'cleave', 'iron_wave', 'pommel_strike', 'shrug_it_off',
  'twin_strike', 'armaments', 'anger', 'body_slam', 'bloodletting'
];

const STATUS_GLOSSARY = {
  vulnerable: {
    title: '易伤',
    description: '处于易伤时，受到的攻击伤害提高 50%。每回合结束时层数减少 1。'
  },
  block: {
    title: '格挡',
    description: '格挡会优先抵消受到的伤害。若回合结束后未被消耗完，本 Demo 中会在下回合开始时清空。'
  },
  strength: {
    title: '力量',
    description: '力量会提高攻击伤害。本 Demo 中敌人每有 1 点力量，其攻击额外造成 1 点伤害。'
  },
  energy: {
    title: '能量',
    description: '打出卡牌需要消耗能量。每回合开始时恢复到上限。'
  }
};

const CARD_KEYWORD_HINTS = {
  bash: ['vulnerable'],
  defend: ['block'],
  iron_wave: ['block'],
  shrug_it_off: ['block'],
  armaments: ['block'],
  body_slam: ['block'],
  bloodletting: ['energy']
};

const ENCOUNTER_LIBRARY = {
  straggler_raider: {
    id: 'straggler_raider',
    name: '🧔 流寇散兵',
    sprite: '🧔',
    mapIcon: '🧔',
    mapLabel: '流寇散兵',
    maxHp: 42,
    getIntent(turn) {
      const cycle = turn % 3;
      if (cycle === 0) return { type: 'attack', value: 11, text: '冷枪偷袭' };
      if (cycle === 1) return { type: 'mixed', attackValue: 5, blockValue: 6, text: '翻越路障' };
      return { type: 'attack', value: 7, text: '近身抢夺' };
    }
  },
  night_rider: {
    id: 'night_rider',
    name: '🏇 夜骑游匪',
    sprite: '🏇',
    mapIcon: '🏇',
    mapLabel: '夜骑游匪',
    maxHp: 50,
    getIntent(turn, enemy) {
      if (turn === 0) return { type: 'buff', value: 0, text: '吹响集结号' };
      return { type: 'attack', value: 6 + (enemy.strength || 0), text: '马刀突袭' };
    }
  },
  river_saboteur: {
    id: 'river_saboteur',
    name: '🧨 渡口破坏者',
    sprite: '🧨',
    mapIcon: '🧨',
    mapLabel: '渡口破坏者',
    maxHp: 56,
    getIntent(turn) {
      const cycle = turn % 3;
      if (cycle === 0) return { type: 'attack', value: 12, text: '火药包投掷' };
      if (cycle === 1) return { type: 'defend', value: 10, text: '借掩体固守' };
      return { type: 'mixed', attackValue: 6, blockValue: 6, text: '爆破后撤' };
    }
  },
  warlord_boss: {
    id: 'warlord_boss',
    name: '🎖️ 军阀头目',
    sprite: '🎖️',
    mapIcon: '🎖️',
    mapLabel: '军阀头目',
    maxHp: 74,
    getIntent(turn) {
      const cycle = turn % 3;
      if (cycle === 0) return { type: 'attack', value: 16, text: '炮击齐发' };
      if (cycle === 1) return { type: 'defend', value: 12, text: '沙袋筑垒' };
      return { type: 'attack', value: 10, text: '步枪齐射', hits: 2 };
    }
  }
};

const ROUTE_MAP = [
  [
    { id: 'r0_a', encounterId: 'straggler_raider', next: ['r1_a', 'r1_b'] },
    { id: 'r0_b', encounterId: 'night_rider', next: ['r1_b', 'r1_c'] }
  ],
  [
    { id: 'r1_a', encounterId: 'night_rider', next: ['r2_a'] },
    { id: 'r1_b', encounterId: 'river_saboteur', next: ['r2_a', 'r2_b'] },
    { id: 'r1_c', encounterId: 'straggler_raider', next: ['r2_b'] }
  ],
  [
    { id: 'r2_a', encounterId: 'river_saboteur', next: ['r3_boss'] },
    { id: 'r2_b', encounterId: 'night_rider', next: ['r3_boss'] }
  ],
  [
    { id: 'r3_boss', encounterId: 'warlord_boss', next: [] }
  ]
];

// ==================== ENEMY TEMPLATES ====================
const ENEMY_TEMPLATES = Object.values(ENCOUNTER_LIBRARY);

// ==================== GAME STATE ====================

let state = null;
let animating = false;

function createCard(cardId) {
  const template = CARD_LIBRARY[cardId];
  return { ...template, uid: Math.random().toString(36).slice(2) };
}

function createInitialState() {
  const deck = STARTER_DECK.map(id => createCard(id));
  const firstRow = ROUTE_MAP[0];
  const initialAvailableNodes = firstRow.map(node => node.id);
  return {
    screen: 'title',
    player: {
      hp: 80,
      maxHp: 80,
      block: 0,
      energy: 0,
      maxEnergy: 3,
      deck: deck,
      drawPile: [],
      hand: [],
      discardPile: []
    },
    currentEnemy: null,
    combatTurn: 0,
    currentFight: 0,
    encounters: ENEMY_TEMPLATES,
    route: ROUTE_MAP,
    routeDepth: 0,
    availableNodes: initialAvailableNodes,
    completedNodes: [],
    selectedNodeId: null,
    message: ''
  };
}

// ==================== UTILITY ====================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function getRouteNodeById(nodeId) {
  for (const row of ROUTE_MAP) {
    for (const node of row) {
      if (node.id === nodeId) return node;
    }
  }
  return null;
}

function getEncounterFromNodeId(nodeId) {
  const node = getRouteNodeById(nodeId);
  if (!node) return null;
  return ENCOUNTER_LIBRARY[node.encounterId] || null;
}

function ensureArrayUnique(arr) {
  return [...new Set(arr)];
}

// ==================== COMBAT MECHANICS ====================

function dealDamageToEnemy(state, baseDamage) {
  let damage = baseDamage;
  const enemy = state.currentEnemy;
  if (enemy.vulnerable > 0) {
    damage = Math.floor(damage * 1.5);
  }
  const blocked = Math.min(enemy.block, damage);
  enemy.block -= blocked;
  const hpDamage = damage - blocked;
  enemy.hp = Math.max(0, enemy.hp - hpDamage);
  if (hpDamage > 0) {
    showFloatingText(`-${hpDamage}`, 'enemy', 'damage');
    shakeSprite('enemy');
  } else if (blocked > 0) {
    showFloatingText(`格挡`, 'enemy', 'block');
  }
}

function dealDamageToPlayer(state, baseDamage) {
  let damage = baseDamage;
  const player = state.player;
  if (player.vulnerable > 0) {
    damage = Math.floor(damage * 1.5);
  }
  const blocked = Math.min(player.block, damage);
  player.block -= blocked;
  const hpDamage = damage - blocked;
  player.hp = Math.max(0, player.hp - hpDamage);
  if (hpDamage > 0) {
    showFloatingText(`-${hpDamage}`, 'player', 'damage');
    shakeSprite('player');
  }
  if (blocked > 0) {
    showFloatingText(`格挡 ${blocked}`, 'player', 'block');
  }
}

function gainBlock(state, target, amount) {
  if (target === 'player') {
    state.player.block += amount;
    showFloatingText(`+${amount} 🛡`, 'player', 'block');
  } else {
    state.currentEnemy.block += amount;
    showFloatingText(`+${amount} 🛡`, 'enemy', 'block');
  }
}

function applyVulnerable(state, turns) {
  state.currentEnemy.vulnerable = (state.currentEnemy.vulnerable || 0) + turns;
  showFloatingText(`易伤 ${turns}`, 'enemy', 'buff');
}

// ==================== DRAW / DISCARD ====================

function drawCards(state, count) {
  for (let i = 0; i < count; i++) {
    if (state.player.drawPile.length === 0) {
      if (state.player.discardPile.length === 0) return;
      state.player.drawPile = shuffleArray([...state.player.discardPile]);
      state.player.discardPile = [];
    }
    const card = state.player.drawPile.pop();
    state.player.hand.push(card);
  }
}

function discardHand(state) {
  state.player.discardPile.push(...state.player.hand);
  state.player.hand = [];
}

// ==================== COMBAT FLOW ====================

function startCombat(nodeId) {
  const node = getRouteNodeById(nodeId);
  if (!node) return;
  const template = getEncounterFromNodeId(nodeId);
  if (!template) return;
  state.selectedNodeId = nodeId;
  state.currentEnemy = {
    ...template,
    hp: template.maxHp,
    block: 0,
    vulnerable: 0,
    strength: 0,
    turn: 0,
    intent: null
  };
  state.currentEnemy.intent = template.getIntent(0, state.currentEnemy);

  state.player.block = 0;
  state.player.drawPile = shuffleArray(state.player.deck.map(c => createCard(c.id)));
  state.player.hand = [];
  state.player.discardPile = [];
  state.combatTurn = 1;
  state.message = '';

  startPlayerTurn();
  state.screen = 'combat';
  render();
  showBanner(`第 ${state.routeDepth + 1} 场遭遇 - ${template.name}`);
}

function startPlayerTurn() {
  state.player.block = 0;
  state.player.energy = state.player.maxEnergy;
  if (state.player.vulnerable > 0) state.player.vulnerable--;
  drawCards(state, 5);
}

function playCard(cardIndex) {
  if (animating) return;
  const card = state.player.hand[cardIndex];
  if (!card) return;
  if (card.cost > state.player.energy) return;

  state.player.energy -= card.cost;
  state.player.hand.splice(cardIndex, 1);
  state.player.discardPile.push(card);

  state.message = `使用了 ${card.name}`;
  card.effect(state);

  render();

  if (checkCombatEnd()) return;
}

function endPlayerTurn() {
  if (animating) return;
  animating = true;

  discardHand(state);
  render();

  setTimeout(() => {
    executeEnemyTurn();
    animating = false;

    if (checkCombatEnd()) return;

    state.combatTurn++;
    startPlayerTurn();
    render();
  }, 600);
}

function executeEnemyTurn() {
  const enemy = state.currentEnemy;
  const intent = enemy.intent;

  if (intent.type === 'attack') {
    const hits = intent.hits || 1;
    for (let i = 0; i < hits; i++) {
      dealDamageToPlayer(state, intent.value);
    }
    const totalDmg = intent.value * (intent.hits || 1);
    state.message = `${enemy.name} 使用了 ${intent.text}，造成 ${totalDmg} 点伤害`;
  } else if (intent.type === 'defend') {
    gainBlock(state, 'enemy', intent.value);
    state.message = `${enemy.name} 使用了 ${intent.text}，获得 ${intent.value} 点格挡`;
  } else if (intent.type === 'buff') {
    enemy.strength = (enemy.strength || 0) + 3;
    showFloatingText(`力量+3`, 'enemy', 'buff');
    state.message = `${enemy.name} 进行了 ${intent.text}，力量增加!`;
  } else if (intent.type === 'mixed') {
    dealDamageToPlayer(state, intent.attackValue);
    gainBlock(state, 'enemy', intent.blockValue);
    state.message = `${enemy.name} 使用了 ${intent.text}`;
  }

  // Decrement enemy vulnerable
  if (enemy.vulnerable > 0) enemy.vulnerable--;
  // Reset enemy block at start of their "next" turn (after acting)
  // Actually in StS, enemy block resets before their action. For simplicity, reset at start of player turn above.

  // Roll next intent
  enemy.turn++;
  enemy.intent = enemy.getIntent(enemy.turn, enemy);
}

function checkCombatEnd() {
  if (state.currentEnemy.hp <= 0) {
    const finishedNode = getRouteNodeById(state.selectedNodeId);
    if (finishedNode) {
      state.completedNodes = ensureArrayUnique([...state.completedNodes, finishedNode.id]);
      state.routeDepth += 1;
      state.availableNodes = ensureArrayUnique(finishedNode.next || []);
    }
    state.currentFight++;
    if (state.routeDepth >= state.route.length) {
      setTimeout(() => {
        state.screen = 'victory';
        render();
      }, 800);
    } else {
      setTimeout(() => {
        showRewardScreen();
      }, 800);
    }
    return true;
  }
  if (state.player.hp <= 0) {
    setTimeout(() => {
      state.screen = 'gameover';
      state.deathMsg = `你在第 ${state.currentFight + 1} 场遭遇中被 ${state.currentEnemy.name} 击倒`;
      render();
    }, 800);
    return true;
  }
  return false;
}

// ==================== REWARD ====================

let rewardChoices = [];

function showRewardScreen() {
  const pool = [...REWARD_POOL];
  shuffleArray(pool);
  rewardChoices = pool.slice(0, 3).map(id => createCard(id));
  state.screen = 'reward';
  render();
}

function pickReward(index) {
  const card = rewardChoices[index];
  state.player.deck.push(createCard(card.id));
  goToMap();
}

function skipReward() {
  goToMap();
}

function goToMap() {
  state.screen = 'map';
  render();
}

// ==================== RENDERING ====================

function render() {
  // Hide all screens
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('map-screen').classList.add('hidden');
  document.getElementById('combat-screen').classList.add('hidden');
  document.getElementById('reward-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('victory-screen').classList.add('hidden');

  switch (state.screen) {
    case 'title': renderTitle(); break;
    case 'map': renderMap(); break;
    case 'combat': renderCombat(); break;
    case 'reward': renderReward(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderTitle() {
  document.getElementById('title-screen').classList.remove('hidden');
}

function renderMap() {
  document.getElementById('map-screen').classList.remove('hidden');
  const mapPath = document.getElementById('map-path');
  const routeHistory = document.getElementById('map-route-history');
  mapPath.innerHTML = '';
  if (routeHistory) routeHistory.innerHTML = '';
  const routeHint = document.getElementById('map-stage-info');

  const currentRow = state.route[state.routeDepth] || [];
  currentRow.forEach((routeNode, i) => {
    const encounter = ENCOUNTER_LIBRARY[routeNode.encounterId];
    if (!encounter) return;

    if (i > 0) {
      const connector = document.createElement('div');
      const isPast = state.completedNodes.includes(currentRow[i - 1].id);
      connector.className = 'map-connector' + (isPast ? ' active' : '');
      mapPath.appendChild(connector);
    }

    const node = document.createElement('div');
    node.className = 'map-node';
    const completed = state.completedNodes.includes(routeNode.id);
    const available = state.availableNodes.includes(routeNode.id);

    if (completed) node.classList.add('completed');
    else if (available) node.classList.add('available');
    else node.classList.add('locked');

    node.innerHTML = `<div class="node-icon">${encounter.mapIcon || encounter.sprite}</div><div class="node-label">${encounter.mapLabel || encounter.name}</div>`;

    if (available) {
      addTap(node, () => startCombat(routeNode.id));
    }
    mapPath.appendChild(node);
  });

  if (routeHint) {
    const totalRounds = state.route.length;
    routeHint.textContent = `当前第 ${state.routeDepth + 1} / ${totalRounds} 轮，可在本轮节点中选择一条路线前进。`;
  }

  if (routeHistory) {
    state.completedNodes.forEach((nodeId) => {
      const node = getRouteNodeById(nodeId);
      if (!node) return;
      const encounter = ENCOUNTER_LIBRARY[node.encounterId];
      if (!encounter) return;
      const chip = document.createElement('div');
      chip.className = 'route-chip';
      chip.textContent = `${encounter.mapIcon || encounter.sprite} ${encounter.mapLabel || encounter.name}`;
      routeHistory.appendChild(chip);
    });
  }

  document.getElementById('map-hp').textContent = `${state.player.hp} / ${state.player.maxHp}`;
}

function renderCombat() {
  document.getElementById('combat-screen').classList.remove('hidden');
  const p = state.player;
  const e = state.currentEnemy;
  if (!e) return;

  // Player HP
  const pHpPct = (p.hp / p.maxHp) * 100;
  const pBlockPct = (p.block / p.maxHp) * 100;
  document.getElementById('player-hp-fill').style.width = pHpPct + '%';
  document.getElementById('player-block-fill').style.width = Math.min(pBlockPct, 100) + '%';
  document.getElementById('player-hp-text').textContent = `${p.hp} / ${p.maxHp}`;
  document.getElementById('player-block-text').textContent = p.block > 0 ? `🛡 格挡: ${p.block}` : '';
  document.getElementById('player-status-text').textContent =
    (p.vulnerable > 0 ? `易伤 ${p.vulnerable} ` : '');

  // Enemy HP
  const eHpPct = (e.hp / e.maxHp) * 100;
  const eBlockPct = (e.block / e.maxHp) * 100;
  document.getElementById('enemy-hp-fill').style.width = eHpPct + '%';
  document.getElementById('enemy-block-fill').style.width = Math.min(eBlockPct, 100) + '%';
  document.getElementById('enemy-hp-text').textContent = `${e.hp} / ${e.maxHp}`;
  document.getElementById('enemy-name').textContent = e.name;
  document.getElementById('enemy-sprite').textContent = e.sprite;
  document.getElementById('enemy-block-text').textContent = e.block > 0 ? `🛡 格挡: ${e.block}` : '';

  let statusText = '';
  if (e.vulnerable > 0) statusText += `易伤 ${e.vulnerable} `;
  if (e.strength > 0) statusText += `力量 ${e.strength} `;
  document.getElementById('enemy-status-text').textContent = statusText;

  // Enemy intent
  const intentEl = document.getElementById('enemy-intent');
  if (e.intent) {
    let intentHtml = '';
    if (e.intent.type === 'attack') {
      const total = e.intent.value * (e.intent.hits || 1);
      const hitsText = e.intent.hits > 1 ? ` x${e.intent.hits}` : '';
      intentHtml = `<span class="intent-attack">⚔️ ${e.intent.text}: ${e.intent.value}${hitsText}</span>`;
    } else if (e.intent.type === 'defend') {
      intentHtml = `<span class="intent-defend">🛡 ${e.intent.text}: ${e.intent.value}</span>`;
    } else if (e.intent.type === 'buff') {
      intentHtml = `<span class="intent-buff">✨ ${e.intent.text}</span>`;
    } else if (e.intent.type === 'mixed') {
      intentHtml = `<span class="intent-attack">⚔️${e.intent.attackValue} 🛡${e.intent.blockValue}</span>`;
    }
    intentEl.innerHTML = intentHtml;
  }

  // Energy
  document.getElementById('energy-orb').textContent = `${p.energy}/${p.maxEnergy}`;

  // Piles
  document.getElementById('draw-count').textContent = p.drawPile.length;
  document.getElementById('discard-count').textContent = p.discardPile.length;

  // Hand
  renderHand();

  // Message
  document.getElementById('message-log').textContent = state.message;

  // End turn button
  document.getElementById('end-turn-btn').disabled = animating;
}

function renderHand() {
  const handArea = document.getElementById('hand-area');
  handArea.innerHTML = '';
  const p = state.player;

  p.hand.forEach((card, i) => {
    const playable = card.cost <= p.energy && !animating;
    const cardEl = document.createElement('div');
    cardEl.className = `card card-${card.type}${playable ? '' : ' unplayable'}`;
    cardEl.dataset.index = i;
    cardEl.innerHTML = `
      <div class="card-cost">${card.cost}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-type">${card.type === 'attack' ? '攻击' : '技能'}</div>
      <div class="card-desc">${card.description.replace(/\n/g, '<br>')}</div>
    `;
    setupCardLongPress(cardEl, card);
    if (playable) {
      addTap(cardEl, () => playCard(i));
    }
    handArea.appendChild(cardEl);
  });

  // On mobile, center-scroll the hand
  requestAnimationFrame(scrollHandToCenter);
}

function renderReward() {
  document.getElementById('reward-screen').classList.remove('hidden');
  const container = document.getElementById('reward-cards');
  container.innerHTML = '';

  rewardChoices.forEach((card, i) => {
    const cardEl = document.createElement('div');
    cardEl.className = `card card-${card.type}`;
    cardEl.innerHTML = `
      <div class="card-cost">${card.cost}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-type">${card.type === 'attack' ? '攻击' : '技能'}</div>
      <div class="card-desc">${card.description.replace(/\n/g, '<br>')}</div>
    `;
    setupCardLongPress(cardEl, card);
    addTap(cardEl, () => pickReward(i));
    container.appendChild(cardEl);
  });
}

function renderGameOver() {
  document.getElementById('gameover-screen').classList.remove('hidden');
  document.getElementById('death-msg').textContent = state.deathMsg || '你被击败了...';
}

function renderVictory() {
  document.getElementById('victory-screen').classList.remove('hidden');
}

// ==================== VISUAL EFFECTS ====================

function showFloatingText(text, target, type) {
  const el = document.createElement('div');
  el.className = `float-text float-${type}`;
  el.textContent = text;

  const container = document.getElementById('battlefield');
  if (!container) return;
  const rect = container.getBoundingClientRect();

  let x, y;
  if (target === 'player') {
    const sprite = document.getElementById('player-sprite');
    const sr = sprite.getBoundingClientRect();
    x = sr.left - rect.left + sr.width / 2;
    y = sr.top - rect.top;
  } else {
    const sprite = document.getElementById('enemy-sprite');
    const sr = sprite.getBoundingClientRect();
    x = sr.left - rect.left + sr.width / 2;
    y = sr.top - rect.top;
  }

  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.transform = 'translateX(-50%)';
  container.appendChild(el);

  setTimeout(() => el.remove(), 1000);
}

function shakeSprite(target) {
  const id = target === 'player' ? 'player-sprite' : 'enemy-sprite';
  const el = document.getElementById(id);
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 300);
}

function showBanner(text) {
  const banner = document.createElement('div');
  banner.className = 'turn-banner';
  banner.textContent = text;
  document.getElementById('game-container').appendChild(banner);
  setTimeout(() => banner.remove(), 1200);
}

function getCardKeywordLines(card) {
  const hints = CARD_KEYWORD_HINTS[card.id] || [];
  return hints
    .map((key) => STATUS_GLOSSARY[key])
    .filter(Boolean)
    .map((item) => `• ${item.title}: ${item.description}`);
}

function openCardDetail(card) {
  const modal = document.getElementById('card-detail-modal');
  if (!modal) return;
  const titleEl = document.getElementById('card-detail-title');
  const bodyEl = document.getElementById('card-detail-body');
  if (!titleEl || !bodyEl) return;

  const typeText = card.type === 'attack' ? '攻击' : '技能';
  const detailLines = [
    `类型：${typeText}`,
    `消耗：${card.cost} 点能量`,
    '',
    `效果：${card.description.replace(/\n/g, ' / ')}`
  ];
  const keywordLines = getCardKeywordLines(card);
  if (keywordLines.length > 0) {
    detailLines.push('', '关键词说明：', ...keywordLines);
  }

  titleEl.textContent = `${card.name}（详情）`;
  bodyEl.textContent = detailLines.join('\n');
  modal.classList.remove('hidden');
}

function closeCardDetail() {
  const modal = document.getElementById('card-detail-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function setupCardLongPress(cardEl, card) {
  let timer = null;
  let longPressTriggered = false;
  let startX = 0;
  let startY = 0;

  const clearPressTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const startPressTimer = (clientX, clientY) => {
    longPressTriggered = false;
    startX = clientX;
    startY = clientY;
    clearPressTimer();
    timer = setTimeout(() => {
      longPressTriggered = true;
      openCardDetail(card);
    }, 450);
  };

  cardEl.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    startPressTimer(touch.clientX, touch.clientY);
  }, { passive: true });

  cardEl.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > 12 || dy > 12) {
      clearPressTimer();
    }
  }, { passive: true });

  cardEl.addEventListener('touchend', (e) => {
    clearPressTimer();
    if (longPressTriggered) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });

  cardEl.addEventListener('touchcancel', clearPressTimer, { passive: true });

  cardEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startPressTimer(e.clientX, e.clientY);
  });

  cardEl.addEventListener('mousemove', (e) => {
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 8 || dy > 8) clearPressTimer();
  });

  cardEl.addEventListener('mouseup', clearPressTimer);
  cardEl.addEventListener('mouseleave', clearPressTimer);

  // Desktop fallback: right click to inspect details
  cardEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openCardDetail(card);
  });
}

// ==================== TOUCH HELPERS ====================

// Use touchend on mobile for snappier response, with fallback to click
function addTap(el, handler) {
  let touchMoved = false;
  let startX = 0;
  let startY = 0;

  el.addEventListener('touchstart', (e) => {
    touchMoved = false;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    const dx = Math.abs(e.touches[0].clientX - startX);
    const dy = Math.abs(e.touches[0].clientY - startY);
    if (dx > 10 || dy > 10) touchMoved = true;
  }, { passive: true });

  el.addEventListener('touchend', (e) => {
    if (e.defaultPrevented) return;
    if (!touchMoved) {
      e.preventDefault();
      handler(e);
    }
  });

  el.addEventListener('click', (e) => {
    // Only fire click on non-touch devices
    if (!('ontouchstart' in window)) handler(e);
  });
}

// Scroll hand area to center on mobile
function scrollHandToCenter() {
  const handArea = document.getElementById('hand-area');
  if (!handArea) return;
  const scrollWidth = handArea.scrollWidth;
  const clientWidth = handArea.clientWidth;
  if (scrollWidth > clientWidth) {
    handArea.scrollLeft = (scrollWidth - clientWidth) / 2;
  }
}

// ==================== EVENT HANDLERS ====================

function initGame() {
  state = createInitialState();
  render();

  addTap(document.getElementById('start-btn'), () => {
    state.screen = 'map';
    render();
  });

  addTap(document.getElementById('end-turn-btn'), () => {
    if (!animating) endPlayerTurn();
  });

  addTap(document.getElementById('skip-reward-btn'), skipReward);

  addTap(document.getElementById('retry-btn'), () => {
    state = createInitialState();
    state.screen = 'map';
    render();
  });

  addTap(document.getElementById('victory-restart-btn'), () => {
    state = createInitialState();
    state.screen = 'map';
    render();
  });

  const closeDetailBtn = document.getElementById('card-detail-close-btn');
  if (closeDetailBtn) addTap(closeDetailBtn, closeCardDetail);
  const detailModal = document.getElementById('card-detail-modal');
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeCardDetail();
    });
  }

  // Prevent pull-to-refresh and bounce scroll on iOS
  document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('#hand-area')) return; // allow card scrolling
    e.preventDefault();
  }, { passive: false });

  // Handle orientation change
  window.addEventListener('resize', () => {
    if (state.screen === 'combat') render();
  });
}

// ==================== INIT ====================

window.addEventListener('DOMContentLoaded', initGame);
