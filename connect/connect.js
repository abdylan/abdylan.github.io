/* Private invitation stays in the URL fragment. No storage, analytics or automatic claim. */
(() => {
  'use strict';
  const base = 'https://abdylan.github.io/connect/';
  function parseCode(hash) {
    if (!/^#invite=[A-Za-z2-9-]{8,9}$/.test(hash)) return null;
    const code = hash.slice(8).replace(/-/g, '').toUpperCase();
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code) ? code : null;
  }
  function intentUrl(code) {
    return 'intent://abdylan.github.io/connect/#Intent;scheme=https;package=app.evidence.diagnostic;' +
      `S.invitationCode=${code};S.browser_fallback_url=${encodeURIComponent(base + '#invite=' + code)};end`;
  }
  async function mount({ document, location, fetch, isCurrent = () => true }) {
    const status = document.getElementById('invitation-status');
    const detail = document.getElementById('invitation-detail');
    const connect = document.getElementById('connect-phone');
    const manual = document.getElementById('manual-code');
    const steps = document.getElementById('connection-steps');
    const help = document.getElementById('connection-help');
    const download = document.getElementById('apk-download');
    const code = parseCode(location.hash);
    connect.onclick = event => {
      if (connect.getAttribute('aria-disabled') === 'true') event.preventDefault();
    };
    download.onclick = event => {
      if (download.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      document.getElementById('download-note').hidden = false;
    };
    document.getElementById('download-note').hidden = true;
    document.getElementById('install-help').open = false;
    document.getElementById('manual-fallback').open = false;
    const show = (title, text, canOpen, retry = false) => {
      if (!isCurrent()) return;
      status.textContent = title; detail.textContent = text;
      detail.hidden = !text;
      steps.hidden = !canOpen;
      help.hidden = !canOpen;
      connect.textContent = retry ? 'Open app to retry' : 'Open app';
      connect.setAttribute('aria-disabled', canOpen ? 'false' : 'true');
      if (canOpen) connect.href = intentUrl(code);
      else connect.removeAttribute('href');
    };
    if (!code) {
      show('Private invitation needed', 'Open the full invitation link sent to you.', false);
      return;
    }
    manual.textContent = code.slice(0, 4) + '-' + code.slice(4);
    document.getElementById('manual-fallback').hidden = false;
    show('Checking invitation…', '', false);
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12000);
    try {
      const response = await fetch('https://qpxn282je3.execute-api.ap-southeast-2.amazonaws.com/v1/enrollment/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
        credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store', signal: abort.signal
      });
      if (!response.ok) throw new Error('Unavailable');
      const raw = await response.text();
      if (raw.length > 4096) throw new Error('Unexpected response');
      const data = JSON.parse(raw);
      switch (data.status) {
        case 'AVAILABLE':
          show('Invitation available', '', true);
          break;
        case 'EXPIRED':
          show('Invitation expired', 'Ask for a new invitation link.', false);
          break;
        case 'USED':
          show('Invitation already used', 'Retry on the original phone. For another phone, ask for a new link.', true, true);
          break;
        case 'UNAVAILABLE':
          show('Invitation unavailable', 'Ask for a new invitation link.', false);
          break;
        default: throw new Error('Unexpected response');
      }
    } catch {
      show('Cannot check now', 'Check your internet connection, or try Open app.', true);
    } finally { clearTimeout(timeout); }
  }
  function start(browser) {
    let revision = 0;
    const render = () => {
      const current = ++revision;
      return mount({ document: browser.document, location: browser.location,
        fetch: browser.fetch.bind(browser), isCurrent: () => current === revision });
    };
    // Focus the content without replacing the access-bearing URL fragment.
    browser.document.getElementById('skip-content').onclick = event => {
      event.preventDefault(); browser.document.getElementById('main').focus();
    };
    browser.addEventListener('hashchange', render);
    return render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseCode, intentUrl, mount, start };
  else void start(window);
})();
