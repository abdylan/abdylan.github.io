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
  async function mount({ document, location, fetch }) {
    const status = document.getElementById('invitation-status');
    const detail = document.getElementById('invitation-detail');
    const connect = document.getElementById('connect-phone');
    const manual = document.getElementById('manual-code');
    const code = parseCode(location.hash);
    connect.addEventListener('click', event => {
      if (connect.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });
    const show = (title, text, canOpen, retry = false) => {
      status.textContent = title; detail.textContent = text;
      connect.textContent = retry ? 'Open app to retry connection' : 'Connect this phone';
      connect.setAttribute('aria-disabled', canOpen ? 'false' : 'true');
      if (canOpen) connect.href = intentUrl(code);
      else connect.removeAttribute('href');
    };
    if (!code) {
      show('Private invitation needed', 'Open the private link or scan the QR code supplied by the app owner.', false);
      return;
    }
    manual.textContent = code.slice(0, 4) + '-' + code.slice(4);
    document.getElementById('manual-fallback').hidden = false;
    show('Checking invitation…', 'This check does not connect or claim your invitation.', false);
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
          show('Invitation available', 'Install the app, then tap Connect this phone. Confirm the connection in the app. Invitations expire 48 hours after creation.', true);
          break;
        case 'EXPIRED':
          show('Invitation expired', 'Ask the app owner for a new invitation. You can still download the app below.', false);
          break;
        case 'USED':
          show('Invitation already used', 'This invitation cannot connect another phone. If this phone lost its connection reply, open the app and retry the same code. Otherwise, ask for a new invitation.', true, true);
          break;
        case 'UNAVAILABLE':
          show('Invitation unavailable', 'Check the complete private link or ask the app owner for a new invitation.', false);
          break;
        default: throw new Error('Unexpected response');
      }
    } catch {
      show('Cannot check now', 'Check your internet connection and reload. You can also open the installed app and try your code; the server will check it before connecting.', true);
    } finally { clearTimeout(timeout); }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseCode, intentUrl, mount };
  else void mount({ document, location: window.location, fetch: window.fetch.bind(window) });
})();
