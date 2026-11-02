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

  const matcher = window.EvidenceApkRecommendation;
  const catalog = window.EVIDENCE_DEVICE_CATALOG || {};
  const explanation = document.getElementById("download-recommendation");
  const modelInput = document.getElementById("phone-model");
  const modelList = document.getElementById("phone-models");
  const matchAlert = document.getElementById("phone-match-alert");
  const chooseModel = document.getElementById("choose-phone-model");
  const modelPicker = document.getElementById("phone-picker");
  const browser = typeof navigator === "undefined" ? {} : navigator;
  let lastHints = {};

  function applyRecommendation(result, settled = true) {
    if (!result) return;
    if (matchAlert) matchAlert.hidden = !(settled && !result.unsupported
      && result.basis === "fallback" && result.reason === "unconfirmed");
    if (result.unsupported) {
      download.removeAttribute("href");
      download.setAttribute("aria-disabled", "true");
      if (explanation) { explanation.hidden = false; explanation.textContent = "Android 11 or later is required. This phone reports an older Android version."; }
      return;
    }
    const available = result.id === "universal" ? universal : architectureVariants[result.id];
    selectPrimary(available || universal);
    if (!explanation) return;
    explanation.hidden = false;
    explanation.textContent = !available || result.id === "universal"
      ? "Architecture could not be confirmed. Universal is recommended."
      : result.basis === "model"
        ? `${result.model}: ${labels[result.id]} suggested from the phone model. Android compatibility is not confirmed; use Universal if installation fails.`
        : `${labels[result.id]} suggested from browser CPU information. Universal is also available.`;
  }

  function recommend() {
    if (manualChoice || (!architectureVariants.arm64 && !architectureVariants.arm32)) return;
    const fallback = () => matcher?.recommend(browser, {}, catalog) || { id: "universal" };
    const agent = browser.userAgentData;
    const canAsk = agent?.platform === "Android" && typeof agent.getHighEntropyValues === "function";
    applyRecommendation(fallback(), !canAsk);
    if (!canAsk) return;
    let settled = false;
    let timer = null;
    const finish = values => {
      if (settled) return;
      settled = true;
      if (timer !== null && typeof clearTimeout === "function") clearTimeout(timer);
      if (manualChoice) return;
      lastHints = values || {};
      const result = matcher?.recommend(browser, lastHints, catalog);
      if (result) applyRecommendation(result);
      else {
        const id = values?.architecture === "arm" ? ({ "64": "arm64", "32": "arm32" })[String(values?.bitness)] : null;
        selectPrimary((id && architectureVariants[id]) || universal);
      }
    };
    timer = setTimeout(() => finish(null), 1000);
    try {
      const request = agent.getHighEntropyValues(["architecture", "bitness", "model", "platformVersion"]);
      if (!request || typeof request.then !== "function") finish(null);
      else request.then(finish, () => finish(null));
    } catch { finish(null); }
  }

  if (chooseModel && modelPicker && modelInput) {
    chooseModel.addEventListener("click", () => {
      modelPicker.open = true;
      chooseModel.setAttribute("aria-expanded", "true");
      modelInput.value = "";
      modelInput.scrollIntoView({ block: "center", behavior: "auto" });
      modelInput.focus();
      try { modelInput.showPicker?.(); } catch { /* Focused, searchable input remains usable. */ }
    });
    modelPicker.addEventListener("toggle", () => chooseModel.setAttribute("aria-expanded", String(modelPicker.open)));
  }

  if (modelInput && matcher) {
    if (modelList && Array.isArray(catalog.devices)) {
      const names = [...new Set(catalog.devices.map(row => row.name))].sort();
      for (const name of names) {
        const option = document.createElement("option"); option.value = name; modelList.appendChild(option);
      }
    }
    modelInput.addEventListener("change", () => {
      manualChoice = true;
      // Manual exact model selection remains available when the browser hides its model.
      const result = matcher.modelDecision([modelInput.value], catalog);
      if (lastHints.platformVersion && matcher.recommend(browser, lastHints, catalog).unsupported)
        applyRecommendation(matcher.recommend(browser, lastHints, catalog));
      else applyRecommendation(result);
    });
  }

  if (typeof download.addEventListener === "function") {
    download.addEventListener("click", () => { manualChoice = true; });
  }
  selectPrimary(universal);
  renderOptions();
  recommend();
})();
