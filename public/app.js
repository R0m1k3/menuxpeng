"use strict";

/* Icônes des catégories (trait 24x24) */
const ICONS = {
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  tv: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M9 2l3 4 3-4"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  radio: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="15.5" cy="14" r="2.5"/><path d="M6 12h4M6 16h4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  car: '<path d="M5 17h14M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4H3z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
  news: '<rect x="3" y="4" width="15" height="16" rx="2"/><path d="M18 8h3v10a2 2 0 0 1-4 0M7 8h7M7 12h7M7 16h4"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18z"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".8"/><circle cx="18" cy="13.5" r=".8"/>',
  kids: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><circle cx="9" cy="10" r=".8"/><circle cx="15" cy="10" r=".8"/>',
  cart: '<path d="M3 4h2l2.5 11h11L21 8H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 0-4 3-4 7h4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M19 19v2H6"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.8-4.5 4.3 1.1 6.1L12 17l-5.6 3 1.1-6.1L3 9.6l6.2-.8z"/>',
  home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  sport: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M21 10l-5 0M3 10h5M9.5 14.5L7 19M14.5 14.5L17 19"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
};
const UI = {
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M5 15l7-7 7 7"/>',
  down: '<path d="M5 9l7 7 7-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  back: '<path d="M21 6H9l-6 6 6 6h12zM17 10l-4 4M13 10l4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
};
const svg = (paths) => `<svg viewBox="0 0 24 24">${paths}</svg>`;
const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let state = null;
let current = localStorage.getItem("menu.cat") || null;
let editing = false;
let pin = localStorage.getItem("menu.pin") || "";
let editLink = null; // {catId, linkId} en cours d'édition

/* ---------- fenêtres de question (à la place de confirm / prompt) ---------- */
const dlgAsk = $("#dlg-ask");
let askDone = null;

/* ask({title, message, ok, danger, icon}) -> Promise<boolean> */
function ask({ title, message = "", ok = "OK", cancel = "Annuler", danger = false, icon }) {
  return openAsk({ title, message, ok, cancel, danger, icon: icon || (danger ? UI.trash : UI.info) });
}
/* askPin({title, message, error}) -> Promise<string|null> : clavier à chiffres tactile */
function askPin({ title = "Code de modification", message = "", error = "" } = {}) {
  return openAsk({ title, message, ok: "Valider", cancel: "Annuler", icon: UI.lock, pin: true, error });
}
function openAsk(o) {
  if (askDone) askDone(o.pin ? null : false);
  let code = "";
  dlgAsk.className = "sheet ask" + (o.danger ? " danger" : "") + (o.pin ? " pin" : "");
  $("#ask-icon").innerHTML = svg(o.icon);
  $("#ask-title").textContent = o.title;
  $("#ask-msg").textContent = o.message;
  $("#ask-err").textContent = o.error || "";
  $("#ask-ok").textContent = o.ok;
  $("#ask-cancel").textContent = o.cancel;
  const dots = () => {
    const n = Math.max(4, code.length);
    $("#ask-dots").innerHTML = Array.from({ length: n }, (_, i) => `<span class="${i < code.length ? "on" : ""}"></span>`).join("");
    $("#ask-ok").disabled = o.pin && !code.length;
  };
  if (o.pin) {
    $("#ask-keypad").innerHTML = ["1","2","3","4","5","6","7","8","9","","0","del"].map((k) =>
      k === "" ? "<span></span>" : `<button type="button" data-k="${k}">${k === "del" ? svg(UI.back) : k}</button>`).join("");
    $("#ask-keypad").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.k === "del") code = code.slice(0, -1); else if (code.length < 12) code += b.dataset.k;
      $("#ask-err").textContent = ""; dots();
    };
    if (o.error) requestAnimationFrame(() => { const d = $("#ask-dots"); d.classList.remove("shake"); void d.offsetWidth; d.classList.add("shake"); });
  }
  dots();
  // clavier physique : chiffres, effacement, Entrée
  dlgAsk.onkeydown = (e) => {
    if (!o.pin) return;
    if (/^[0-9]$/.test(e.key) && code.length < 12) { code += e.key; dots(); }
    else if (e.key === "Backspace") { code = code.slice(0, -1); dots(); }
  };
  return new Promise((resolve) => {
    askDone = (v) => { askDone = null; if (dlgAsk.open) dlgAsk.close(); resolve(v); };
    $("#form-ask").onsubmit = (e) => { e.preventDefault(); if (o.pin && !code) return; askDone(o.pin ? code : true); };
    $("#ask-cancel").onclick = () => askDone(o.pin ? null : false);
    dlgAsk.oncancel = (e) => { e.preventDefault(); askDone(o.pin ? null : false); };
    dlgAsk.onclose = () => { if (askDone) askDone(o.pin ? null : false); };
    dlgAsk.showModal();
    dlgAsk.focus(); // pas de focus visible sur une touche à l'ouverture
  });
}

