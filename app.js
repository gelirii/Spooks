'use strict';

// Feed passive observations out one at a time so the page feels as though it is
// noticing things about the visitor while the scan is still running, rather
// than dumping every remark at once.
(() => {
  const queue = [];
  let timer = null;
  const maxRemarks = 16;

  Spooks.say = message => {
    if (!message || Spooks.spoken.has(message) || Spooks.spoken.size >= maxRemarks) return;
    Spooks.spoken.add(message);
    queue.push(message);
    pump();
  };

  function pump() {
    if (timer || !queue.length) return;
    const message = queue.shift();
    const el = document.createElement('div');
    el.className = 'observation';
    el.textContent = message;
    Spooks.observationRoot.appendChild(el);
    timer = setTimeout(() => {
      timer = null;
      pump();
    }, 620);
  }

  function addAfterScanRemarks() {
    const hour = new Date().getHours();
    const gpu = document.getElementById('topGpuVendor')?.textContent || '';
    const dnt = document.getElementById('topDNT')?.textContent || '';
    const language = navigator.language || '';
    const shortSide = Math.min(screen.width, screen.height);
    const longSide = Math.max(screen.width, screen.height);

    if (/withheld|unavailable/i.test(gpu)) {
      Spooks.say('Your browser refused to tell me exactly which GPU you have. Good.');
    }
    if (/not exposed|unspecified|undefined/i.test(dnt)) {
      Spooks.say("Your browser didn't give me a Do Not Track answer either.");
    }
    if (!navigator.getBattery) {
      Spooks.say('I asked about your battery. Your browser declined to answer.');
    }
    if (devicePixelRatio >= 3) {
      Spooks.say(`${devicePixelRatio} device pixels for each CSS pixel. Your screen is rather dense.`);
    }
    if (navigator.maxTouchPoints > 0 && shortSide < 600) {
      Spooks.say(`${shortSide} × ${longSide} CSS pixels and touch input. Very phone-shaped.`);
    }
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      Spooks.say(`Only ${navigator.hardwareConcurrency} logical processor threads are being exposed to me.`);
    }
    if (history.length > 1) {
      Spooks.say(`This tab says it already has ${history.length} entries in its session history.`);
    }
    if (!document.referrer) {
      Spooks.say("You didn't arrive with a referring page I can see.");
    }
    if (hour >= 6 && hour < 9) {
      Spooks.say('Breakfast before browser privacy experiments, presumably?');
    } else if (hour >= 14 && hour < 17) {
      Spooks.say('Afternoon procrastination detected. Probably.');
    } else if (hour >= 21 && hour < 23) {
      Spooks.say('A perfectly sensible time to let a strange webpage inspect your device.');
    }
    if (/^en-GB$/i.test(language)) {
      Spooks.say('British English. At least we agree on how to spell colour.');
    }
  }

  document.getElementById('deepButton').addEventListener('click', () => Spooks.deepScan(), {once:true});
  Spooks.passiveScan()
    .then(addAfterScanRemarks)
    .catch(e => {
      Spooks.log(`passive scan error: ${e.name || e}`, 'warn');
      document.getElementById('scanStatus').textContent = 'Passive scan partially completed';
      Spooks.render(Spooks.factRoot, Spooks.facts);
    });
})();
