// ── VAULT.OS DATA STORE ───────────────────────────────────────

export const INITIAL_CAPSULES = [
  {
    id: 'C-001',
    type: 'text',
    status: 'locked',
    rule: 'unlock@2026-12-31',
    ruleType: 'time',
    unlockAt: '2026-12-31',
    preview: 'Dear future me...',
    content: 'Dear future me, I hope you made it. I hope you became who you wanted to be. This year was hard, but you survived it. Keep going.',
    createdAt: '2025-01-15',
    receiver: null,
    views: 0,
  },
  {
    id: 'C-002',
    type: 'image',
    status: 'unlocked',
    rule: 'one-view',
    ruleType: 'one-view',
    unlockAt: null,
    preview: 'My graduation photo',
    content: '[IMAGE] graduation_2025.jpg — A memory sealed in pixels. The cap and gown. The people who showed up.',
    createdAt: '2025-06-10',
    receiver: null,
    views: 0,
  },
  {
    id: 'C-003',
    type: 'audio',
    status: 'expired',
    rule: 'time-limit-7d',
    ruleType: 'expiry',
    unlockAt: null,
    preview: 'Voice note to Aryan',
    content: '[AUDIO] voice_aryan.mp3 — Duration: 2m 14s',
    createdAt: '2024-12-01',
    receiver: 'aryan_v',
    views: 1,
  },
  {
    id: 'C-004',
    type: 'video',
    status: 'destroyed',
    rule: 'one-view',
    ruleType: 'one-view',
    unlockAt: null,
    preview: '[DESTROYED]',
    content: null,
    createdAt: '2024-11-20',
    receiver: 'priya_k',
    views: 1,
  },
  {
    id: 'C-005',
    type: 'text',
    status: 'locked',
    rule: 'unlock@2027-01-01',
    ruleType: 'time',
    unlockAt: '2027-01-01',
    preview: 'My confession...',
    content: 'There are things I never said out loud. This capsule holds them. Sealed until the world feels safer.',
    createdAt: '2025-03-22',
    receiver: null,
    views: 0,
  },
];

export const GHOST_POSTS = [
  { id: 'G-001', message: 'i keep thinking about that summer we wasted.', expiresIn: '23h 14m', color: 'purple' },
  { id: 'G-002', message: 'some people leave and the silence gets louder every day.', expiresIn: '18h 02m', color: 'cyan' },
  { id: 'G-003', message: 'i sealed my regrets in a capsule. felt lighter after.', expiresIn: '11h 55m', color: 'green' },
  { id: 'G-004', message: 'the city looks the same. i don\'t.', expiresIn: '6h 30m', color: 'amber' },
  { id: 'G-005', message: 'i never said goodbye properly. this is it, i guess.', expiresIn: '2h 08m', color: 'pink' },
];

// ── COMMAND DEFINITIONS ───────────────────────────────────────

export const COMMANDS = {
  help:            'Show all commands',
  'login <user>':  'Authenticate and open your vault',
  'list capsules': 'View all capsules with status',
  'open capsule <id>': 'Decrypt and read a capsule',
  'create capsule':'Launch capsule creation wizard',
  ghostwall:       'Open anonymous community feed',
  'send capsule <id>': 'Share a capsule via secure link',
  'status capsule <id>': 'Check capsule lifecycle state',
  'vault stats':   'Personal vault summary',
  'whoami':        'Show current session info',
  logout:          'Lock vault and end session',
  exit:            'Close terminal mode',
  clear:           'Clear terminal output',
};

export const EASTER_EGGS = [
  'sudo unlock everything',
  'sudo rm -rf /',
  'hack the mainframe',
  'access denied bypass',
  'override security',
  'matrix',
];

export const EASTER_RESPONSES = {
  'sudo unlock everything': '[SYSTEM] Nice try. Privilege escalation blocked. 😏',
  'sudo rm -rf /':          '[SYSTEM] Filesystem destruction? Bold choice. Denied.',
  'hack the mainframe':     '[SYSTEM] This isn\'t a movie. But nice try, champ.',
  'access denied bypass':   '[SYSTEM] Security bypass rejected. You\'ve been logged.',
  'override security':      '[SYSTEM] Override failed. Alert sent to ghost protocol.',
  'matrix':                 '[SYSTEM] There is no spoon. There is only the vault.',
};