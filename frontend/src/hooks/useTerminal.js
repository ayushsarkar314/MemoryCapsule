import { useState, useCallback } from 'react';
import { INITIAL_CAPSULES, GHOST_POSTS, COMMANDS, EASTER_EGGS, EASTER_RESPONSES } from '../data';

// ── LINE FACTORY ──────────────────────────────────────────────
let lineId = 0;
const line = (text, type = 'white') => ({ id: lineId++, text, type });

// ── CAPSULE HELPERS ───────────────────────────────────────────
const statusColor = (s) => {
  if (s === 'locked')    return 'pink';
  if (s === 'unlocked')  return 'green';
  if (s === 'expired')   return 'amber';
  if (s === 'destroyed') return 'muted';
  return 'white';
};

const pad = (str, len) => String(str).padEnd(len, ' ');

// ── BOOT SEQUENCE LINES ───────────────────────────────────────
export const BOOT_LINES = [
  line('', 'empty'),
  line('██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗   ██████╗ ███████╗', 'cyan'),
  line('██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝  ██╔═══██╗██╔════╝', 'cyan'),
  line('██║   ██║███████║██║   ██║██║     ██║     ██║   ██║███████╗ ', 'cyan'),
  line('╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║     ██║   ██║╚════██║', 'cyan'),
  line(' ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║     ╚██████╔╝███████║', 'cyan'),
  line('  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝      ╚═════╝ ╚══════╝', 'cyan'),
  line('', 'empty'),
  line('// CAPSULE MEMORY SYSTEM  //  PRIVATE-FIRST PROTOCOL  //  v2.0', 'dim'),
  line('// Build: 2025.VAULT.OS   //  Lifecycle Engine: ACTIVE        ', 'dim'),
  line('', 'empty'),
  line('[BOOT] Initializing encrypted kernel ..................... OK', 'amber'),
  line('[BOOT] Loading capsule lifecycle engine .................. OK', 'amber'),
  line('[BOOT] Ghost Wall anonymous layer ........................ OK', 'amber'),
  line('[BOOT] WebSocket status relay ............................ OK', 'amber'),
  line('[BOOT] AI memory prompt engine ........................... OK', 'amber'),
  line('', 'empty'),
  line('[SYS]  System ready. Authentication required.', 'green'),
  line('[SYS]  Type  help  to see available commands.', 'green'),
  line('', 'empty'),
];

