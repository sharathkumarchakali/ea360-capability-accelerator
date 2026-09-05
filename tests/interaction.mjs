import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "https://ea360.test/",
  pretendToBeVisual: true,
});
const { document, KeyboardEvent, Event } = dom.window;

const navItems = [...document.querySelectorAll(".navitem")];
assert.equal(navItems.length, 16, "all 16 navigation items should render");
for (const item of navItems) {
  item.click();
  const id = item.dataset.target;
  const view = document.querySelector(`[data-view="${id}"]`);
  assert.ok(view.classList.contains("active"), `${id} should become active`);
  assert.ok(item.classList.contains("active"), `${id} navigation item should become active`);
  if (id !== "overview") assert.ok(view.querySelector("h1"), `${id} should render its module`);
}

document.getElementById("searchBtn").click();
assert.ok(document.getElementById("searchOverlay").classList.contains("show"), "search should open");
const searchInput = document.getElementById("searchInput");
searchInput.value = "WSO2";
searchInput.dispatchEvent(new Event("input", { bubbles: true }));
assert.match(document.getElementById("searchResults").textContent, /WSO2 API Manager/);
document.querySelector(".sres").click();
assert.ok(document.querySelector('[data-view="standards"]').classList.contains("active"), "search result should navigate");

const orgSelect = document.getElementById("orgSelect");
orgSelect.value = "Bank of Ghana — Demo";
orgSelect.dispatchEvent(new Event("change", { bubbles: true }));
assert.match(document.querySelector(".kicker").textContent, /Bank of Ghana/);

document.getElementById("notifBtn").click();
assert.ok(document.getElementById("notifPop").classList.contains("show"), "notifications should open");
document.getElementById("profileBtn").click();
assert.ok(document.getElementById("profilePop").classList.contains("show"), "profile should open");
document.querySelector("#profilePop .btn").click();
assert.ok(document.querySelector('[data-view="settings"]').classList.contains("active"), "profile settings should navigate");

document.querySelector(".toolbar .btn.primary").click();
assert.match(document.getElementById("toast").textContent, /record creation/i);
document.querySelector(".toolbar .btn:not(.primary)").click();
assert.match(document.getElementById("toast").textContent, /Export/i);

document.getElementById("mobileMenu").click();
assert.ok(document.getElementById("sidebar").classList.contains("open"), "mobile menu should open");
document.getElementById("overlay").click();
assert.ok(!document.getElementById("sidebar").classList.contains("open"), "overlay should close mobile menu");

document.getElementById("searchBtn").click();
document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
assert.ok(!document.getElementById("searchOverlay").classList.contains("show"), "Escape should close overlays");

assert.match(html, /@media\(max-width:980px\)/, "tablet layout should be present");
assert.match(html, /@media\(max-width:760px\)/, "mobile layout should be present");

console.log("EA360 interaction verification passed: 16 modules, search, organisation, popovers, actions, mobile navigation, keyboard dismissal, and responsive breakpoints.");
