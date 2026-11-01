"use strict";

let language = "en";
let catalog = null;
let failed = false;
const copy = (en, ur) => language === "ur" ? ur : en;

function renderUpdates() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  document.getElementById("language").textContent = language === "ur" ? "English" : "اردو";
  document.getElementById("title").textContent = copy("What’s new", "کیا نیا ہے");
  document.getElementById("instruction").textContent = copy(
    "Open the downloaded APK and tap Update. Keep the app installed to keep your recordings and cloud connection.",
    "ڈاؤن لوڈ شدہ APK کھولیں اور اپ ڈیٹ دبائیں۔ ریکارڈنگ اور کلاؤڈ رابطہ محفوظ رکھنے کے لیے ایپ حذف نہ کریں۔");
  document.getElementById("status").textContent = failed
    ? copy("Couldn’t load updates. Try again when connected.", "تازہ کاریاں لوڈ نہیں ہو سکیں۔ انٹرنیٹ دستیاب ہونے پر دوبارہ کوشش کریں۔")
    : catalog ? "" : copy("Loading updates…", "تازہ کاریاں لوڈ ہو رہی ہیں…");
  const container = document.getElementById("releases");
  container.replaceChildren();
  if (!catalog) return;
  catalog.releases.filter(release => release.published).sort((a, b) => b.versionCode - a.versionCode).forEach((release, index) => {
    const article = document.createElement("article");
    const heading = document.createElement("h2");
    heading.textContent = release.versionName;
    article.append(heading);
    const bullets = document.createElement("ul");
    (release.changes[language] || release.changes.en).forEach(note => {
      const item = document.createElement("li"); item.textContent = note; bullets.append(item);
    });
    article.append(bullets);
    // Only the newest published APK is offered. Never direct users to a downgrade.
    if (index === 0) {
      const url = new URL(release.apkUrl);
      const filename = `evidence-recorder-${release.versionName}-release.apk`;
      if (url.origin === "https://github.com" && !url.username && !url.password && !url.search && !url.hash &&
          url.pathname.startsWith("/abdylan/abdylan.github.io/releases/download/") && url.pathname.endsWith(`/${filename}`)) {
        const link = document.createElement("a"); link.className = "download"; link.href = url.href;
        link.textContent = copy("Download latest update", "تازہ ترین اپ ڈیٹ ڈاؤن لوڈ کریں"); article.append(link);
      }
    }
    container.append(article);
  });
}

document.getElementById("language").addEventListener("click", () => { language = language === "en" ? "ur" : "en"; renderUpdates(); });
fetch("releases.json", { cache: "no-cache" }).then(response => {
  if (!response.ok) throw new Error("Unavailable");
  return response.json();
}).then(value => {
  if (value.schemaVersion !== 1 || value.packageName !== "app.evidence.diagnostic" || !Array.isArray(value.releases)) throw new Error("Invalid catalog");
  catalog = value; renderUpdates();
}).catch(() => { catalog = null; failed = true; renderUpdates(); });