// ── MAIN HOOK ─────────────────────────────────────────────────
export function useTerminal() {
  const [lines, setLines]         = useState(BOOT_LINES);
  const [auth, setAuth]           = useState(false);
  const [user, setUser]           = useState(null);
  const [capsules, setCapsules]   = useState(INITIAL_CAPSULES);
  const [createStep, setCreateStep] = useState(0);
  const [newCap, setNewCap]       = useState({});
  const [busy, setBusy]           = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const [loginTime, setLoginTime]  = useState(null);

  // Append one or more lines
  const push = useCallback((...newLines) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  // Async delay helper
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Simulate a progress bar by pushing updates to a specific line index
  const progress = useCallback(async (color = 'cyan') => {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const filled = '█'.repeat(i);
      const empty  = '░'.repeat(steps - i);
      const pct    = i * 10;
      setLines(prev => {
        const next = [...prev];
        const last = next.length - 1;
        next[last] = { ...next[last], text: `[${filled}${empty}] ${pct}%`, type: color };
        return next;
      });
      await sleep(55);
    }
  }, []);

  // ── COMMAND HANDLER ────────────────────────────────────────
  const run = useCallback(async (raw) => {
    if (busy) return;
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    // Echo the typed command
    push(line(`${user ? `vault@${user}` : 'vault@ghost'}:~$ ${raw}`, 'cmd'));

    setBusy(true);

    // ── CAPSULE CREATION WIZARD ──────────────────────────────
    if (createStep > 0) {
      await handleCreateWizard(raw, cmd);
      setBusy(false);
      return;
    }

    // ── CLEAR ────────────────────────────────────────────────
    if (cmd === 'clear') {
      setLines([]);
      setBusy(false);
      return;
    }

    // ── HELP ─────────────────────────────────────────────────
    if (cmd === 'help') {
      push(
        line('', 'empty'),
        line('┌──────────────────────────────────────────────────────────────┐', 'cyan'),
        line('│  VAULT.OS COMMAND REFERENCE                                  │', 'cyan'),
        line('├──────────────────────────────────────────────────────────────┤', 'cyan'),
      );
      Object.entries(COMMANDS).forEach(([c, desc]) => {
        push(line(`│  ${pad(c, 26)}  ${pad(desc, 34)}│`, 'white'));
      });
      push(
        line('└──────────────────────────────────────────────────────────────┘', 'cyan'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── EASTER EGGS ───────────────────────────────────────────
    if (EASTER_EGGS.includes(cmd)) {
      push(line(EASTER_RESPONSES[cmd] || '[SYSTEM] Nice try.', 'pink'));
      setBusy(false);
      return;
    }

    // ── LOGIN ─────────────────────────────────────────────────
    if (cmd.startsWith('login ')) {
      const uname = raw.trim().split(' ')[1];
      if (!uname) {
        push(line('[ERR] Usage: login <username>', 'pink'));
        setBusy(false);
        return;
      }
      push(
        line('[AUTH] Authenticating...', 'amber'),
        line('[AUTH] Verifying identity matrix...', 'amber'),
        line('', 'progress'),
      );
      await sleep(300);
      await progress('cyan');
      await sleep(200);
      push(
        line(`[AUTH] Identity confirmed: ${uname.toUpperCase()}`, 'green'),
        line('[AUTH] Vault decrypted. Capsule engine online.', 'green'),
        line(`[AUTH] Welcome back, ${uname}. ${capsules.length} capsules found.`, 'green'),
        line('', 'empty'),
      );
      setAuth(true);
      setUser(uname);
      setLoginTime(new Date());
      setBusy(false);
      return;
    }

    // ── EXIT TERMINAL MODE ────────────────────────────────────
    if (cmd === 'exit') {
      push(
        line('[SYS] Closing terminal mode...', 'amber'),
        line('', 'empty'),
      );
      setBusy(false);
      setTimeout(() => setExitRequested(true), 400);
      return;
    }

    // ── REQUIRE AUTH ──────────────────────────────────────────
    if (!auth) {
      push(line('[ERR] Access denied. Authenticate first:  login <username>', 'pink'));
      setBusy(false);
      return;
    }

    // ── LOGOUT ────────────────────────────────────────────────
    if (cmd === 'logout') {
      push(
        line('[AUTH] Locking vault...', 'amber'),
        line('[AUTH] Session terminated. Goodbye.', 'amber'),
        line('', 'empty'),
      );
      setAuth(false);
      setUser(null);
      setLoginTime(null);
      setBusy(false);
      return;
    }

    // ── WHOAMI ────────────────────────────────────────────────
    if (cmd === 'whoami') {
      const sessionDuration = loginTime
        ? (() => {
            const diff = Math.floor((new Date() - loginTime) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
          })()
        : 'N/A';
      push(
        line('', 'empty'),
        line(`User     : ${user}`, 'white'),
        line(`Session  : ACTIVE`, 'green'),
        line(`Logged in: ${loginTime ? loginTime.toLocaleTimeString() : 'N/A'}`, 'white'),
        line(`Duration : ${sessionDuration}`, 'white'),
        line(`Capsules : ${capsules.length} total`, 'white'),
        line(`Vault    : DECRYPTED`, 'green'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── LIST CAPSULES ─────────────────────────────────────────
    if (cmd === 'list capsules') {
      push(
        line('', 'empty'),
        line(`${pad('ID', 7)} ${pad('TYPE', 8)} ${pad('STATUS', 11)} ${pad('RULE', 22)} PREVIEW`, 'cyan'),
        line('─'.repeat(70), 'dim'),
      );
      capsules.forEach(c => {
        const statusStr = `[${c.status.toUpperCase()}]`;
        push(line(
          `${pad(c.id, 7)} ${pad(c.type, 8)} ${pad(statusStr, 11)} ${pad(c.rule, 22)} ${c.status === 'destroyed' ? '[DESTROYED]' : c.preview}`,
          statusColor(c.status),
        ));
      });
      const locked    = capsules.filter(c => c.status === 'locked').length;
      const unlocked  = capsules.filter(c => c.status === 'unlocked').length;
      const expired   = capsules.filter(c => c.status === 'expired').length;
      const destroyed = capsules.filter(c => c.status === 'destroyed').length;
      push(
        line('─'.repeat(70), 'dim'),
        line(`Total: ${capsules.length}  |  Locked: ${locked}  Unlocked: ${unlocked}  Expired: ${expired}  Destroyed: ${destroyed}`, 'dim'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── OPEN CAPSULE ──────────────────────────────────────────
    if (cmd.startsWith('open capsule ')) {
      const id = raw.trim().split(' ')[2]?.toUpperCase();
      const cap = capsules.find(c => c.id === id);
      if (!cap) {
        push(line(`[ERR] Capsule ${id} not found. Use  list capsules  to see IDs.`, 'pink'));
        setBusy(false);
        return;
      }
      if (cap.status === 'locked') {
        push(
          line(`[ERR] Capsule ${id} is LOCKED.`, 'pink'),
          line(`[ERR] Unlock condition: ${cap.rule}`, 'pink'),
        );
        setBusy(false);
        return;
      }
      if (cap.status === 'destroyed') {
        push(line(`[ERR] Capsule ${id} has been permanently DESTROYED.`, 'pink'));
        setBusy(false);
        return;
      }
      if (cap.status === 'expired') {
        push(
          line(`[WARN] Capsule ${id} has EXPIRED.`, 'amber'),
          line(`[WARN] Content is no longer accessible.`, 'amber'),
        );
        setBusy(false);
        return;
      }
      // Decrypt animation
      push(
        line(`[DECRYPT] Accessing capsule ${id}...`, 'amber'),
        line('', 'progress'),
      );
      await sleep(200);
      await progress('green');
      await sleep(150);
      push(
        line('[DECRYPT] Signature verified. ACCESS GRANTED.', 'green'),
        line('', 'empty'),
        line(`┌── CAPSULE ${id} ${'─'.repeat(50 - id.length)}`, 'cyan'),
        line(`│  ID       : ${cap.id}`, 'white'),
        line(`│  Type     : ${cap.type.toUpperCase()}`, 'white'),
        line(`│  Created  : ${cap.createdAt}`, 'white'),
        line(`│  Rule     : ${cap.rule}`, 'white'),
        cap.receiver
          ? line(`│  Receiver : ${cap.receiver}`, 'white')
          : line(`│  Receiver : [personal]`, 'dim'),
        line('│', 'dim'),
        line(`│  CONTENT:`, 'cyan'),
        line(`│  "${cap.content}"`, 'text'),
        line('│', 'dim'),
        line(`└${'─'.repeat(60)}`, 'cyan'),
        line('', 'empty'),
      );
      // One-view destruction
      if (cap.ruleType === 'one-view') {
        push(line('[WARN] One-view capsule. Initiating self-destruct sequence...', 'amber'));
        await sleep(600);
        push(
          line('[DESTROY] ██████████ Erasing capsule data...', 'pink'),
        );
        await sleep(400);
        push(line('[DESTROY] Capsule permanently DESTROYED.', 'pink'));
        setCapsules(prev =>
          prev.map(c => c.id === id ? { ...c, status: 'destroyed', content: null, preview: '[DESTROYED]', views: 1 } : c)
        );
      }
      push(line('', 'empty'));
      setBusy(false);
      return;
    }

    // ── CREATE CAPSULE ────────────────────────────────────────
    if (cmd === 'create capsule') {
      push(
        line('', 'empty'),
        line('[CAPSULE CREATOR] Initializing wizard...', 'cyan'),
        line('', 'empty'),
        line('Step 1/3 — Select type:', 'amber'),
        line('  text   image   audio   video', 'white'),
        line('', 'empty'),
      );
      setCreateStep(1);
      setNewCap({});
      setBusy(false);
      return;
    }

    // ── GHOST WALL ────────────────────────────────────────────
    if (cmd === 'ghostwall') {
      push(
        line('', 'empty'),
        line('[GHOST WALL] Connecting to anonymous feed...', 'purple'),
        line('', 'progress'),
      );
      await sleep(200);
      await progress('purple');
      await sleep(200);
      push(
        line('[GHOST WALL] Feed loaded. All identities stripped.', 'purple'),
        line('─'.repeat(60), 'dim'),
        line('', 'empty'),
      );
      GHOST_POSTS.forEach(p => {
        push(line(`[anon_${Math.floor(Math.random()*9000+1000)}]  "${p.message}"  ← expires in ${p.expiresIn}`, p.color));
      });
      push(
        line('', 'empty'),
        line('─'.repeat(60), 'dim'),
        line('[GHOST WALL] Posts auto-expire. No identity stored. No logs.', 'dim'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── SEND CAPSULE ──────────────────────────────────────────
    if (cmd.startsWith('send capsule ')) {
      const id = raw.trim().split(' ')[2]?.toUpperCase();
      const cap = capsules.find(c => c.id === id);
      if (!cap) {
        push(line(`[ERR] Capsule ${id} not found.`, 'pink'));
        setBusy(false);
        return;
      }
      if (cap.status === 'destroyed' || cap.status === 'expired') {
        push(line(`[ERR] Cannot share a ${cap.status} capsule.`, 'pink'));
        setBusy(false);
        return;
      }
      const token = Math.random().toString(36).substr(2, 12);
      push(
        line('', 'empty'),
        line('[SEND] Generating encrypted share link...', 'amber'),
        line('', 'progress'),
      );
      await sleep(200);
      await progress('cyan');
      push(
        line(`[SEND] Link generated:  vault.os/share/${id.toLowerCase()}-${token}`, 'green'),
        line(`[SEND] Capsule: ${id}  |  Rule: ${cap.rule}`, 'white'),
        line(`[SEND] Status: PENDING DELIVERY`, 'dim'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── STATUS CAPSULE ────────────────────────────────────────
    if (cmd.startsWith('status capsule ')) {
      const id = raw.trim().split(' ')[2]?.toUpperCase();
      const cap = capsules.find(c => c.id === id);
      if (!cap) {
        push(line(`[ERR] Capsule ${id} not found.`, 'pink'));
        setBusy(false);
        return;
      }
      push(
        line('', 'empty'),
        line(`[STATUS] Capsule ${id}`, 'cyan'),
        line(`  Status   : [${cap.status.toUpperCase()}]`, statusColor(cap.status)),
        line(`  Type     : ${cap.type}`, 'white'),
        line(`  Rule     : ${cap.rule}`, 'white'),
        line(`  Created  : ${cap.createdAt}`, 'white'),
        line(`  Views    : ${cap.views}`, 'white'),
        cap.receiver
          ? line(`  Receiver : ${cap.receiver}`, 'white')
          : line(`  Receiver : [personal]`, 'dim'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── VAULT STATS ───────────────────────────────────────────
    if (cmd === 'vault stats') {
      const locked    = capsules.filter(c => c.status === 'locked').length;
      const unlocked  = capsules.filter(c => c.status === 'unlocked').length;
      const expired   = capsules.filter(c => c.status === 'expired').length;
      const destroyed = capsules.filter(c => c.status === 'destroyed').length;
      push(
        line('', 'empty'),
        line('┌── VAULT STATISTICS ──────────────────────────────────', 'cyan'),
        line(`│  [LOCKED]    : ${locked}  capsule${locked !== 1 ? 's' : ''}`, 'pink'),
        line(`│  [UNLOCKED]  : ${unlocked}  capsule${unlocked !== 1 ? 's' : ''}`, 'green'),
        line(`│  [EXPIRED]   : ${expired}  capsule${expired !== 1 ? 's' : ''}`, 'amber'),
        line(`│  [DESTROYED] : ${destroyed}  capsule${destroyed !== 1 ? 's' : ''}`, 'muted'),
        line('├──────────────────────────────────────────────────────', 'cyan'),
        line(`│  Total       : ${capsules.length}  capsules in vault`, 'white'),
        line(`│  User        : ${user}`, 'white'),
        line(`│  Engine      : LIFECYCLE ACTIVE`, 'green'),
        line('└──────────────────────────────────────────────────────', 'cyan'),
        line('', 'empty'),
      );
      setBusy(false);
      return;
    }

    // ── UNKNOWN COMMAND ───────────────────────────────────────
    push(line(`[ERR] Command not found: '${raw}'. Type  help  for commands.`, 'pink'));
    setBusy(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, user, capsules, createStep, newCap, busy, push, progress]);

  // ── CREATE WIZARD STEPS ────────────────────────────────────
  const handleCreateWizard = useCallback(async (raw, cmd) => {
    if (createStep === 1) {
      const types = ['text', 'image', 'audio', 'video'];
      if (!types.includes(cmd)) {
        push(line('[ERR] Invalid type. Choose: text / image / audio / video', 'pink'));
        setBusy(false);
        return;
      }
      setNewCap(prev => ({ ...prev, type: cmd }));
      setCreateStep(2);
      push(
        line(`[OK] Type set: ${cmd.toUpperCase()}`, 'green'),
        line('', 'empty'),
        line('Step 2/3 — Enter content or description:', 'amber'),
      );
    } else if (createStep === 2) {
      setNewCap(prev => ({ ...prev, preview: raw, content: raw }));
      setCreateStep(3);
      push(
        line('[OK] Content recorded.', 'green'),
        line('', 'empty'),
        line('Step 3/3 — Select lifecycle rule:', 'amber'),
        line('  1  Unlock at future date', 'white'),
        line('  2  One-time view (self-destructs)', 'white'),
        line('  3  Auto-expire after 7 days', 'white'),
      );
    } else if (createStep === 3) {
      const ruleMap = {
        '1': { rule: 'unlock@2027-01-01', ruleType: 'time',     status: 'locked' },
        '2': { rule: 'one-view',          ruleType: 'one-view', status: 'unlocked' },
        '3': { rule: 'time-limit-7d',     ruleType: 'expiry',   status: 'unlocked' },
      };
      if (!ruleMap[cmd]) {
        push(line('[ERR] Enter 1, 2, or 3 to select a rule.', 'pink'));
        setBusy(false);
        return;
      }
      const { rule, ruleType, status } = ruleMap[cmd];
      const id = `C-00${capsules.length + 1}`;
      const created = {
        ...newCap,
        id,
        rule,
        ruleType,
        status,
        createdAt: new Date().toISOString().split('T')[0],
        receiver: null,
        views: 0,
      };
      push(
        line('', 'empty'),
        line('[CAPSULE] Encrypting...', 'amber'),
        line('', 'progress'),
      );
      await sleep(200);
      await progress('green');
      push(
        line(`[CAPSULE] ${id} sealed successfully.`, 'green'),
        line(`[CAPSULE] Type: ${created.type.toUpperCase()}  |  Rule: ${rule}`, 'dim'),
        line('[CAPSULE] Stored in vault.', 'green'),
        line('', 'empty'),
      );
      setCapsules(prev => [...prev, created]);
      setCreateStep(0);
      setNewCap({});
    }
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createStep, newCap, capsules, push, progress]);

  return {
    lines,
    auth,
    user,
    capsules,
    createStep,
    busy,
    run,
    exitRequested,
    resetExit: () => setExitRequested(false),
    loginTime,
  };
}