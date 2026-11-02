/* Local device matching only. No storage, telemetry, network requests or hardware probes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EvidenceApkRecommendation = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const normalize = value => typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";
  const ids = { "arm64-v8a": "arm64", "armeabi-v7a": "arm32" };
  const universal = reason => ({ id: "universal", basis: "fallback", reason });

  function matchModel(value, catalog) {
    const key = normalize(value);
    if (!key || key.length > 120 || !Array.isArray(catalog?.devices)) return null;
    const matches = catalog.devices.filter(row => Array.isArray(row.aliases) && row.aliases.some(alias => normalize(alias) === key));
    if (!matches.length || matches.some(row => row.abi !== matches[0].abi || row.blocked)) return null;
    return matches[0];
  }

  function userAgentModels(ua) {
    if (typeof ua !== "string" || ua.length > 2048 || !/\bAndroid\b/i.test(ua)) return [];
    const group = ua.match(/\(([^)]*Android[^)]*)\)/i)?.[1] || "";
    return group.split(";").map(value => value.replace(/\s+Build\/.*$/i, "").replace(/\s+wv$/i, "").trim())
      .filter(value => value && !/^(?:Linux|U|wv|Mobile|Android\b|[a-z]{2}(?:[-_][a-z]{2})?$)/i.test(value));
  }

  function modelDecision(models, catalog) {
    const rows = models.map(value => matchModel(value, catalog)).filter(Boolean);
    if (!rows.length || rows.some(row => row.abi !== rows[0].abi)) return universal("unconfirmed");
    const row = rows[0];
    const id = ids[row.abi];
    return id ? { id, basis: "model", model: row.name, source: row.source, reason: "model-estimate" } : universal("unconfirmed");
  }

  function recommend(navigator = {}, hints = {}, catalog = {}) {
    const platform = normalize(hints.platform || navigator.userAgentData?.platform);
    const ua = typeof navigator.userAgent === "string" ? navigator.userAgent : "";
    if (platform && platform !== "android") return universal("not-android");
    if (platform !== "android" && !/\bAndroid\b/i.test(ua)) return universal("not-android");
    // Only Client Hints' OS version is usable here: Chrome freezes UA Android at 10.
    const version = typeof hints.platformVersion === "string" && hints.platformVersion.match(/^(\d+)(?:\.|$)/);
    if (version && Number(version[1]) > 0 && Number(version[1]) < 11) return { ...universal("android-too-old"), unsupported: true };
    const architecture = normalize(hints.architecture);
    const bits = String(hints.bitness || "").trim();
    if ((architecture === "arm" && bits === "64") || (["arm64", "aarch64", "arm64-v8a"].includes(architecture) && (!bits || bits === "64")))
      return { id: "arm64", basis: "browser", reason: "cpu-hint" };
    if ((architecture === "arm" && bits === "32") || (architecture === "armeabi-v7a" && (!bits || bits === "32")))
      return { id: "arm32", basis: "browser", reason: "cpu-hint" };
    if (architecture && !["arm", "arm64", "aarch64", "arm64-v8a", "armeabi-v7a"].includes(architecture)) return universal("unsupported-cpu");
    if ((["arm64", "aarch64", "arm64-v8a"].includes(architecture) && bits && bits !== "64")
      || (architecture === "armeabi-v7a" && bits && bits !== "32")) return universal("conflicting-cpu-hints");
    const models = typeof hints.model === "string" && hints.model.trim() && hints.model !== "K"
      ? [hints.model] : userAgentModels(ua);
    const decision = modelDecision(models, catalog);
    if (decision.basis === "model") return decision;
    // An explicit 64-bit ARM token is a browser report, not an installed-ABI proof.
    // armv7l/armv8l can describe a 32-bit browser on 64-bit Android: never infer ARM32.
    if (/\b(?:aarch64|arm64-v8a)\b/i.test(ua) || /^Linux aarch64$/i.test(navigator.platform || ""))
      return { id: "arm64", basis: "browser", reason: "legacy-cpu-token" };
    return decision;
  }
  return { normalize, matchModel, modelDecision, userAgentModels, recommend };
});
