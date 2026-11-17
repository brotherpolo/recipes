// Send to Recipe Checklist: click the toolbar button (or press Alt+Shift+R) on a recipe page.
// It reads the recipe from the page you're on, in your own browser, so sites that block link
// loading (Allrecipes, Serious Eats…) still work, then opens Recipe Checklist with it.
// Permissions: "activeTab" + "scripting" only, so it can read just the tab you clicked it on, at that moment.
const APP_URL = "https://brotherpolo.github.io/recipes/";

// Runs inside the recipe page. Same code as the Recipe Checklist's own Send button.
function recipeExtractor() {
  var A = function (v) { return v == null ? [] : Array.isArray(v) ? v : [v]; };
  var isR = function (o) { return o && A(o["@type"]).some(function (t) { return String(t).toLowerCase() === "recipe"; }); };
  var find = function (n, d) {
    if (!n || typeof n !== "object" || d > 8) return null;
    if (Array.isArray(n)) { for (var i = 0; i < n.length; i++) { var x = find(n[i], d + 1); if (x) return x; } return null; }
    if (isR(n)) return n;
    var ks = ["@graph", "mainEntity", "mainEntityOfPage", "itemListElement", "item"];
    for (var j = 0; j < ks.length; j++) if (n[ks[j]]) { var y = find(n[ks[j]], d + 1); if (y) return y; }
    return null;
  };
  var trimStep = function (s) {
    if (typeof s === "string") return s;
    if (Array.isArray(s)) return s.map(trimStep);
    if (!s || typeof s !== "object") return s;
    var o = { "@type": s["@type"] };
    if (s.name) o.name = s.name;
    if (s.text) o.text = s.text;
    if (s.itemListElement) o.itemListElement = trimStep(s.itemListElement);
    return o;
  };
  var r = null, scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (var k = 0; k < scripts.length && !r; k++) { try { r = find(JSON.parse(scripts[k].textContent), 0); } catch (e) {} }
  if (!r) return "";
  var keep = { "@type": "Recipe" };
  ["name", "recipeYield", "totalTime", "prepTime", "cookTime", "recipeIngredient"].forEach(function (f) { if (r[f] != null) keep[f] = r[f]; });
  keep.recipeInstructions = trimStep(r.recipeInstructions);
  var img = A(r.image)[0]; if (img && typeof img === "object") img = img.url;
  if (typeof img === "string") keep.image = img;
  var groups = [].map.call(document.querySelectorAll(".wprm-recipe-ingredient-group"), function (g) {
    var h = g.querySelector(".wprm-recipe-group-name");
    return { group: h ? h.textContent.trim() : "", items: [].map.call(g.querySelectorAll("li.wprm-recipe-ingredient"), function (li) {
      var c = li.cloneNode(true); [].forEach.call(c.querySelectorAll(".wprm-checkbox-container"), function (x) { x.remove(); });
      return c.textContent.replace(/\s+/g, " ").trim();
    }) };
  });
  return JSON.stringify({ u: location.href, r: keep, g: groups });
}

// Runs inside the recipe page when there's nothing to send.
function showNote(text) {
  const id = "recipe-checklist-note";
  document.getElementById(id)?.remove();
  const d = document.createElement("div");
  d.id = id; d.textContent = text; d.setAttribute("role", "status");
  d.style.cssText = "position:fixed;z-index:2147483647;top:16px;right:16px;max-width:320px;padding:12px 16px;" +
    "background:#1d1d1b;color:#fcfbf8;font:500 14px/1.4 system-ui,sans-serif;border-radius:2px;box-shadow:0 8px 24px rgba(0,0,0,.25)";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 4500);
}

async function flash(tabId, text) {
  await chrome.action.setBadgeBackgroundColor({ color: "#b2372a", tabId });
  await chrome.action.setBadgeText({ text, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: "", tabId }), 3000);
}

async function sendTab(tab) {
  if (!tab || !tab.id) return;
  let json = "";
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: recipeExtractor });
    json = res && res.result;
  } catch (e) {
    // Chrome's own pages, the Web Store and PDFs can't be read by any extension.
    return flash(tab.id, "✕");
  }
  if (!json) {
    await flash(tab.id, "?");
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: showNote,
      args: ["No recipe found on this page. Open the recipe itself (not a list of recipes) and try again."] }).catch(() => {});
    return;
  }
  chrome.tabs.create({ url: APP_URL + "#r=" + encodeURIComponent(json), index: tab.index + 1, openerTabId: tab.id });
}
chrome.action.onClicked.addListener(sendTab);
