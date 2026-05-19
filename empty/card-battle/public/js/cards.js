export const CARDS = [
  { id: 'emberkit',    name: 'Emberkit',    element: 'fire',   hp: 30, atk: 8 },
  { id: 'cinderwing',  name: 'Cinderwing',  element: 'fire',   hp: 36, atk: 10 },
  { id: 'tidecaller',  name: 'Tidecaller',  element: 'water',  hp: 34, atk: 9 },
  { id: 'mirelurk',    name: 'Mirelurk',    element: 'water',  hp: 40, atk: 7 },
  { id: 'frostpaw',    name: 'Frostpaw',    element: 'water',  hp: 30, atk: 9 },
  { id: 'verdantling', name: 'Verdantling', element: 'nature', hp: 28, atk: 9 },
  { id: 'mossback',    name: 'Mossback',    element: 'nature', hp: 46, atk: 6 },
  { id: 'stormhowl',   name: 'Stormhowl',   element: 'storm',  hp: 32, atk: 11 },
  { id: 'aetherwisp',  name: 'Aetherwisp',  element: 'storm',  hp: 24, atk: 12 },
  { id: 'boulderback', name: 'Boulderback', element: 'earth',  hp: 52, atk: 5 },
  { id: 'sunblade',    name: 'Sunblade',    element: 'light',  hp: 36, atk: 10 },
  { id: 'voidstalker', name: 'Voidstalker', element: 'void',   hp: 33, atk: 11 },
];

export const ELEMENT_BEATS = {
  fire:   ['nature'],
  nature: ['earth'],
  earth:  ['storm'],
  storm:  ['water'],
  water:  ['fire'],
  light:  ['void'],
  void:   ['light'],
};

export const ELEMENT_COLOR = {
  fire:   '#ff5a3c',
  water:  '#3aa8ff',
  nature: '#46c46a',
  storm:  '#9c7bff',
  earth:  '#b07a3a',
  light:  '#ffd24a',
  void:   '#a04bc7',
};

export function damageMultiplier(attackerEl, defenderEl) {
  if (ELEMENT_BEATS[attackerEl]?.includes(defenderEl)) return 1.5;
  if (ELEMENT_BEATS[defenderEl]?.includes(attackerEl)) return 0.75;
  return 1;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHand(size = 4) {
  return shuffle(CARDS).slice(0, size).map((c, i) => ({
    ...c,
    instanceId: `${c.id}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    currentHp: c.hp,
  }));
}