/* ---------- données ---------- */
async function load() {
  try {
    const r = await fetch("/api/data", { cache: "no-store" });
    state = await r.json();
    localStorage.setItem("menu.cache", JSON.stringify(state));
  } catch {
    state = JSON.parse(localStorage.getItem("menu.cache") || "null");
    if (!state) { toast("Serveur injoignable"); return; }
  }
  state.settings ||= { tileSize: "l", newTab: false };
  if (!state.categories.find((c) => c.id === current)) current = state.categories[0]?.id;
  render();
  fillMissingIcons();
}

let saveTimer = null;
function save() {
  localStorage.setItem("menu.cache", JSON.stringify(state));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(push, 400);
}
async function push() {
  const r = await fetch("/api/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Pin": pin },
    body: JSON.stringify(state),
  }).catch(() => null);
  if (!r) return toast("Hors ligne : enregistré sur cet appareil seulement");
  if (r.status === 403) {
    const p = await askPin({
      message: "Entrez le code pour enregistrer vos changements. Il sera retenu sur cet appareil.",
      error: pin ? "Code incorrect" : "",
    });
    if (p === null) return toast("Changements non enregistrés sur le serveur");
    pin = p; pinAsked = true; localStorage.setItem("menu.pin", p); push();
  } else if (r.ok && pinAsked) { pinAsked = false; toast("Code accepté"); }
}
let pinAsked = false;

async function fetchMeta(url) {
  const r = await fetch("/api/meta?url=" + encodeURIComponent(url));
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "échec");
  return j;
}

/* Récupère en tâche de fond le logo des liens qui n'en ont pas encore */
async function fillMissingIcons(force = false) {
  const todo = state.categories.flatMap((c) => c.links).filter((l) => force || (!l.icon && !l.customIcon && !l.iconTried));
  if (!todo.length) return;
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const l = todo[i++];
      try {
        const m = await fetchMeta(l.url);
        if (m.icon) l.icon = m.icon + "?v=" + Date.now().toString(36);
      } catch {}
      l.iconTried = true;
      renderGrid(false);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  save();
  if (force) toast("Logos mis à jour");
}

/* ---------- affichage ---------- */
function cat() { return state.categories.find((c) => c.id === current); }

function render() {
  document.body.dataset.size = state.settings.tileSize || "l";
  document.body.classList.toggle("editing", editing);
  renderRail();
  renderGrid(false);
}

function renderRail() {
  $("#cats").innerHTML = state.categories.map((c) => `
    <button class="cat ${c.id === current ? "on" : ""}" data-id="${c.id}">
      ${svg(ICONS[c.icon] || ICONS.folder)}<span class="name">${esc(c.name)}</span><span class="count">${c.links.length}</span>
    </button>`).join("");
}

