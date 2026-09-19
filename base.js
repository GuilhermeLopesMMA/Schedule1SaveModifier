"use strict";
// ================= constantes =================
const RANKS = ["Street Rat", "Hoodlum", "Peddler", "Hustler", "Bagman", "Enforcer", "Shot Caller", "Block Boss", "Underlord", "Baron", "Kingpin"];
const ROMAN = ["0", "I", "II", "III", "IV", "V"];
const REGIONS = ["Northtown", "Westville", "Downtown", "Docks", "Suburbia", "Uptown"];
const QUALITIES = ["Trash", "Poor", "Standard", "Premium", "Heavenly"];
const PACKAGING = [["", "Solto"], ["baggie", "Saqueta"], ["jar", "Frasco"], ["brick", "Tijolo"]];
const DRUG = { 0: ["Erva", "WeedData"], 1: ["Meth", "MethData"], 2: ["Cocaína", "CocaineData"], 4: ["Cogumelos", "ShroomData"] };
const BASE_PRODUCTS = {
  ogkush: ["OG Kush", 0], sourdiesel: ["Sour Diesel", 0], greencrack: ["Green Crack", 0],
  granddaddypurple: ["Granddaddy Purple", 0], meth: ["Meth", 1], cocaine: ["Cocaine", 2], shroom: ["Shroom", 4],
};
const QUEST_STATES = ["Inativa", "Ativa", "Concluída", "Falhada", "Expirada", "Cancelada"];
const ICONS = {
  resumo: "M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z",
  jogadores: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  contactos: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM10 18h4",
  produtos: "M12 21V11M12 11c0-4 3-7 7-8-1 4-3 7-7 8zM12 11C12 7 9 4 5 3c1 4 3 7 7 8zM12 14c-2-1-5-1-7 1 2 2 5 2 7 1M12 14c2-1 5-1 7 1-2 2-5 2-7 1",
  imoveis: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
  veiculos: "M5 16h14M3 16v-3l2-5h14l2 5v3M7 19a1.5 1.5 0 1 0 0-3M17 19a1.5 1.5 0 1 0 0-3",
  missoes: "M9 4h6v3H9zM7 5H5v16h14V5h-2M9 13l2 2 4-4",
  ferramentas: "M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z",
  variaveis: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  ficheiros: "M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14",
  producao: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9",
  dealers: "M4 8h16v12H4zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16",
  procurar: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-4.6-4.6",
  alteracoes: "M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 6-12 3-12 6",
};
const NAV = [
  ["Save", [["resumo", "Resumo"], ["jogadores", "Jogadores"], ["contactos", "Contactos"], ["dealers", "Dealers"], ["produtos", "Produtos"]]],
  ["Mundo", [["imoveis", "Imóveis"], ["producao", "Produção"], ["veiculos", "Veículos"], ["missoes", "Missões"]]],
  ["Avançado", [["ferramentas", "Ferramentas"], ["procurar", "Procurar"], ["variaveis", "Variáveis"], ["ficheiros", "Ficheiros"], ["alteracoes", "Alterações"]]],
];

// ================= estado =================
const S = {
  name: "", zipBase: "", prefix: "", order: [], entries: new Map(), origFile: null, gv: "",
  tab: "resumo", player: null, itemTpl: new Map(), products: new Map(), rawPath: null,
  npcFilter: { q: "", type: "all" },
};

// ================= DOM =================
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el[k.toLowerCase()] = v;
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
const SVGNS = "http://www.w3.org/2000/svg";
function icon(name) {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "ico");
  s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(SVGNS, "path");
  p.setAttribute("d", ICONS[name] || "");
  s.append(p);
  return s;
}
const $ = (id) => document.getElementById(id);
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
const fmtMoney = (v) => { const n = Number(v) || 0; const d = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2; return "$" + n.toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }); };
const titleCase = (id) => String(id).split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : n > 1024 ? Math.round(n / 1024) + " KB" : n + " B");

