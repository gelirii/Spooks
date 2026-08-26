'use strict';
(() => {
  function loadMain() {
    const s = document.createElement('script');
    s.src = 'app.js?v=20260826d';
    s.async = false;
    document.head.appendChild(s);
  }

  async function run() {
    // Author CSS can override the browser's default [hidden] rule. On Safari the
    // chat layer's display:flex was therefore sitting over the editor as a black
    // sheet. Make hidden absolute for the two boot stages before the first paint.
    const fix = document.createElement('style');
    fix.textContent = `
      #chatStage[hidden], #sourceStage[hidden] { display:none !important; }
      #sourceStage:not([hidden]) { display:block !important; opacity:1 !important; }
    `;
    document.head.appendChild(fix);

    const stage = document.getElementById('sourceStage');
    const code = document.getElementById('sourceCode');
    const nums = document.getElementById('sourceNumbers');
    const chat = document.getElementById('chatStage');

    if (!stage || !code || !nums) return loadMain();

    stage.hidden = false;
    stage.classList.remove('stage-out');
    if (chat) chat.hidden = true;

    // Put genuine recognisable source on screen immediately, before app.js starts
    // the animated scroll. This guarantees the first painted boot frame isn't blank.
    const initial = [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
      '  <title>Spooks — Browser Interrogation</title>',
      '  <link rel="stylesheet" href="style.css">',
      '  <script defer src="core.js"><\/script>',
      '  <script defer src="passive.js"><\/script>',
      '  <script defer src="deep.js"><\/script>',
      '</head>',
      '<body class="booting">'
    ];
    code.textContent = initial.join('\n');
    nums.textContent = initial.map((_, i) => String(i + 1).padStart(4, ' ')).join('\n');

    // Let Safari paint the editor and the initial source before the main boot
    // animation starts. app.js then performs the single real source scroll.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    setTimeout(loadMain, 140);
  }

  run().catch(loadMain);
})();