function renderGrid(animate, dir = "l") {
  const c = cat();
  const grid = $("#grid");
  $("#cat-title").textContent = c ? c.name : "Aucune catégorie";
  if (!c) { grid.innerHTML = `<p class="empty">Passez en mode Modifier pour créer une catégorie.</p>`; return; }
  const n = c.links.length;
  grid.innerHTML = c.links.map((l, i) => `
    <a class="tile" href="${esc(l.url)}" data-id="${l.id}" ${state.settings.newTab ? 'target="_blank" rel="noopener"' : ""}>
      <div class="tools">
        <button class="t-del" data-act="del" title="Supprimer">${svg(UI.x)}</button>
        <button data-act="edit" title="Modifier">${svg(UI.edit)}</button>
      </div>
      ${plate(l)}
      <span class="label">${esc(l.title)}</span>
      <div class="move">
        <button data-act="left" ${i === 0 ? "disabled" : ""}>${svg(UI.left)}</button>
        <button data-act="right" ${i === n - 1 ? "disabled" : ""}>${svg(UI.right)}</button>
      </div>
    </a>`).join("") + `
    <button class="tile add edit-only" id="tile-add">
      <div class="plate">${svg(UI.plus)}</div><span class="label">Ajouter</span>
    </button>`;
  if (!editing && !n) grid.insertAdjacentHTML("afterbegin", `<p class="empty">Catégorie vide.</p>`);
  grid.querySelectorAll(".plate img").forEach(tint);
  if (animate) { grid.classList.remove("slide-l", "slide-r"); void grid.offsetWidth; grid.classList.add("slide-" + dir); }
}

function plate(l) {
  const src = l.customIcon || l.icon;
  if (src) return `<div class="plate"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></div>`;
  return `<div class="plate"><span class="letter">${esc((l.title || "?").trim()[0]?.toUpperCase() || "?")}</span></div>`;
}

/* Fond du logo = couleur de son bord : le logo devient une vraie icône d'appli.
   Si l'icône est déjà pleine (carrée, opaque), elle occupe toute la tuile. */
const tintCache = new Map();
function tint(img) {
  const apply = (t) => {
    const p = img.parentElement;
    if (!t) return;
    if (t.bg) p.style.background = t.bg;
    p.classList.toggle("full", t.full);
  };
  const key = img.getAttribute("src");
  if (tintCache.has(key)) return apply(tintCache.get(key));
  img.addEventListener("error", () => {
    const p = img.parentElement;
    const label = p.parentElement.querySelector(".label")?.textContent || "?";
    p.innerHTML = `<span class="letter">${esc(label[0].toUpperCase())}</span>`;
  }, { once: true });
  const run = () => {
    try {
      const s = 48, cv = document.createElement("canvas");
      cv.width = cv.height = s;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, s, s);
      const d = g.getImageData(0, 0, s, s).data;
      let r = 0, gg = 0, b = 0, k = 0, opaque = 0, edge = 0;
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        if (x > 1 && y > 1 && x < s - 2 && y < s - 2) continue;
        const o = (y * s + x) * 4; edge++;
        if (d[o + 3] > 200) { opaque++; r += d[o]; gg += d[o + 1]; b += d[o + 2]; k++; }
      }
      let t = { bg: null, full: false };
      if (k / edge > 0.6) {
        r = r / k | 0; gg = gg / k | 0; b = b / k | 0;
        t.bg = `rgb(${r},${gg},${b})`;
        // bord uni et opaque : icône déjà "carrée", on la laisse remplir la tuile
        let varc = 0;
        for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
          if (x > 1 && y > 1 && x < s - 2 && y < s - 2) continue;
          const o = (y * s + x) * 4;
          varc += Math.abs(d[o] - r) + Math.abs(d[o + 1] - gg) + Math.abs(d[o + 2] - b);
        }
        t.full = opaque / edge > 0.97 && img.naturalWidth >= 96;
      }
      tintCache.set(key, t);
      apply(t);
    } catch { /* image d'un autre domaine : pas de teinte */ }
  };
  if (img.complete && img.naturalWidth) run(); else img.addEventListener("load", run, { once: true });
}