function panel(title, body, opts = {}) {
  return h("section", { class: "panel" + (opts.flat ? " flat" : "") },
    title != null ? h("header", null, h("h3", null, title), opts.extra ? [h("span", { class: "sp" }), opts.extra] : null) : null,
    h("div", { class: "body" }, body));
}
function viewHead(title, sub, extra) {
  return h("div", { class: "vh" }, h("div", null, h("h2", null, title), sub ? h("p", null, sub) : null), extra || null);
}
function fld(label, control, hint) {
  return h(control && control.tagName === "LABEL" ? "div" : "label", { class: "fld" }, h("span", null, label), control, hint ? h("small", null, hint) : null);
}
function num(obj, key, o = {}) {
  const inp = h("input", { type: "number", value: obj[key] ?? 0, min: o.min, max: o.max, step: o.step ?? (o.float ? "any" : "1") });
  inp.onchange = () => {
    let v = Number(inp.value);
    if (inp.value === "" || !isFinite(v)) { inp.value = obj[key]; return; }
    if (!o.float) v = Math.round(v);
    if (o.min != null) v = Math.max(o.min, v);
    if (o.max != null) v = Math.min(o.max, v);
    inp.value = v;
    if (o.float) setFloat(obj, key, v); else obj[key] = v;
    commit(o);
  };
  return inp;
}
function text(obj, key, o = {}) {
  const inp = h("input", { type: "text", value: obj[key] ?? "", class: o.mono ? "mono" : null, list: o.list, placeholder: o.placeholder });
  inp.onchange = () => { obj[key] = inp.value; commit(o); };
  return inp;
}
function check(obj, key, label, o = {}) {
  const inp = h("input", { type: "checkbox", checked: !!obj[key] });
  inp.onchange = () => { obj[key] = inp.checked; commit(o); };
  return label == null ? inp : h("label", { class: "check" }, inp, label);
}
function commit(o) {
  if (o.after) o.after();
  if (o.path) touch(o.path);
}
function slider(obj, key, min, max, step, digits, o = {}) {
  const out = h("output", null, Number(obj[key]).toFixed(digits));
  const r = h("input", { type: "range", min, max, step, value: obj[key], "aria-label": o.label });
  r.oninput = () => { out.textContent = Number(r.value).toFixed(digits); };
  r.onchange = () => { setFloat(obj, key, Number(r.value)); commit(o); };
  return h("div", { class: "rel" }, r, out);
}

