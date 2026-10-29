/* No API calls, invitation handling, analytics, cookies or browser storage. */
(() => {
  "use strict";

  const config = window.EVIDENCE_SITE || {};
  const download = document.getElementById("apk-download");
  const note = document.getElementById("download-note");
  const meta = document.getElementById("download-meta");
  const configuredUrl = typeof config.apkUrl === "string" ? config.apkUrl.trim() : "";
  if (!configuredUrl) return;

  let url;
  try {
    url = new URL(configuredUrl, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    const allowedProtocol = url.protocol === "https:" || (sameOrigin && url.protocol === "http:");
    // Do not publish access-bearing query strings or permit executable URLs.
    if (!allowedProtocol || url.username || url.password || url.search || url.hash || !url.pathname.endsWith(".apk")) return;
  } catch {
    return;
  }

  download.href = url.href;
  download.removeAttribute("aria-disabled");
  download.setAttribute("referrerpolicy", "no-referrer");
  note.textContent = "Download the APK, then follow the installation steps. Cloud access requires your connection code in the app.";

  const details = [];
  if (typeof config.appVersion === "string" && config.appVersion.trim()) details.push(`Version ${config.appVersion.trim()}`);
  if (typeof config.apkSizeMb === "number" && Number.isFinite(config.apkSizeMb) && config.apkSizeMb > 0) {
    details.push(`${config.apkSizeMb.toLocaleString("en", { maximumFractionDigits: 1 })} MB download`);
  }
  if (details.length) {
    meta.textContent = details.join(" · ");
    meta.hidden = false;
  }
})();