function selectCat(id, dir) {
  if (id === current) return;
  current = id;
  localStorage.setItem("menu.cat", id);
  renderRail();
  renderGrid(true, dir);
  $("#grid").scrollTop = 0;
}

/* ---------- interactions ---------- */
$("#cats").addEventListener("click", (e) => {
  const b = e.target.closest(".cat");
  if (!b) return;
  const ids = state.categories.map((c) => c.id);
  selectCat(b.dataset.id, ids.indexOf(b.dataset.id) > ids.indexOf(current) ? "l" : "r");
});

function setEditing(on) { editing = on; render(); }
$("#btn-edit").onclick = () => setEditing(!editing);
$("#btn-done").onclick = () => setEditing(false);

$("#grid").addEventListener("click", async (e) => {
  if (e.target.closest("#tile-add")) { e.preventDefault(); return openLink(null); }
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!editing && !act) return; // ouverture normale du lien
  e.preventDefault();
  const c = cat();
  const i = c.links.findIndex((l) => l.id === tile.dataset.id);
  if (act === "del") {
    const l = c.links[i];
    if (!await ask({ title: `Supprimer « ${l.title} » ?`, message: "Le lien sera retiré de la catégorie.", ok: "Supprimer", danger: true })) return;
    c.links.splice(c.links.indexOf(l), 1);
  } else if (act === "left" || act === "right") {
    const j = act === "left" ? i - 1 : i + 1;
    [c.links[i], c.links[j]] = [c.links[j], c.links[i]];
  } else {
    return openLink(c.links[i]);
  }
  save(); renderRail(); renderGrid(false);
});

/* Balayage gauche / droite sur la grille pour changer de catégorie */
(() => {
  let x0 = null, y0 = 0, t0 = 0;
  const g = $("#grid");
  g.addEventListener("touchstart", (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
  g.addEventListener("touchend", (e) => {
    if (x0 === null || editing) return;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 90 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - t0 > 600) return;
    const ids = state.categories.map((c) => c.id), i = ids.indexOf(current);
    const j = dx < 0 ? Math.min(i + 1, ids.length - 1) : Math.max(i - 1, 0);
    selectCat(ids[j], dx < 0 ? "l" : "r");
  }, { passive: true });
})();

/* ---------- fenêtre lien ---------- */
const dlgLink = $("#dlg-link");
let pendingIcon = null;

function openLink(link) {
  editLink = link ? { linkId: link.id, fromCat: current } : null;
  pendingIcon = link?.icon || null;
  $("#link-dlg-title").textContent = link ? "Modifier le lien" : "Ajouter un lien";
  $("#f-url").value = link?.url || "";
  $("#f-title").value = link?.title || "";
  $("#f-icon").value = link?.customIcon || "";
  $("#f-cat").innerHTML = state.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  $("#f-cat").value = current;
  $("#btn-del-link").style.display = link ? "" : "none";
  $("#fetch-state").textContent = "";
  $("#f-alt-q").value = "";
  showAlts([]);
  preview();
  dlgLink.showModal();
  if (!link) setTimeout(() => $("#f-url").focus(), 50);
}

function preview() {
  const src = $("#f-icon").value.trim() || pendingIcon;
  const p = $("#lp-plate");
  p.style.background = ""; p.classList.remove("full");
  p.innerHTML = src ? `<img src="${esc(src)}" alt="">` : `<span class="letter">${esc(($("#f-title").value || "?")[0].toUpperCase())}</span>`;
  const img = p.querySelector("img");
  if (img) tint(img);
}

async function doFetch() {
  const url = $("#f-url").value.trim();
  if (!url) return;
  const st = $("#fetch-state"), btn = $("#btn-fetch");
  st.textContent = "Recherche du logo…"; btn.disabled = true;
  try {
    const m = await fetchMeta(url);
    $("#f-url").value = m.url;
    if (!$("#f-title").value.trim() || !editLink) $("#f-title").value = m.title;
    pendingIcon = m.icon ? m.icon + "?v=" + Date.now().toString(36) : null;
    showAlts(m.alternatives || []);
    st.textContent = m.icon ? `Logo trouvé (${m.iconSize || "?"} px)` : "Pas de logo trouvé : la première lettre sera affichée";
  } catch (e) {
    st.textContent = "Site injoignable : " + e.message;
  }
  btn.disabled = false;
  preview();
}
$("#btn-fetch").onclick = doFetch;

/* Logos de remplacement (applis App Store, 512 px) */
function showAlts(list) {
  $("#alts").innerHTML = list.map((a) =>
    `<button type="button" data-src="${esc(a.src)}" title="${esc(a.name)}"><img src="${esc(a.src)}" alt="" loading="lazy"></button>`).join("");
}
$("#alts").addEventListener("click", async (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $("#fetch-state").textContent = "Enregistrement du logo…";
  try {
    const r = await fetch(`/api/icon-from?src=${encodeURIComponent(b.dataset.src)}&url=${encodeURIComponent($("#f-url").value)}`);
    const j = await r.json(); if (!r.ok) throw new Error(j.error);
    pendingIcon = j.icon + "?v=" + Date.now().toString(36);
    $("#f-icon").value = "";
    document.querySelectorAll("#alts button").forEach((x) => x.classList.toggle("on", x === b));
    $("#fetch-state").textContent = "Logo choisi";
    preview();
  } catch (err) { $("#fetch-state").textContent = "Échec : " + err.message; }
});
async function searchAlts() {
  const q = $("#f-alt-q").value.trim() || $("#f-title").value.trim(); if (!q) return;
  const r = await fetch("/api/search-icons?q=" + encodeURIComponent(q)).then((r) => r.json()).catch(() => ({}));
  showAlts(r.alternatives || []);
  if (!(r.alternatives || []).length) $("#fetch-state").textContent = "Aucun logo trouvé";
}
$("#btn-alt-q").onclick = searchAlts;
$("#f-alt-q").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); searchAlts(); } });
$("#f-url").addEventListener("change", () => { if (!editLink || !pendingIcon) doFetch(); });
$("#f-icon").addEventListener("change", preview);
$("#f-title").addEventListener("input", () => { if (!pendingIcon && !$("#f-icon").value) preview(); });