// ================= ficheiros =================
const E = (path) => S.entries.get(path);
function J(path) {
  const e = E(path);
  if (!e || e.bytes) return null;
  if (!e.data) e.data = parseJSON(e.text);
  return e.data;
}
function safeJ(p) { try { return J(p); } catch (e) { return null; } }
function mark(path) { const e = E(path); if (e) e.dirty = true; }
function touch(path) { mark(path); refreshChrome(); }
function outText(e) {
  if (!e.dirty || !e.data) return e.text;
  return stringify(e.data, e.pretty) + (e.trailingNL ? "\n" : "");
}
const jsonPaths = () => [...S.entries.keys()].filter((p) => p.toLowerCase().endsWith(".json")).sort();
const propertyPaths = () => [...S.entries.keys()].filter((p) => /^(Properties|Businesses)\/.+\.json$/.test(p)).sort();
function playerDirs() {
  const set = new Set();
  for (const p of S.entries.keys()) { const m = p.match(/^Players\/([^/]+)\//); if (m) set.add(m[1]); }
  return [...set].sort((a, b) => (a === "Player_0" ? -1 : b === "Player_0" ? 1 : a.localeCompare(b)));
}
function steamIdOf(dir) {
  const p = safeJ("Players/" + dir + "/Player.json");
  if (p && /^\d{17}$/.test(String(p.PlayerCode))) return String(p.PlayerCode);
  const m = dir.match(/^Player_(\d{17})$/);
  return m ? m[1] : null;
}

// ================= carregar =================
function readText(x) { return x.zipEntry ? x.zipEntry.async("string") : x.file.text(); }
async function readBytes(x) { return x.zipEntry ? x.zipEntry.async("uint8array") : new Uint8Array(await x.file.arrayBuffer()); }

async function openFromList(list, base, origFile) {
  const norm = list.map((x) => ({ ...x, path: x.path.replace(/\\/g, "/").replace(/^\/+/, "") }));
  const roots = norm.filter((x) => /(^|\/)Game\.json$/.test(x.path)).map((x) => x.path.slice(0, -"Game.json".length));
  if (!roots.length) throw new Error("Não há nenhum Game.json aqui. Usa o .zip criado pelo Exportar do jogo, ou a pasta SaveGame_N.");
  let root = roots[0];
  if (roots.length > 1) root = await chooseRoot(roots, norm);
  if (root == null) return;
  const entries = new Map();
  const order = [];
  for (const x of norm) {
    if (!x.path.startsWith(root) || x.path.endsWith("/")) continue;
    const rel = x.path.slice(root.length);
    if (!rel) continue;
    order.push(rel);
    const date = x.zipEntry ? x.zipEntry.date : (x.file && x.file.lastModified ? new Date(x.file.lastModified) : new Date());
    if (rel.toLowerCase().endsWith(".json")) {
      let t = await readText(x);
      if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
      entries.set(rel, { text: t, orig: t, data: null, dirty: false, pretty: t.slice(0, 400).includes("\n"), trailingNL: t.endsWith("\n"), date });
    } else {
      entries.set(rel, { bytes: await readBytes(x), dirty: false, date });
    }
  }
  const folderName = root.replace(/\/$/, "").split("/").pop();
  S.prefix = origFile ? root : (folderName ? folderName + "/" : "");
  S.name = folderName || base || "SaveGame";
  S.zipBase = base || S.name;
  S.origFile = origFile && roots.length === 1 ? origFile : null;
  S.order = order;
  S.entries = entries;
  S.tab = "resumo";
  S.rawPath = null;
  S.gv = safeJ("Game.json")?.GameVersion || "0.4.6f13";
  S.player = playerDirs()[0] || null;
  buildCatalog();
  $("empty").hidden = true;
  $("editor").hidden = false;
  renderRail();
  render();
  refreshChrome();
  window.scrollTo(0, 0);
}
async function openZip(file) {
  const zip = await JSZip.loadAsync(file);
  const list = [];
  zip.forEach((path, entry) => { if (!entry.dir) list.push({ path, zipEntry: entry }); });
  await openFromList(list, file.name.replace(/\.zip$/i, ""), file);
}
function chooseRoot(roots, norm) {
  return new Promise(async (resolve) => {
    const items = [];
    for (const r of roots) {
      let label = r.replace(/\/$/, "") || "(raiz)";
      try {
        const g = parseJSON(await readText(norm.find((x) => x.path === r + "Game.json")));
        if (g.OrganisationName) label = g.OrganisationName + " (" + label + ")";
      } catch (e) { /* ignora */ }
      items.push([r, label]);
    }
    const close = (v) => { m.remove(); resolve(v); };
    const m = modal("Escolhe o save", h("div", { class: "row" }, items.map(([r, l]) => h("button", { class: "btn", onClick: () => close(r) }, l))),
      [h("button", { class: "btn", onClick: () => close(null) }, "Cancelar")]);
  });
}
function modal(title, body, footer) {
  const m = h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
    h("div", { class: "box" }, h("header", null, h("h3", null, title)), h("div", { class: "body" }, body), footer ? h("footer", null, footer) : null));
  document.body.append(m);
  const first = m.querySelector("input, button");
  if (first) first.focus();
  return m;
}
function showLoadError(err) {
  console.error(err);
  const el = $("loadErr");
  el.textContent = err.message || String(err);
  el.hidden = false;
}

// ================= catálogo =================
function buildCatalog() {
  const tpl = new Map();
  const visit = (v, depth) => {
    if (depth > 10) return;
    if (typeof v === "string") {
      if (v.length > 20 && v[0] === "{" && v.includes("DataType")) {
        let o;
        try { o = parseJSON(v); } catch (e) { return; }
        visit(o, depth + 1);
      }
      return;
    }
    if (Array.isArray(v)) { for (const x of v) visit(x, depth); return; }
    if (v && typeof v === "object") {
      if (typeof v.ID === "string" && v.ID && "Quantity" in v && typeof v.DataType === "string" && !tpl.has(v.ID)) tpl.set(v.ID, stringify(v, false));
      for (const k in v) if (k !== "MessageHistory") visit(v[k], depth);
    }
  };
  for (const p of S.entries.keys()) {
    if (/^(Players|Properties|Businesses)\//.test(p) || ["OwnedVehicles.json", "WorldStorageEntities.json", "NPCs.json"].includes(p)) {
      try { visit(J(p), 0); } catch (e) { /* ignora */ }
    }
  }
  S.itemTpl = tpl;
  const prods = new Map();
  for (const [id, [name, type]] of Object.entries(BASE_PRODUCTS)) prods.set(id, { id, name, type, base: true, fx: [] });
  const P = safeJ("Products.json");
  if (P) for (const key of Object.keys(P)) {
    if (!/^Created/.test(key) || !Array.isArray(P[key])) continue;
    for (const c of P[key]) prods.set(c.ID, { id: c.ID, name: c.Name, type: c.DrugType, base: false, fx: c.Properties || [], ref: c });
  }
  S.products = prods;
  const ids = new Set([...tpl.keys(), ...prods.keys()]);
  ids.delete("cash");
  $("dl-items").replaceChildren(...[...ids].sort().map((id) => h("option", { value: id }, prods.get(id)?.name)));
  const colors = new Set(["White", "Black", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Grey", "DarkGrey"]);
  safeJ("OwnedVehicles.json")?.Vehicles?.forEach((v) => v.Color && colors.add(v.Color));
  $("dl-colors").replaceChildren(...[...colors].map((c) => h("option", { value: c })));
}
const emptySlot = () => ({ DataType: "ItemData", DataVersion: 0, GameVersion: S.gv, ID: "", Quantity: 0 });
function makeItem(id, qty) {
  if (!id) return emptySlot();
  let o;
  if (S.itemTpl.has(id)) o = parseJSON(S.itemTpl.get(id));
  else {
    const p = S.products.get(id);
    if (p && DRUG[p.type]) o = { DataType: DRUG[p.type][1], DataVersion: 0, GameVersion: S.gv, ID: id, Quantity: 1, Quality: "Standard", PackagingID: "" };
    else o = { DataType: "ItemData", DataVersion: 0, GameVersion: S.gv, ID: id, Quantity: 1 };
  }
  o.ID = id;
  o.Quantity = qty;
  if ("PackagingID" in o) o.PackagingID = "";
  if ("Quality" in o) o.Quality = "Standard";
  return o;
}

// ================= slots =================
function slotsEditor(items, onCommit, opts = {}) {
  const wrap = h("div", { class: "slots" });
  const draw = () => {
    const rows = [h("div", { class: "slot slot-head" }, h("span"), h("span", null, "Item"), h("span", null, "Quantidade"), h("span", null, "Qualidade"), h("span", null, "Embalagem"), h("span"))];
    items.forEach((s, idx) => {
      let o;
      try { o = parseJSON(s); } catch (e) { rows.push(h("div", { class: "slot" }, h("span", { class: "n" }, idx + 1), h("span", { class: "err" }, "Slot ilegível"))); return; }
      const save = () => { items[idx] = stringify(o, false); onCommit(); };
      if (o.DataType === "CashData") {
        if (opts.hideCash) return;
        rows.push(h("div", { class: "slot" }, h("span", { class: "n" }, idx + 1), h("b", null, "Dinheiro"),
          num(o, "CashBalance", { float: true, min: 0, after: save }), h("span"), h("span"), h("span")));
        return;
      }
      const idIn = h("input", { type: "text", class: "mono", list: "dl-items", value: o.ID, placeholder: "vazio", "aria-label": "Item do slot " + (idx + 1) });
      idIn.onchange = () => {
        const id = idIn.value.trim();
        if (id === o.ID) return;
        o = makeItem(id, id ? Math.max(1, o.Quantity || 1) : 0);
        save();
        draw();
      };
      const p = o.ID && S.products.get(o.ID);
      if (p) idIn.title = p.name;
      const qty = o.ID ? num(o, "Quantity", { min: 1, after: save }) : h("span");
      let qual = h("span"), pack = h("span");
      if (o.ID && "Quality" in o) {
        qual = h("select", { "aria-label": "Qualidade" }, QUALITIES.map((q) => h("option", { value: q }, q)));
        if (!QUALITIES.includes(o.Quality)) qual.append(h("option", { value: o.Quality }, o.Quality));
        qual.value = o.Quality;
        qual.onchange = () => { o.Quality = qual.value; save(); };
      } else if (o.ID && "Color" in o) {
        qual = num(o, "Color", { min: 0, after: save });
        qual.title = "Índice de cor da peça";
      } else if (o.ID && "Value" in o) {
        qual = num(o, "Value", { min: 0, after: save });
        qual.title = "Valor interno (ex.: balas no carregador)";
      }
      if (o.ID && "PackagingID" in o) {
        pack = h("select", { "aria-label": "Embalagem" }, PACKAGING.map(([v, l]) => h("option", { value: v }, l)));
        if (!PACKAGING.some(([v]) => v === o.PackagingID)) pack.append(h("option", { value: o.PackagingID }, o.PackagingID));
        pack.value = o.PackagingID;
        pack.onchange = () => { o.PackagingID = pack.value; save(); };
      }
      const clear = o.ID ? h("button", { class: "icon-btn", title: "Esvaziar slot", "aria-label": "Esvaziar slot " + (idx + 1), onClick: () => { o = emptySlot(); save(); draw(); } }, "×") : h("span");
      rows.push(h("div", { class: "slot" + (o.ID ? "" : " empty") }, h("span", { class: "n" }, idx + 1), idIn, qty, qual, pack, clear));
    });
    wrap.replaceChildren(...rows);
  };
  draw();
  return wrap;
}
function slotSummary(items) {
  let used = 0;
  for (const s of items) { try { const o = parseJSON(s); if (o.ID && o.DataType !== "CashData") used++; } catch (e) {} }
  return used + "/" + items.length;
}

// ================= perfis Steam (guardados neste browser) =================
const PROFILE_KEY = "s1-editor:perfil:";
function getProfile(sid) {
  if (!sid) return {};
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY + sid)) || {}; } catch (e) { return {}; }
}
function setProfile(sid, p) {
  try { localStorage.setItem(PROFILE_KEY + sid, JSON.stringify(p)); return true; } catch (e) { return false; }
}
function hashStr(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
function identicon(seed) {
  const hs = hashStr(String(seed || "?"));
  const hue = 95 + (hs % 70);
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", "0 0 50 50");
  const bg = document.createElementNS(SVGNS, "rect");
  bg.setAttribute("width", "50"); bg.setAttribute("height", "50");
  bg.setAttribute("fill", "hsl(" + hue + " 22% 20%)");
  s.append(bg);
  let bits = hashStr(String(seed) + "#");
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
    const on = bits & 1; bits = (bits >>> 1) | ((bits & 1) << 31);
    if (!on) continue;
    for (const xx of x === 2 ? [2] : [x, 4 - x]) {
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("x", 5 + xx * 8); r.setAttribute("y", 5 + y * 8);
      r.setAttribute("width", "8"); r.setAttribute("height", "8");
      r.setAttribute("fill", "hsl(" + hue + " 60% 58%)");
      s.append(r);
    }
  }
  return s;
}
function avatarEl(sid, big) {
  const p = getProfile(sid);
  const box = h("span", { class: "avatar" + (big ? " big" : "") });
  const src = (p.avatar && /^data:image\//.test(p.avatar) && p.avatar) || (p.avatarUrl && /^https?:\/\//.test(p.avatarUrl) && p.avatarUrl);
  if (src) {
    const img = h("img", { src, alt: "" });
    img.onerror = () => { img.replaceWith(identicon(sid)); };
    box.append(img);
  } else box.append(identicon(sid));
  return box;
}

// ---- ligação a um proxy da Steam Web API ----
const ENDPOINT_KEY = "s1-editor:steam-endpoint";
const getEndpoint = () => { try { return localStorage.getItem(ENDPOINT_KEY) || ""; } catch (e) { return ""; } };
const setEndpoint = (v) => { try { localStorage.setItem(ENDPOINT_KEY, v); } catch (e) {} };
async function urlToDataURL(url) {
  const r = await fetch(url, { mode: "cors" });
  if (!r.ok) throw new Error("A imagem respondeu " + r.status + ".");
  return imageToDataURL(await r.blob());
}
function netHint(err) {
  const m = err && err.message ? err.message : String(err);
  if (err instanceof TypeError) return "O pedido nem chegou a sair: CSP, CORS ou proxy em baixo. A versão publicada aqui bloqueia pedidos externos; usa o editor alojado por ti.";
  return m;
}
async function fetchSteamProfiles(ids) {
  const ep = getEndpoint().trim();
  if (!ep) throw new Error("Falta o endereço do proxy.");
  const list = ids.join(",");
  const url = ep + (ep.includes("?") ? "&" : "?") + "ids=" + encodeURIComponent(list) + "&steamids=" + encodeURIComponent(list);
  const r = await fetch(url);
  if (!r.ok) throw new Error("O proxy respondeu " + r.status + ".");
  const data = await r.json();
  const out = {};
  const players = data?.response?.players || data?.players;
  if (Array.isArray(players)) {
    for (const p of players) out[p.steamid] = { name: p.personaname, avatar: p.avatarfull || p.avatarmedium || p.avatar };
  } else if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data)) if (v && typeof v === "object") out[k] = { name: v.name || v.personaname, avatar: v.avatar || v.avatarfull || v.avatarUrl };
  }
  return out;
}
async function syncSteam(report) {
  const ids = playerDirs().map(steamIdOf).filter(Boolean);
  if (!ids.length) { report("Não há SteamIDs neste save."); return; }
  report("A pedir ao proxy…");
  let got;
  try { got = await fetchSteamProfiles(ids); }
  catch (err) { report("Falhou: " + netHint(err)); return; }
  let n = 0, imgs = 0;
  for (const sid of ids) {
    const info = got[sid];
    if (!info) continue;
    const p = { ...getProfile(sid) };
    if (info.name) p.name = info.name;
    if (info.avatar) {
      p.avatarUrl = info.avatar;
      try { p.avatar = await urlToDataURL(info.avatar); imgs++; } catch (e) { p.avatar = null; }
    }
    if (setProfile(sid, p)) n++;
  }
  if (!n) { report("O proxy respondeu, mas sem dados para estes SteamIDs. Perfis privados devolvem menos informação."); return; }
  report(n + " perfis atualizados" + (imgs ? ", " + imgs + " fotos guardadas." : ". As fotos ficam ligadas ao endereço da Steam."));
  render();
}
async function imageToDataURL(blob) {
  const bmp = await createImageBitmap(blob);
  const size = 184;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  const side = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.88);
}
function profileDialog(sid, label, onDone) {
  const p = { ...getProfile(sid) };
  const preview = h("div");
  const drawPreview = () => {
    const src = p.avatar || p.avatarUrl;
    preview.replaceChildren(src ? h("span", { class: "avatar big" }, h("img", { src, alt: "Foto de perfil" })) : h("span", { class: "avatar big" }, identicon(sid)));
  };
  drawPreview();
  const name = h("input", { type: "text", value: p.name || "", placeholder: "Nome na Steam", "aria-label": "Nome na Steam" });
  const fileIn = h("input", { type: "file", accept: "image/*", hidden: true });
  const status = h("small", { class: "muted" });
  const takeBlob = async (blob) => {
    try { p.avatar = await imageToDataURL(blob); drawPreview(); status.textContent = "Imagem pronta."; }
    catch (e) { status.textContent = "Essa imagem não abriu. Tenta outra ou um PNG/JPG."; }
  };
  fileIn.onchange = () => { if (fileIn.files[0]) takeBlob(fileIn.files[0]); fileIn.value = ""; };
  const zone = h("div", { class: "paste", tabindex: "0" },
    "Na Steam, clica com o botão direito na foto de perfil, escolhe Copiar imagem e cola aqui com Ctrl+V. Também podes arrastar um ficheiro de imagem.");
  zone.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); zone.classList.add("over"); };
  zone.ondragleave = () => zone.classList.remove("over");
  zone.ondrop = (e) => {
    e.preventDefault(); e.stopPropagation(); zone.classList.remove("over");
    const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
    if (f) takeBlob(f); else status.textContent = "Arrasta um ficheiro de imagem. Imagens arrastadas diretamente da Steam chegam só como link; copia e cola em vez disso.";
  };
  const onPaste = (e) => {
    const it = [...(e.clipboardData?.items || [])].find((x) => x.type.startsWith("image/"));
    if (it) { e.preventDefault(); takeBlob(it.getAsFile()); return; }
    const txt = e.clipboardData?.getData("text") || "";
    if (/^https?:\/\//.test(txt) && document.activeElement !== name) status.textContent = "Isso é um link. Usa Copiar imagem em vez de Copiar endereço da imagem.";
  };
  document.addEventListener("paste", onPaste);
  const close = () => { document.removeEventListener("paste", onPaste); m.remove(); };
  const urlIn = h("input", { type: "text", class: "mono", value: p.avatarUrl || "", placeholder: "https://avatars.steamstatic.com/…_full.jpg", "aria-label": "Endereço da imagem" });
  const useUrl = h("button", { class: "btn small", onClick: async () => {
    const u = urlIn.value.trim();
    if (!/^https?:\/\//.test(u)) { status.textContent = "Isso não é um endereço http."; return; }
    p.avatarUrl = u;
    status.textContent = "A carregar a imagem…";
    try { p.avatar = await urlToDataURL(u); status.textContent = "Imagem guardada."; }
    catch (e) { p.avatar = null; status.textContent = "Guardo só o endereço; a imagem em si não veio (" + netHint(e) + ")"; }
    drawPreview();
  } }, "Usar este endereço");
  const steamLink = sid ? h("a", { class: "btn small", href: "https://steamcommunity.com/profiles/" + sid, target: "_blank", rel: "noopener noreferrer" }, "Abrir perfil na Steam") : null;
  const m = modal("Perfil de " + label, [
    h("div", { class: "identity" }, preview, h("div", { style: "display:grid;gap:10px" },
      fld("Nome", name),
      h("div", null, h("span", { class: "muted", style: "font-size:13px" }, "SteamID "), h("span", { class: "mono" }, sid || "desconhecido")),
      h("div", { class: "row" }, steamLink, h("button", { class: "btn small", onClick: () => fileIn.click() }, "Escolher imagem"),
        (p.avatar || p.avatarUrl) ? h("button", { class: "btn small danger", onClick: (ev) => { p.avatar = null; p.avatarUrl = null; urlIn.value = ""; drawPreview(); ev.target.remove(); } }, "Remover foto") : null))),
    zone, fileIn,
    h("div", { class: "fld" }, h("span", null, "Ou o endereço da imagem"), h("div", { class: "row" }, urlIn, useUrl),
      h("small", null, "Botão direito na foto, Copiar endereço da imagem. Funciona quando corres o editor a partir do teu computador ou do teu site.")),
    status,
    h("small", { class: "muted" }, "O nome e a foto ficam guardados só neste browser, associados ao SteamID. Não entram no save nem são enviados para lado nenhum. Esta página não consegue ir buscá-los à Steam sozinha, porque o browser bloqueia pedidos a sites externos."),
  ], [
    h("button", { class: "btn", onClick: close }, "Cancelar"),
    h("button", { class: "btn primary", onClick: () => {
      p.name = name.value.trim();
      if (!setProfile(sid, p)) { status.textContent = "Não deu para guardar neste browser (armazenamento bloqueado ou cheio)."; return; }
      close(); onDone && onDone(); toast("Perfil guardado.");
    } }, "Guardar perfil"),
  ]);
  zone.focus();
}
function playerLabel(dir) {
  const sid = steamIdOf(dir);
  const n = getProfile(sid).name;
  if (n) return n;
  return dir === "Player_0" ? "Anfitrião" : "Jogador " + (sid ? sid.slice(-5) : dir);
}

// ================= HUD / navegação =================
function renderRail() {
  const counts = {
    contactos: safeJ("NPCs.json")?.NPCs?.length,
    produtos: safeJ("Products.json")?.DiscoveredProducts?.length,
    veiculos: safeJ("OwnedVehicles.json")?.Vehicles?.length,
    jogadores: playerDirs().length,
    imoveis: propertyPaths().length,
    dealers: (safeJ("NPCs.json")?.NPCs || []).filter((n) => /"DataType":"DealerData"/.test(n.BaseData) && !/"ID":"carteldealer"/.test(n.BaseData)).length || null,
    producao: propertyPaths().reduce((a, p) => a + ((safeJ(p)?.Objects || []).filter((o) => STATIONS[o.DataType]).length), 0) || null,
    missoes: safeJ("Quests.json")?.Quests?.length,
    ficheiros: jsonPaths().length,
    alteracoes: [...S.entries.values()].filter((e) => e.dirty).length || null,
  };
  const kids = [];
  for (const [group, tabs] of NAV) {
    kids.push(h("div", { class: "group" }, group));
    for (const [id, label] of tabs) kids.push(h("button", {
      "aria-current": S.tab === id ? "true" : "false",
      onClick: () => go(id),
    }, h("span", { class: "tile" }, icon(id)), h("span", { class: "lbl" }, label), counts[id] != null ? h("span", { class: "count" }, counts[id]) : null));
  }
  $("rail").replaceChildren(...kids);
}
function go(tab) { S.tab = tab; renderRail(); render(); window.scrollTo(0, 0); }
function playerCash(dir) {
  const inv = safeJ("Players/" + dir + "/Inventory.json");
  for (const s of inv?.Items || []) { try { const o = parseJSON(s); if (o.DataType === "CashData") return o.CashBalance; } catch (e) {} }
  return null;
}
function refreshChrome() {
  const game = safeJ("Game.json"), money = safeJ("Money.json"), rank = safeJ("Rank.json"), time = safeJ("Time.json");
  $("orgName").textContent = game?.OrganisationName || "Sem nome";
  $("saveName").textContent = [S.name, S.gv ? "v" + S.gv : null, time ? "dia " + time.ElapsedDays : null].filter(Boolean).join(", ");
  const stats = [];
  if (money) stats.push(h("div", { class: "hstat" }, h("small", null, "Banco"), h("b", { class: "money" }, fmtMoney(money.OnlineBalance))));
  const host = playerDirs()[0];
  const cash = host ? playerCash(host) : null;
  if (cash != null) stats.push(h("div", { class: "hstat" }, h("small", null, "Em mão"), h("b", { class: "money" }, fmtMoney(cash))));
  if (rank) stats.push(h("div", { class: "hstat" }, h("small", null, "Rank"), h("b", { class: "rankchip" }, RANKS[rank.Rank] || "Rank " + rank.Rank, h("i", null, ROMAN[rank.Tier] ?? rank.Tier))));
  $("stats").replaceChildren(...stats);
  const n = [...S.entries.values()].filter((e) => e.dirty).length;
  const pend = $("pending");
  pend.hidden = n === 0;
  pend.textContent = n === 1 ? "1 ficheiro alterado" : n + " ficheiros alterados";
  if (S.lastDirty !== n) { S.lastDirty = n; renderRail(); }
}
function missing(what) { return h("p", { class: "muted" }, "Este save não tem " + what + "."); }
function render() {
  const v = $("view");
  const fn = VIEWS[S.tab];
  try {
    v.replaceChildren(...[fn()].flat());
  } catch (err) {
    console.error(err);
    v.replaceChildren(viewHead("Secção ilegível"), h("p", { class: "err" }, err.message), h("p", { class: "muted" }, "Um dos ficheiros tem um formato inesperado. Podes corrigi-lo em Ficheiros."));
  }
}

// ================= exportar =================
let downloadsCap = null;
if (window.claude && typeof window.claude.use === "function") {
  window.claude.use("downloads").then((d) => { downloadsCap = d; }).catch(() => {});
}
async function offerFile(blob, filename, okMsg) {
  if (downloadsCap) {
    try { await downloadsCap.save({ filename, data: blob }); toast(okMsg); }
    catch (err) {
      if (err && err.code === "declined") return;
      if (err && err.code === "rate_limited") { toast("Já há um pedido de download aberto."); return; }
      toast("Não foi possível descarregar: " + (err?.message || err?.code || err));
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  toast(okMsg);
}
async function buildZip(original) {
  const zip = new JSZip();
  for (const rel of S.order) {
    const e = E(rel);
    const content = e.bytes ? e.bytes : original ? e.orig : outText(e);
    zip.file(S.prefix + rel, content, { createFolders: false, date: !original && e.dirty ? new Date() : e.date });
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
async function exportZip() {
  const btn = $("exportBtn");
  btn.disabled = true;
  try {
    const blob = await buildZip(false);
    await offerFile(blob, S.zipBase + "-editado.zip", "Pronto. No jogo: Continuar, Importar, e escolhe este .zip.");
  } catch (err) { toast("Erro a gerar o zip: " + err.message); }
  finally { btn.disabled = false; }
}
async function backupZip() {
  const blob = S.origFile || await buildZip(true);
  await offerFile(blob, S.zipBase + "-original.zip", "Cópia do save original descarregada.");
}
