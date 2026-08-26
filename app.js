'use strict';
(() => {
  const S = window.Spooks;
  const collectedRemarks = [];
  const collectedSet = new Set();

  // Keep scan-time remarks, but tell the story later in a deliberate order.
  S.say = message => {
    if (!message || collectedSet.has(message)) return;
    collectedSet.add(message);
    collectedRemarks.push(message);
  };

  // Default-open behaviour is intentional rather than simply "first two groups".
  // The camera group stays shut so the captured still is something the visitor discovers.
  const alwaysCollapsed = new Set([
    'Browser & OS',
    'Locale & time',
    'Motion & orientation',
    'Closed / unsupported doors',
    'Camera & microphone metadata'
  ]);

  S.render = (root, data) => {
    const previouslyOpen = new Set(
      [...root.querySelectorAll('details[open]')].map(d => d.dataset.group)
    );
    root.textContent = '';
    const groups = new Map();
    for (const f of data) {
      if (!groups.has(f.group)) groups.set(f.group, []);
      groups.get(f.group).push(f);
    }

    let autoOpened = 0;
    for (const [group, rows] of groups) {
      const details = document.createElement('details');
      details.className = 'group';
      details.dataset.group = group;
      if (previouslyOpen.has(group)) details.open = true;
      else if (!alwaysCollapsed.has(group) && autoOpened < 2) {
        details.open = true;
        autoOpened++;
      }

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

    // Once a camera still exists, tuck it underneath its own metadata row.
    // Because the whole Camera & microphone metadata <details> starts collapsed,
    // the image is only encountered when the visitor chooses to open that section.
    if (root === S.deepRoot) {
      const panel = document.getElementById('capturePanel');
      const stillRow = [...root.querySelectorAll('.row')].find(r =>
        r.dataset.group === 'Camera & microphone metadata' && r.dataset.label === 'Still photograph'
      );
      if (panel && !panel.hidden && stillRow) stillRow.insertAdjacentElement('afterend', panel);
    }
  };

  function installTerminal() {
    document.querySelector('.hero-status')?.setAttribute('hidden', '');
    document.getElementById('heroTitle')?.setAttribute('hidden', '');
    document.getElementById('identityLine')?.setAttribute('hidden', '');
    document.getElementById('observations')?.setAttribute('hidden', '');

    const hero = document.querySelector('.hero');
    const lede = hero?.querySelector('.lede');
    if (!hero || !lede) return null;

    const terminal = document.createElement('pre');
    terminal.id = 'welcomeTerminal';
    terminal.setAttribute('aria-live', 'polite');
    terminal.setAttribute('aria-label', 'Live browser observations');
    hero.insertBefore(terminal, lede);

    const style = document.createElement('style');
    style.textContent = `
      #welcomeTerminal{margin:18px 0 20px;min-height:15.5em;max-height:46vh;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--green);font:600 clamp(.82rem,2.2vw,1.05rem)/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;text-shadow:0 0 16px rgba(110,255,181,.12)}
      #welcomeTerminal.source-rush{color:#729b87;font-size:clamp(.58rem,1.6vw,.74rem);line-height:1.25;opacity:.88}
      #welcomeTerminal .cursor{display:inline-block;width:.62em;height:1.05em;vertical-align:-.12em;background:var(--green);margin-left:.08em;animation:spooksBlink .75s steps(1,end) infinite}
      @keyframes spooksBlink{50%{opacity:0}}
      .capture{margin:10px 17px 16px;border:1px solid var(--line)!important;background:linear-gradient(180deg,rgba(13,21,19,.96),rgba(7,12,11,.96))!important;border-radius:14px;padding:12px;box-shadow:none!important}
      .capture img{display:block;width:100%;max-height:70vh;object-fit:contain;border-radius:10px;background:#000}
      .capture figcaption{font-size:.72rem;line-height:1.55;color:var(--muted)!important;margin-top:10px}
      .capture strong{color:inherit!important}
      @media(prefers-reduced-motion:reduce){#welcomeTerminal .cursor{animation:none}}
    `;
    document.head.appendChild(style);

    const caption = document.querySelector('#capturePanel figcaption');
    if (caption) caption.textContent = "Still photograph captured locally after camera permission. The image is held only in this page's memory, is not uploaded or saved, and disappears when you refresh or close the page.";
    return terminal;
  }

  const terminal = installTerminal();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function sourceRush() {
    if (!terminal) return;
    terminal.classList.add('source-rush');
    const source = document.documentElement.outerHTML;
    const chunk = Math.max(180, Math.ceil(source.length / 38));
    let shown = '';
    for (let i = 0; i < source.length; i += chunk) {
      shown += source.slice(i, i + chunk);
      // Keep only the tail visible, but every real character passes through the terminal.
      terminal.textContent = shown.slice(-7000);
      terminal.scrollTop = terminal.scrollHeight;
      await sleep(9);
    }
    await sleep(80);
    terminal.textContent = '';
    terminal.classList.remove('source-rush');
  }

  async function typeLine(text, speed = 12) {
    if (!terminal || !text) return;
    const base = terminal.textContent;
    for (let i = 0; i < text.length; i++) {
      terminal.textContent = base + text.slice(0, i + 1) + '▌';
      await sleep(speed);
    }
    terminal.textContent = base + text + '\n';
    await sleep(90);
  }

  async function waitUntil(test, timeout = 5000, interval = 50) {
    const start = performance.now();
    while (performance.now() - start < timeout) {
      const value = test();
      if (value) return value;
      await sleep(interval);
    }
    return null;
  }

  function greetingWithFingerprint() {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    let greeting;
    if (h < 4.5) greeting = "Gosh, you're up early.";
    else if (h < 6.5) greeting = "You're up suspiciously early.";
    else if (h >= 11.5 && h < 13.5) greeting = 'What have you got for lunch?';
    else if (h >= 23) greeting = 'Still awake?';
    else greeting = h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';
    const fp = document.getElementById('fingerprint')?.textContent || 'UNKNOWN';
    return `${greeting} Fingerprint ${fp}.`;
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

  function phoneShapeLine() {
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
    f.note = "A reliable lookup would contact another service. GitHub's server necessarily sees the IP address used to request this page, but the JavaScript running here does not receive that server-side request value. Spooks is dedicated to displaying information your browser reveals directly to the code running locally on this page.";
  }

  function extraRemarks() {
    const lines = [];
    const hour = new Date().getHours();
    const hz = S.facts.find(f => f.group === 'Hardware clues' && f.label === 'Observed animation cadence');
    const mem = S.facts.find(f => f.group === 'Hardware clues' && f.label === 'Approximate device memory');
    const gamepads = S.facts.find(f => f.group === 'Attached / exposed peripherals' && f.label === 'Gamepads');
    const connection = S.facts.find(f => f.group === 'Network & connectivity' && f.label === 'Effective connection type');

    if (matchMedia?.('(prefers-reduced-motion:reduce)').matches) lines.push("You prefer reduced motion. I'll try not to be dramatic about it.");
    if (navigator.globalPrivacyControl) lines.push('Global Privacy Control is enabled too.');
    if (hz && /(?:100|120|144|165|240)/.test(hz.value)) lines.push(`Your page is refreshing at about ${hz.value.replace('≈ ', '')}. Fancy.`);
    if (mem && !/not exposed/i.test(mem.value)) lines.push(`Your browser reports roughly ${mem.value}.`);
    if (gamepads && !/^None exposed$/i.test(gamepads.value)) lines.push(`You left a gamepad connected: ${gamepads.value}.`);
    if (connection && /(?:slow-2g|2g|3g)/i.test(connection.value)) lines.push('Your connection looks a little sleepy.');
    if (navigator.hardwareConcurrency >= 12) lines.push(`${navigator.hardwareConcurrency} logical processor threads exposed. Plenty.`);
    if (history.length > 1) lines.push(`This tab reports ${history.length} entries in its session history.`);
    if (hour >= 14 && hour < 17) lines.push('Afternoon procrastination detected. Probably.');
    else if (hour >= 21 && hour < 23) lines.push('A perfectly sensible time to let a strange webpage inspect your device.');
    return lines;
  }

  function isPriorityDuplicate(message) {
    const m = message.toLowerCase();
    return m.includes('dark mode') ||
      m.includes('british english') ||
      m.includes('written in english') ||
      m.includes('referring page') ||
      m.includes('do not track') ||
      m.includes('graphics stack') ||
      m.includes('touch point') ||
      m.includes('phone-shaped') ||
      m.includes('battery') ||
      m.includes('fingerprint');
  }

  async function narrative(scanPromise, rushPromise) {
    await waitUntil(() => {
      const f = document.getElementById('fingerprint')?.textContent;
      return f && !/calculating/i.test(f) ? f : null;
    }, 4000);
    await rushPromise;

    await typeLine(greetingWithFingerprint(), 8);

    if (matchMedia?.('(prefers-color-scheme:dark)').matches) await typeLine("I'm a dark mode user too.");
    else if (matchMedia?.('(prefers-color-scheme:light)').matches) await typeLine("You're using light mode. Brave choice.");

    await typeLine(languageLine());
    if (!document.referrer) await typeLine("You didn't arrive with a referring page I can see.");
    else await typeLine(`You arrived from ${document.referrer}.`);
    await typeLine(dntLine());

    const gpu = await waitUntil(graphicsLine, 4500);
    if (gpu) await typeLine(gpu);
    await typeLine(phoneShapeLine());

    await scanPromise;
    rewritePublicIPFact();
    S.render(S.factRoot, S.facts);

    const battery = batteryLine();
    if (battery) await typeLine(battery);

    const rest = [...collectedRemarks, ...extraRemarks()]
      .filter(m => !isPriorityDuplicate(m));
    const seen = new Set();
    for (const message of rest) {
      if (!message || seen.has(message)) continue;
      seen.add(message);
      await typeLine(message);
    }
  }

  document.getElementById('deepButton').addEventListener('click', () => S.deepScan(), {once:true});

  // The source display and passive scan genuinely happen at the same time.
  const rushPromise = sourceRush();
  const scanPromise = S.passiveScan().catch(e => {
    S.log(`passive scan error: ${e.name || e}`, 'warn');
    S.render(S.factRoot, S.facts);
  });
  narrative(scanPromise, rushPromise).catch(e => S.log(`welcome terminal error: ${e.name || e}`, 'warn'));
})();