$("#form-link").addEventListener("submit", (e) => {
  let url = $("#f-url").value.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const data = {
    url, title: $("#f-title").value.trim() || url,
    icon: pendingIcon, customIcon: $("#f-icon").value.trim() || undefined, iconTried: true,
  };
  const target = state.categories.find((c) => c.id === $("#f-cat").value);
  if (editLink) {
    const from = state.categories.find((c) => c.id === editLink.fromCat);
    const i = from.links.findIndex((l) => l.id === editLink.linkId);
    const l = Object.assign(from.links[i], data);
    if (from !== target) { from.links.splice(i, 1); target.links.push(l); }
  } else {
    target.links.push({ id: uid(), ...data });
  }
  save(); renderRail(); renderGrid(false);
});
$("#btn-del-link").onclick = async () => {
  if (!await ask({ title: `Supprimer « ${$("#f-title").value} » ?`, message: "Le lien sera retiré de la catégorie.", ok: "Supprimer", danger: true })) return;
  const from = state.categories.find((c) => c.id === editLink.fromCat);
  from.links = from.links.filter((l) => l.id !== editLink.linkId);
  dlgLink.close(); save(); renderRail(); renderGrid(false);
};

/* ---------- fenêtre catégories ---------- */
const dlgCats = $("#dlg-cats");
$("#btn-cats").onclick = () => { renderCatList(); dlgCats.showModal(); };

