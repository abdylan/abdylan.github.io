/* No API calls, invitation handling, analytics, cookies or browser storage. */
(() => {
  "use strict";

  const config = window.EVIDENCE_SITE || {};
  const download = document.getElementById("apk-download");
  const note = document.getElementById("download-note");
  const meta = document.getElementById("download-meta");
  const options = document.getElementById("download-options");
  const optionsList = document.getElementById("download-options-list");
  if (!download) return;

  const compact = download.dataset?.layout === "compact";
  const labels = { universal: "Universal", arm64: "arm64-v8a", arm32: "armeabi-v7a" };
  let manualChoice = false;

  function cleanVersion(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function cleanSize(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  }

  function validUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim(), window.location.href);
      const sameOrigin = url.origin === window.location.origin;
      const allowedProtocol = url.protocol === "https:" || (sameOrigin && url.protocol === "http:");
      // Do not publish access-bearing query strings or permit executable URLs.
      if (!allowedProtocol || url.username || url.password || url.search || url.hash || !url.pathname.endsWith(".apk")) return null;
      return url;
    } catch {
      return null;
    }
  }

  function formatSize(sizeMb) {
    return `${sizeMb.toLocaleString("en", { maximumFractionDigits: 1 })} MB`;
  }

  const baseUrl = validUrl(config.apkUrl);
  const base = baseUrl
    ? { id: "universal", url: baseUrl, version: cleanVersion(config.appVersion), sizeMb: cleanSize(config.apkSizeMb) }
    : null;
  const configuredVariants = config.variants && typeof config.variants === "object" && !Array.isArray(config.variants)
    ? config.variants
    : {};
  const variants = {};
  for (const id of ["arm64", "arm32", "universal"]) {
    const value = configuredVariants[id];
    if (!value || typeof value !== "object") continue;
    const url = validUrl(value.apkUrl);
    if (!url) continue;
    // Per-file version and size only: never borrow the base file's metadata.
    variants[id] = { id, url, version: cleanVersion(value.appVersion), sizeMb: cleanSize(value.apkSizeMb) };
  }

  // A configured universal variant is authoritative; the legacy single apkUrl
  // remains the universal fallback until the next publication fills all variants.
  const universal = variants.universal || base;
  if (!universal) return;

  // Only offer architecture files whose public version matches the universal
  // fallback. This prevents a smaller file from silently mixing release versions.
  const architectureVariants = {};
  for (const id of ["arm64", "arm32"]) {
    const candidate = variants[id];
    if (!candidate || !universal.version || candidate.version !== universal.version) continue;
    architectureVariants[id] = candidate;
  }

  const ready = [];
  for (const candidate of [universal, architectureVariants.arm64, architectureVariants.arm32]) {
    if (candidate && !ready.some((item) => item.url.href === candidate.url.href)) ready.push(candidate);
  }

  function selectPrimary(candidate) {
    download.href = candidate.url.href;
    download.removeAttribute("aria-disabled");
    download.setAttribute("referrerpolicy", "no-referrer");
    if (!compact) note.textContent = "Download the APK, then follow the installation steps. Cloud access requires your connection code in the app.";

    const details = [];
    if (compact) details.push("Android 11+");
    else if (candidate.version) details.push(`Version ${candidate.version}`);
    if (candidate.sizeMb) details.push(`${formatSize(candidate.sizeMb)}${compact ? "" : " download"}`);
    if (candidate.id !== "universal") details.push(labels[candidate.id]);
    meta.textContent = details.join(" · ");
    meta.hidden = details.length === 0;
  }

  function optionText(candidate) {
    const details = [labels[candidate.id]];
    if (candidate.version) details.push(`Version ${candidate.version}`);
    if (candidate.sizeMb) details.push(formatSize(candidate.sizeMb));
    return details.join(" · ");
  }

  function renderOptions() {
    if (!options || !optionsList || typeof document.createElement !== "function") return;
    optionsList.textContent = "";
    for (const candidate of ready) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = candidate.url.href;
      link.setAttribute("referrerpolicy", "no-referrer");
      link.textContent = optionText(candidate);
      link.addEventListener("click", () => { manualChoice = true; });
      item.appendChild(link);
      optionsList.appendChild(item);
    }
    options.hidden = ready.length < 2;
  }

  function decision(values) {
    if (!values || typeof values !== "object") return null;
    const architecture = typeof values.architecture === "string" ? values.architecture.trim().toLowerCase() : "";
    const bitness = values.bitness === undefined || values.bitness === null ? "" : String(values.bitness).trim();
    if (architecture === "arm" && bitness === "64") return "arm64";
    if (architecture === "arm" && bitness === "32") return "arm32";
    return null;
  }

  function recommend() {
    if (manualChoice || (!architectureVariants.arm64 && !architectureVariants.arm32)) return;
    if (typeof navigator === "undefined" || typeof setTimeout !== "function") return;
    const agent = navigator.userAgentData;
    if (!agent || agent.platform !== "Android" || typeof agent.getHighEntropyValues !== "function") return;

    let settled = false;
    let timer = null;
    const finish = (id) => {
      if (settled) return;
      settled = true;
      if (timer !== null && typeof clearTimeout === "function") clearTimeout(timer);
      if (manualChoice) return;
      selectPrimary((id && architectureVariants[id]) || universal);
    };

    timer = setTimeout(() => finish(null), 1000);
    let request;
    try {
      request = agent.getHighEntropyValues(["architecture", "bitness"]);
    } catch {
      finish(null);
      return;
    }
    if (!request || typeof request.then !== "function") {
      finish(null);
      return;
    }
    request.then((values) => finish(decision(values)), () => finish(null));
  }

  if (typeof download.addEventListener === "function") {
    download.addEventListener("click", () => { manualChoice = true; });
  }
  selectPrimary(universal);
  renderOptions();
  recommend();
})();
