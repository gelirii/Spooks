'use strict';
(() => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function loadMain() {
    const s = document.createElement('script');
    s.src = 'app.js?v=20260826c';
    s.async = false;
    document.head.appendChild(s);
  }

  async function run() {
    const stage = document.getElementById('sourceStage');
    const code = document.getElementById('sourceCode');
    const nums = document.getElementById('sourceNumbers');
    const chat = document.getElementById('chatStage');
    if (!stage || !code || !nums) return loadMain();

    stage.hidden = false;
    stage.classList.remove('stage-out');
    stage.style.opacity = '1';
    stage.style.transform = 'none';
    if (chat) chat.hidden = true;

    // Use the real DOM source already loaded in this tab. Break tags and common
    // attributes onto separate lines so it reads like recognisable HTML in an editor.
    const raw = '<!doctype html>\n' + document.documentElement.outerHTML
      .replace(/></g, '>\n<')
      .replace(/ (class|id|src|href|aria-[\w-]+|data-[\w-]+)=/g, '\n  $1=');
    const lines = raw.split('\n').filter(Boolean);
    const visible = Math.max(20, Math.min(38, Math.floor((innerHeight - 70) / 20)));

    // Force at least two browser paints before moving anything. This matters on iOS Safari.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);

    let end = Math.min(visible, lines.length);
    function paint() {
      const start = Math.max(0, end - visible);
      const slice = lines.slice(start, end);
      code.textContent = slice.join('\n');
      nums.textContent = slice.map((_, i) => String(start + i + 1).padStart(4, ' ')).join('\n');
    }

    paint();
    await sleep(650);

    // Scroll at a rate humans can actually notice, not just timers can execute.
    while (end < lines.length) {
      end = Math.min(lines.length, end + 1);
      paint();
      await sleep(46);
    }

    // Hold the last screen long enough to register before app.js takes over.
    await sleep(650);
    loadMain();
  }

  run().catch(loadMain);
})();