function renderCatList() {
  const n = state.categories.length;
  $("#cat-list").innerHTML = state.categories.map((c, i) => `
    <li data-id="${c.id}">
      <button class="icon-btn" data-act="icon" title="Icône">${svg(ICONS[c.icon] || ICONS.folder)}</button>
      <input value="${esc(c.name)}" data-act="name" maxlength="40">
      <button class="icon-btn" data-act="up" ${i === 0 ? "disabled" : ""}>${svg(UI.up)}</button>
      <button class="icon-btn" data-act="down" ${i === n - 1 ? "disabled" : ""}>${svg(UI.down)}</button>
      <button class="icon-btn danger" data-act="del" title="Supprimer">${svg(UI.trash)}</button>
    </li>`).join("");
}
$("#cat-list").addEventListener("input", (e) => {
  if (e.target.dataset.act !== "name") return;
  const c = state.categories.find((c) => c.id === e.target.closest("li").dataset.id);
  c.name = e.target.value; save(); renderRail(); renderGrid(false);
});
$("#cat-list").addEventListener("click", async (e) => {
  const act = e.target.closest("button")?.dataset.act;
  if (!act) return;
  const id = e.target.closest("li").dataset.id;
  const i = state.categories.findIndex((c) => c.id === id);
  const c = state.categories[i];
  if (act === "icon") return pickIcon(c);
  if (act === "up" || act === "down") {
    const j = act === "up" ? i - 1 : i + 1;
    [state.categories[i], state.categories[j]] = [state.categories[j], state.categories[i]];
  }
  if (act === "del") {
    const n = c.links.length;
    if (!await ask({
      title: `Supprimer « ${c.name} » ?`,
      message: n ? `La catégorie et ${n === 1 ? "son lien seront supprimés" : `ses ${n} liens seront supprimés`}.` : "La catégorie est vide.",
      ok: "Supprimer", danger: true,
    })) return;
    state.categories.splice(state.categories.indexOf(c), 1);
    if (current === id) current = state.categories[0]?.id;
  }
  save(); renderCatList(); render();
});
$("#btn-add-cat").onclick = () => {
  const c = { id: uid(), name: "Nouvelle catégorie", icon: "folder", links: [] };
  state.categories.push(c);
  current = c.id;
  save(); renderCatList(); render();
  const inp = $(`#cat-list li[data-id="${c.id}"] input`);
  inp.focus(); inp.select();
};

const dlgIcon = $("#dlg-icon");
function pickIcon(c) {
  $("#icon-pick").innerHTML = Object.keys(ICONS).map((k) =>
    `<button data-k="${k}" class="${c.icon === k ? "on" : ""}" title="${k}">${svg(ICONS[k])}</button>`).join("");
  $("#icon-pick").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    c.icon = b.dataset.k; dlgIcon.close(); save(); renderCatList(); renderRail();
  };
  dlgIcon.showModal();
}

/* ---------- réglages ---------- */
const dlgSet = $("#dlg-settings");
$("#btn-settings").onclick = () => {
  document.querySelectorAll("#seg-size button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.settings.tileSize));
  $("#f-newtab").checked = !!state.settings.newTab;
  dlgSet.showModal();
};
$("#seg-size").onclick = (e) => {
  const b = e.target.closest("button"); if (!b) return;
  state.settings.tileSize = b.dataset.v;
  document.querySelectorAll("#seg-size button").forEach((x) => x.classList.toggle("on", x === b));
  save(); render();
};
$("#f-newtab").onchange = (e) => { state.settings.newTab = e.target.checked; save(); renderGrid(false); };
$("#btn-export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: "application/json" }));
  a.download = "menu-g6.json"; a.click();
};
$("#f-import").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.categories)) throw 0;
    state = d; current = d.categories[0]?.id; save(); render(); toast("Menu importé");
  } catch { toast("Fichier invalide"); }
};
$("#btn-refresh-icons").onclick = () => { toast("Recherche des logos…"); fillMissingIcons(true); };

document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

/* ---------- horloge, toast ---------- */
function tick() {
  const n = new Date();
  $("#time").textContent = n.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  $("#date").textContent = n.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
tick(); setInterval(tick, 10000);

let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

load();
