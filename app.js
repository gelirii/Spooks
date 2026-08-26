'use strict';
(() => {
  const S = window.Spooks;
  const collectedRemarks = [];
  const collectedSet = new Set();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  S.say = message => {
    if (!message || collectedSet.has(message)) return;
    collectedSet.add(message);
    collectedRemarks.push(message);
  };

  S.render = (root, data) => {
    const previouslyOpen = new Set([...root.querySelectorAll('details[open]')].map(d => d.dataset.group));
    root.textContent = '';
    const groups = new Map();
    for (const f of data) {
      if (!groups.has(f.group)) groups.set(f.group, []);
      groups.get(f.group).push(f);
    }

    for (const [group, rows] of groups) {
      const details = document.createElement('details');
      details.className = 'group';
      details.dataset.group = group;
      if (previouslyOpen.has(group)) details.open = true;

      const summary = document.createElement('summary');
      const title = document.createElement('span');
      title.textContent = group;
      const count = document.createElement('span');
      count.className = 'group-count';
      count.textContent = `${rows.length} signals`;
      summary.append(title, count);
      details.append(summary);

      const body = document.createElement('div');
      body.className = 'rows';
      for (const f of rows) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.group = group;
        row.dataset.label = f.label;

        const lab = document.createElement('div');
        lab.className = 'label';
        lab.textContent = f.label;
        const value = document.createElement('div');
        value.className = 'value';
        value.textContent = f.note ? `${f.value}\n${f.note}` : f.value;
        const badge = document.createElement('span');
        badge.className = `badge ${f.kind}`;
        badge.textContent = f.kind;
        row.append(lab, value, badge);
        body.append(row);
      }
      details.append(body);
      root.append(details);
    }

    if (root === S.deepRoot) {
      const panel = document.getElementById('capturePanel');
      const stillRow = [...root.querySelectorAll('.row')].find(r =>
        r.dataset.group === 'Camera & microphone metadata' && r.dataset.label === 'Still photograph'
      );
      if (panel && !panel.hidden && stillRow) stillRow.insertAdjacentElement('afterend', panel);
    }
  };

  const sourceStage = document.getElementById('sourceStage');
  const sourceCode = document.getElementById('sourceCode');
  const sourceNumbers = document.getElementById('sourceNumbers');
  const chatStage = document.getElementById('chatStage');
  const chatTerminal = document.getElementById('chatTerminal');
  const bootScreen = document.getElementById('bootScreen');
  const dossier = document.getElementById('dossier');

  async function sourceRush() {
    const source = document.documentElement.outerHTML.replace(/></g, '>\n<');
    const lines = source.split('\n');
    const visible = 34;
    let end = 0;

    while (end < lines.length) {
      end = Math.min(lines.length, end + 2);
      const start = Math.max(0, end - visible);
      const slice = lines.slice(start, end);
      sourceCode.textContent = slice.join('\n');
      sourceNumbers.textContent = slice.map((_, i) => String(start + i + 1).padStart(4, ' ')).join('\n');
      await sleep(32);
    }

    await sleep(320);
    sourceStage.classList.add('stage-out');
    await sleep(260);
    sourceStage.hidden = true;
    chatStage.hidden = false;
    chatStage.classList.add('stage-in');
    await sleep(220);
  }

  async function waitUntil(test, timeout = 6500, interval = 40) {
    const start = performance.now();
    while (performance.now() - start < timeout) {
      const value = test();
      if (value) return value;
      await sleep(interval);
    }
    return null;
  }

  async function typeLine(text, pauseAfter = 650, charDelay = 24) {
    if (!text) return;
    const line = document.createElement('div');
    line.className = 'chat-line';
    const prompt = document.createElement('span');
    prompt.className = 'chat-prompt';
    prompt.textContent = '> ';
    const words = document.createElement('span');
    const cursor = document.createElement('span');
    cursor.className = 'chat-cursor';
    line.append(prompt, words, cursor);
    chatTerminal.append(line);

    for (const ch of text) {
      words.textContent += ch;
      chatTerminal.scrollTop = chatTerminal.scrollHeight;
      const jitter = ch === ' ' ? 0 : Math.floor(Math.random() * 11) - 5;
      await sleep(Math.max(7, charDelay + jitter));
      if (ch === '.') await sleep(240);
    }
    cursor.remove();
    await sleep(pauseAfter);
  }

  function greeting() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < 4.5) return "Gosh, you're up early.";
    if (h < 6.5) return "You're up suspiciously early.";
    if (h >= 11.5 && h < 13.5) return 'What have you got for lunch?';
    if (h >= 23) return 'Still awake?';
    return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
  }

  function languageLine() {
    const lang = navigator.language || '';
    if (/^en-GB$/i.test(lang)) return 'British English. At least we agree on how to spell colour.';
    if (/^en\b/i.test(lang)) return `${lang}. English, then.`;
    return `Your preferred language is ${S.languageName(lang)}. Sorry, I'm written in English.`;
  }

  function dntLine() {
    const dnt = document.getElementById('topDNT')?.textContent || '';
    if (/^(1|yes)$/i.test(dnt)) return 'You have Do Not Track switched on.';
    if (/^(0|no)$/i.test(dnt)) return 'Do Not Track is switched off.';
    return "Your browser didn't give me a Do Not Track answer.";
  }

  function graphicsLine() {
    const gpu = document.getElementById('topGpuVendor')?.textContent || '';
    if (!gpu || /probing/i.test(gpu)) return null;
    if (/withheld|unavailable|blank/i.test(gpu)) return 'Your browser kept the unmasked graphics vendor to itself.';
    return `Your graphics stack identifies its vendor as ${gpu}.`;
  }

  function deviceShapeLine() {
    const shortSide = Math.min(screen.width, screen.height);
    const longSide = Math.max(screen.width, screen.height);
    const dpr = devicePixelRatio || 1;
    const touches = navigator.maxTouchPoints || 0;
    if (touches > 0 && shortSide < 700) return `${shortSide} × ${longSide} CSS pixels, ${dpr}× pixel density and ${touches} touch points. Very phone-shaped.`;
    if (touches > 0) return `${shortSide} × ${longSide} CSS pixels, ${dpr}× pixel density and ${touches} touch points. Definitely touch-capable.`;
    return `${shortSide} × ${longSide} CSS pixels at ${dpr}× pixel density, with no touch points exposed.`;
  }

  function batteryLine() {
    const battery = S.facts.find(f => f.group === 'Power' && f.label === 'Battery level');
    const charging = S.facts.find(f => f.group === 'Power' && f.label === 'Charging');
    const api = S.facts.find(f => f.group === 'Power' && f.label === 'Battery API');
    if (battery) {
      const pct = parseInt(battery.value, 10);
      const isCharging = charging && /^Yes$/i.test(charging.value);
      if (Number.isFinite(pct) && pct <= 20 && !isCharging) return `Your battery is running low — ${pct}%.`;
      if (isCharging) return `Your battery is at ${pct}% and charging.`;
      return `Your battery is at ${pct}%.`;
    }
    if (api) return 'I asked about your battery. Your browser declined to give me a useful answer.';
    return null;
  }

  function rewritePublicIPFact() {
    const f = S.facts.find(x => x.group === 'Network & connectivity' && x.label === 'Public IP');
    if (!f) return;
    f.value = 'Doable, but intentionally not queried';
    f.note = "GitHub's server necessarily sees the source IP address used to request this page, but that server-side value is not automatically exposed to the JavaScript running here. A reliable client-side lookup would contact another service. This page is dedicated to displaying information your browser reveals directly to the code running locally.";
  }

  function isPriorityDuplicate(message) {
    const m = String(message).toLowerCase();
    return m.includes('dark mode') || m.includes('light mode') ||
      m.includes('british english') || m.includes('written in english') ||
      m.includes('referring page') || m.includes('do not track') ||
      m.includes('graphics stack') || m.includes('graphics vendor') ||
      m.includes('touch point') || m.includes('phone-shaped') ||
      m.includes('battery') || m.includes('fingerprint') ||
      m.includes('passive scan');
  }

  function extraRemarks() {
    const out = [];
    const hz = S.facts.find(f => f.group === 'Hardware clues' && f.label === 'Observed animation cadence');
    const gamepads = S.facts.find(f => f.group === 'Attached / exposed peripherals' && f.label === 'Gamepads');
    const connection = S.facts.find(f => f.group === 'Network & connectivity' && f.label === 'Effective connection type');
    if (matchMedia?.('(prefers-reduced-motion:reduce)').matches) out.push("You prefer reduced motion. I'll try not to be dramatic about it.");
    if (navigator.globalPrivacyControl) out.push('Global Privacy Control is enabled too.');
    if (hz && /(?:100|120|144|165|240)/.test(hz.value)) out.push(`Your page is refreshing at about ${hz.value.replace('≈ ', '')}. Fancy.`);
    if (gamepads && !/^None exposed$/i.test(gamepads.value)) out.push(`You left a gamepad connected: ${gamepads.value}.`);
    if (connection && /(?:slow-2g|2g|3g)/i.test(connection.value)) out.push('Your connection looks a little sleepy.');
    if (navigator.hardwareConcurrency >= 12) out.push(`${navigator.hardwareConcurrency} logical processor threads exposed. Plenty.`);
    return out;
  }

  async function terminalConversation(scanPromise) {
    await typeLine(greeting(), 850, 34);

    const fp = await waitUntil(() => {
      const value = document.getElementById('fingerprint')?.textContent;
      return value && !/calculating/i.test(value) ? value : null;
    });
    await typeLine(`I'll fingerprint you as ${fp || 'UNKNOWN'}.`, 1050, 17);

    if (matchMedia?.('(prefers-color-scheme:dark)').matches) await typeLine("I'm a dark mode user too.", 760, 29);
    else if (matchMedia?.('(prefers-color-scheme:light)').matches) await typeLine("You're using light mode.", 760, 29);

    await typeLine(languageLine(), 820, 25);

    if (!document.referrer) await typeLine("You didn't arrive with a referring page I can see.", 780, 23);
    else await typeLine(`You arrived from ${document.referrer}.`, 780, 16);

    await typeLine(dntLine(), 800, 24);

    const gpu = await waitUntil(graphicsLine, 5000);
    if (gpu) await typeLine(gpu, 760, 20);

    await typeLine(deviceShapeLine(), 820, 18);

    await scanPromise;
    rewritePublicIPFact();
    S.render(S.factRoot, S.facts);

    const battery = batteryLine();
    if (battery) await typeLine(battery, 850, 25);

    const rest = [...collectedRemarks, ...extraRemarks()].filter(m => !isPriorityDuplicate(m));
    const seen = new Set();
    for (const message of rest.slice(0, 6)) {
      if (!message || seen.has(message)) continue;
      seen.add(message);
      await typeLine(message, 620, 20);
    }

    await typeLine("You haven't given me permission to know anything yet.", 1100, 28);
    await typeLine("I'm going to see what your browser gives away anyway.", 4000, 25);
  }

  async function revealDossier() {
    chatStage.classList.add('stage-out');
    await sleep(360);
    bootScreen.classList.add('boot-dismiss');
    dossier.hidden = false;
    document.body.classList.remove('booting');
    requestAnimationFrame(() => dossier.classList.add('dossier-visible'));
    await sleep(420);
    bootScreen.hidden = true;
    window.scrollTo({top: 0, behavior: 'instant'});
  }

  document.getElementById('deepButton').addEventListener('click', () => S.deepScan(), {once:true});

  const scanPromise = S.passiveScan().catch(e => {
    S.log(`passive scan error: ${e.name || e}`, 'warn');
    S.render(S.factRoot, S.facts);
  });

  (async () => {
    await sourceRush();
    await terminalConversation(scanPromise);
    await revealDossier();
  })().catch(async e => {
    S.log(`boot conversation error: ${e.name || e}`, 'warn');
    await scanPromise;
    rewritePublicIPFact();
    S.render(S.factRoot, S.facts);
    await revealDossier();
  });
})();
