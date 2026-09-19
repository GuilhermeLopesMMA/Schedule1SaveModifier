// ================= Ferramentas =================
function eachObjectBase(fn) {
  let changed = 0;
  for (const p of propertyPaths()) {
    const d = safeJ(p);
    if (!d) continue;
    let fileChanged = false;
    for (const o of d.Objects || []) {
      let base;
      try { base = parseJSON(o.BaseData); } catch (e) { continue; }
      if (fn(base, o, p)) { o.BaseData = stringify(base, false); fileChanged = true; changed++; }
    }
    if (fileChanged) mark(p);
  }
  return changed;
}
function eachEmployee(fn) {
  let changed = 0;
  for (const p of propertyPaths()) {
    const d = safeJ(p);
    if (!d) continue;
    for (const em of d.Employees || []) {
      let b;
      try { b = parseJSON(em.BaseData); } catch (e) { continue; }
      if (fn(b)) { em.BaseData = stringify(b, false); mark(p); changed++; }
    }
  }
  return changed;
}
function addHostCash(amount) {
  const dir = playerDirs()[0];
  const path = "Players/" + dir + "/Inventory.json";
  const inv = safeJ(path);
  if (!inv) return false;
  const idx = inv.Items.findIndex((s) => { try { return parseJSON(s).DataType === "CashData"; } catch (e) { return false; } });
  if (idx < 0) return false;
  const o = parseJSON(inv.Items[idx]);
  setFloat(o, "CashBalance", Math.max(0, (Number(o.CashBalance) || 0) + amount));
  inv.Items[idx] = stringify(o, false);
  mark(path);
  return true;
}

const TOOLS = [
  ["Dinheiro", [
    { t: "Depositar no banco", d: "Soma o valor ao saldo bancário.", input: 100000, run: (v) => {
      const m = safeJ("Money.json"); if (!m) return "Este save não tem Money.json.";
      setFloat(m, "OnlineBalance", (Number(m.OnlineBalance) || 0) + v); mark("Money.json");
      return fmtMoney(v) + " depositados.";
    } },
    { t: "Dar dinheiro em mão ao anfitrião", d: "Soma dinheiro físico ao inventário do Player_0.", input: 10000, run: (v) =>
      addHostCash(v) ? fmtMoney(v) + " adicionados à carteira." : "Não encontrei a carteira do anfitrião." },
    { t: "Libertar o limite do multibanco", d: "Põe os depósitos desta semana a zero.", run: () => {
      const m = safeJ("Money.json"); if (!m) return "Este save não tem Money.json.";
      setFloat(m, "WeeklyDepositSum", 0); mark("Money.json"); return "Limite semanal libertado.";
    } },
    { t: "Recolher o dinheiro dos dealers", d: "Tira o dinheiro que os dealers têm consigo e passa-o para a carteira do anfitrião.", run: () => {
      const N = safeJ("NPCs.json"); if (!N) return "Este save não tem NPCs.json.";
      let total = 0;
      for (const n of N.NPCs || []) {
        let b; try { b = parseJSON(n.BaseData); } catch (e) { continue; }
        if (b.DataType === "DealerData" && Number(b.Cash) > 0) { total += Number(b.Cash); setFloat(b, "Cash", 0); n.BaseData = stringify(b, false); }
      }
      if (!total) return "Os dealers não tinham dinheiro.";
      mark("NPCs.json");
      addHostCash(total);
      return fmtMoney(total) + " recolhidos dos dealers.";
    } },
    { t: "Terminar lavagens de dinheiro", d: "Marca todas as lavagens em curso como tendo passado um dia de jogo inteiro.", run: () => {
      let c = 0;
      for (const p of propertyPaths()) {
        const d = safeJ(p);
        for (const op of d?.LaunderingOperations || []) if (op.MinutesSinceStarted < 1440) { op.MinutesSinceStarted = 1440; mark(p); c++; }
      }
      return c ? c + " lavagens prontas." : "Não havia lavagens em curso.";
    } },
  ]],
  ["Progressão", [
    { t: "Rank máximo", d: "Kingpin V, com todas as regiões desbloqueadas.", run: () => {
      const r = safeJ("Rank.json"); if (!r) return "Este save não tem Rank.json.";
      r.Rank = RANKS.length - 1; r.Tier = 5; r.UnlockedRegions = REGIONS.map((_, i) => i); mark("Rank.json");
      return "Agora és Kingpin V.";
    } },
    { t: "Desbloquear todas as regiões", d: "Abre todos os bairros de Hyland Point sem mexer no rank.", run: () => {
      const r = safeJ("Rank.json"); if (!r) return "Este save não tem Rank.json.";
      r.UnlockedRegions = REGIONS.map((_, i) => i); mark("Rank.json"); return "Regiões desbloqueadas.";
    } },
    { t: "Comprar todos os imóveis e negócios", d: "Marca todos como teus, incluindo a mansão. Pode saltar missões ligadas a compras.", run: () => {
      let c = 0;
      for (const p of propertyPaths()) { const d = safeJ(p); if (d && d.IsOwned === false) { d.IsOwned = true; mark(p); c++; } }
      return c ? c + " imóveis passaram a ser teus." : "Já eram todos teus.";
    } },
  ]],
  ["Pessoas", [
    { t: "Todos os contactos no máximo", d: "Desbloqueia todos os contactos e põe a relação em 5.", run: () => {
      const ms = npcModels(); if (!ms) return "Este save não tem NPCs.json.";
      let c = 0;
      for (const m of ms) { const r = m.ad.Relationship; if (!r) continue; r.o.Unlocked = true; setFloat(r.o, "RelationDelta", 5); m.saveAd("Relationship"); c++; }
      mark("NPCs.json"); return c + " contactos no máximo.";
    } },
    { t: "Clientes totalmente dependentes", d: "Põe a dependência de todos os clientes em 1.", run: () => {
      const ms = npcModels(); if (!ms) return "Este save não tem NPCs.json.";
      let c = 0;
      for (const m of ms) { const x = m.ad.CustomerData; if (!x) continue; setFloat(x.o, "Dependence", 1); m.saveAd("CustomerData"); c++; }
      mark("NPCs.json"); return c + " clientes atualizados.";
    } },
    { t: "Ressuscitar toda a gente", d: "Traz de volta qualquer NPC morto, com a vida cheia.", run: () => {
      const ms = npcModels(); if (!ms) return "Este save não tem NPCs.json.";
      let c = 0; for (const m of ms) if (reviveModel(m)) c++;
      if (c) mark("NPCs.json");
      return c ? c + " NPCs ressuscitados." : "Ninguém estava morto.";
    } },
    { t: "Pagar os empregados hoje", d: "Marca o salário de hoje como pago para todos os empregados.", run: () => {
      const c = eachEmployee((b) => { if (b.PaidForToday === false) { b.PaidForToday = true; return true; } return false; });
      return c ? c + " empregados pagos." : "Já estavam todos pagos.";
    } },
  ]],
  ["Produção e mundo", [
    { t: "Cogumelos prontos a colher", d: "Põe o crescimento de todas as camas de cogumelos com colónia em 100%.", run: () => {
      const c = eachObjectBase((b) => {
        const col = b.ShroomColonyData;
        if (b.DataType !== "MushroomBedData" || !col || !col.MushroomSpawnID || col.GrowthProgress >= 1) return false;
        setFloat(col, "GrowthProgress", 1); return true;
      });
      return c ? c + " camas de cogumelos prontas." : "Não havia cogumelos a crescer.";
    } },
    { t: "Limpar o lixo do mundo", d: "Remove todo o lixo espalhado pelo mapa.", run: () => {
      const t = safeJ("Trash.json"); if (!t) return "Este save não tem Trash.json.";
      const n = (t.Items || []).length;
      t.Items = [];
      for (const g of t.Generators || []) if (Array.isArray(g.GeneratedItems)) g.GeneratedItems = [];
      mark("Trash.json"); return n + " peças de lixo removidas.";
    } },
    { t: "Expulsar o cartel", d: "Põe a influência do cartel a 0 em todas as regiões.", run: () => {
      const c = safeJ("Cartel.json"); if (!c) return "Este save não tem Cartel.json.";
      for (const r of c.RegionInfluence || []) setFloat(r, "Influence", 0);
      mark("Cartel.json"); return "Influência do cartel a zero.";
    } },
    { t: "Todos os produtos a 2x o preço", d: "Duplica o preço pedido de cada produto descoberto.", run: () => {
      const P = safeJ("Products.json"); if (!P) return "Este save não tem Products.json.";
      for (const e of P.ProductPrices || []) e.Int = Math.max(1, Math.round(e.Int * 2));
      mark("Products.json"); return "Preços duplicados.";
    } },
  ]],
];
function viewFerramentas() {
  const out = [viewHead("Ferramentas", "Ações rápidas sobre o save inteiro. Cada uma aparece em Alterações, e podes repor tudo antes de descarregar.")];
  for (const [group, tools] of TOOLS) {
    out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, group)),
      h("div", { class: "body tools" }, tools.map((tool) => {
        const inp = tool.input != null ? h("input", { type: "number", value: tool.input, min: 0, "aria-label": tool.t }) : null;
        const btn = h("button", { class: "btn small primary", onClick: () => {
          const v = inp ? Math.max(0, Number(inp.value) || 0) : undefined;
          try {
            const msg = tool.run(v);
            refreshChrome();
            toast(msg);
          } catch (err) { console.error(err); toast("Falhou: " + err.message); }
        } }, "Aplicar");
        return h("div", { class: "tool" }, h("div", null, h("b", null, tool.t), h("p", null, tool.d)), h("div", { class: "act" }, inp, btn));
      }))));
  }
  return out;
}

// ================= Variáveis =================
function varsTable(path) {
  const V = safeJ(path);
  if (!V || !Array.isArray(V.Variables)) return missing(path);
  const body = h("tbody");
  const draw = () => {
    body.replaceChildren(...V.Variables.map((x, i) => h("tr", null,
      h("td", null, h("span", { class: "mono" }, x.Name)),
      h("td", null, /^(True|False)$/.test(x.Value)
        ? (() => { const s = h("select", { style: "width:auto" }, h("option", { value: "True" }, "True"), h("option", { value: "False" }, "False")); s.value = x.Value; s.onchange = () => { x.Value = s.value; touch(path); }; return s; })()
        : text(x, "Value", { path, mono: true })),
      h("td", { style: "width:40px" }, h("button", { class: "icon-btn", title: "Apagar variável", "aria-label": "Apagar " + x.Name, onClick: () => { V.Variables.splice(i, 1); touch(path); draw(); } }, "×")))));
  };
  draw();
  const nName = h("input", { type: "text", class: "mono grow", placeholder: "Nome", "aria-label": "Nome da nova variável" });
  const nVal = h("input", { type: "text", class: "mono", placeholder: "Valor", "aria-label": "Valor da nova variável" });
  const add = h("button", { class: "btn small", onClick: () => {
    const name = nName.value.trim();
    if (!name) return;
    const ex = V.Variables.find((x) => x.Name === name);
    if (ex) ex.Value = nVal.value;
    else V.Variables.push({ DataType: "VariableData", DataVersion: 0, GameVersion: S.gv, Name: name, Value: nVal.value });
    nName.value = ""; nVal.value = "";
    touch(path); draw();
  } }, "Adicionar ou atualizar");
  return [h("div", { class: "table-wrap" }, h("table", null, h("thead", null, h("tr", null, h("th", null, "Nome"), h("th", null, "Valor"), h("th"))), body)),
    h("div", { class: "toolbar", style: "padding:12px 14px 0;margin:0" }, nName, nVal, add)];
}
function viewVariaveis() {
  const out = [viewHead("Variáveis", "Contadores e flags internas do jogo.")];
  out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, "Do mundo")), h("div", { class: "body", style: "padding-bottom:12px" }, varsTable("Variables.json"))));
  const dirs = playerDirs();
  if (dirs.length) {
    if (!dirs.includes(S.player)) S.player = dirs[0];
    const pick = dirs.length > 1 ? h("div", { class: "row" }, dirs.map((d) => h("button", { class: "btn small" + (d === S.player ? " primary" : ""), onClick: () => { S.player = d; render(); } }, playerLabel(d)))) : null;
    out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, "Do jogador"), h("span", { class: "sp" }), pick),
      h("div", { class: "body", style: "padding-bottom:12px" }, varsTable("Players/" + S.player + "/Variables.json"))));
  }
  return out;
}

// ================= Ficheiros =================
function viewFicheiros() {
  const out = [viewHead("Ficheiros", "Edição direta do JSON, para o que não tem ecrã próprio. O texto é validado antes de ser aplicado.")];
  const paths = jsonPaths();
  if (!S.rawPath || !S.entries.has(S.rawPath)) S.rawPath = paths.includes("Game.json") ? "Game.json" : paths[0];
  const e = E(S.rawPath);
  const list = h("section", { class: "panel flat", style: "margin:0" }, h("div", { class: "file-list" }, paths.map((p) => {
    const en = E(p);
    return h("button", { "aria-current": p === S.rawPath ? "true" : "false", onClick: () => { S.rawPath = p; render(); } },
      h("span", null, en.dirty ? [h("span", { class: "dot", title: "Alterado" }), " "] : null, p), h("span", { class: "sz" }, fmtSize(en.text.length)));
  })));
  const ta = h("textarea", { class: "raw", spellcheck: "false", "aria-label": "Conteúdo de " + S.rawPath });
  ta.value = outText(e);
  const err = h("span", { class: "err", hidden: true });
  const apply = h("button", { class: "btn primary small", onClick: () => {
    try {
      e.data = parseJSON(ta.value);
      e.text = ta.value;
      e.pretty = ta.value.slice(0, 400).includes("\n");
      e.dirty = true;
      err.hidden = true;
      buildCatalog(); refreshChrome(); renderRail(); render();
      toast("Aplicado a " + S.rawPath + ".");
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  } }, "Aplicar");
  const revert = h("button", { class: "btn small", onClick: () => { ta.value = outText(e); err.hidden = true; } }, "Descartar edição");
  const restore = e.dirty ? h("button", { class: "btn small danger", onClick: () => { e.text = e.orig; e.data = null; e.dirty = false; buildCatalog(); refreshChrome(); render(); toast("Ficheiro reposto."); } }, "Repor original") : null;
  if (S.rawSelect) {
    const [a, b] = S.rawSelect;
    S.rawSelect = null;
    queueMicrotask(() => {
      ta.focus();
      ta.setSelectionRange(a, b);
      const before = ta.value.slice(0, a).split("\n").length;
      ta.scrollTop = Math.max(0, (before - 6) * 17);
    });
  }
  out.push(h("div", { class: "files" }, list,
    h("section", { class: "panel flat", style: "margin:0" }, h("header", null, h("span", { class: "mono" }, S.rawPath), err, h("span", { class: "sp" }), revert, restore, apply), ta)));
  return out;
}

// ================= Alterações =================
function shortVal(v) {
  if (v === undefined) return "(não existia)";
  if (typeof v === "string") return v.length > 90 ? JSON.stringify(v.slice(0, 90)) + "…" : JSON.stringify(v);
  if (Array.isArray(v)) return v.length + " elementos";
  if (v && typeof v === "object") { const s = stringify(v, false); return s.length > 90 ? s.slice(0, 90) + "…" : s; }
  return String(v);
}
function segLabel(parent, k) {
  const el = parent[k];
  if (Array.isArray(parent) && el && typeof el === "object") {
    const tag = el.ID || el.Name || el.String || el.Title || el.PropertyCode || el.VehicleCode;
    if (tag) return "[" + tag + "]";
  }
  if (Array.isArray(parent) && el && typeof el.BaseData === "string") {
    const m = el.BaseData.match(/"ID"\s*:\s*"([^"]+)"/);
    if (m) return "[" + m[1] + "]";
  }
  if (Array.isArray(parent) && typeof el === "string" && el[0] === "{") {
    const m = el.match(/"ID"\s*:\s*"([^"]+)"/);
    if (m) return "[" + m[1] + "]";
  }
  return Array.isArray(parent) ? "[" + k + "]" : "." + k;
}
function diffValues(a, b, path, out, limit) {
  if (out.length >= limit || a === b) return;
  if (typeof a === "string" && typeof b === "string" && a[0] === "{" && b[0] === "{") {
    try { return diffValues(parseJSON(a), parseJSON(b), path, out, limit); } catch (e) { /* segue */ }
  }
  if (a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    if (Array.isArray(a) && a.length !== b.length && typeof a[0] !== "string") { out.push({ path, a, b }); return; }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      diffValues(a[k], b[k], path + segLabel(b[k] !== undefined ? b : a, k), out, limit);
      if (out.length >= limit) return;
    }
    return;
  }
  if (typeof a === "number" && typeof b === "number" && a === b) return;
  out.push({ path, a, b });
}
function viewAlteracoes() {
  const dirty = [...S.entries.entries()].filter(([, e]) => e.dirty).sort((x, y) => x[0].localeCompare(y[0]));
  const out = [viewHead("Alterações", "Tudo o que vai ser diferente do save original quando descarregares.",
    dirty.length ? h("div", { class: "row" }, h("button", { class: "btn small danger", id: "resetAll" }, "Repor tudo"), h("button", { class: "btn small primary", onClick: exportZip }, "Descarregar para importar")) : null)];
  if (!dirty.length) return [...out, panel(null, h("p", { class: "muted", style: "margin:0" }, "Ainda não mudaste nada. O save está igual ao original."))];
  const files = dirty.map(([p, e]) => {
    const rows = [];
    let failed = false;
    try { diffValues(parseJSON(e.orig), e.data || parseJSON(e.text), "", rows, 200); } catch (err) { failed = true; }
    return h("div", { class: "diff-file" },
      h("h4", null, p, h("span", { class: "tag" }, failed ? "?" : rows.length >= 200 ? "200+" : rows.length),
        h("span", { style: "flex:1" }),
        h("button", { class: "btn small ghost danger", onClick: () => { e.text = e.orig; e.data = null; e.dirty = false; buildCatalog(); refreshChrome(); render(); toast(p + " reposto."); } }, "Repor")),
      failed ? h("div", { class: "diff-row" }, h("span", { class: "err" }, "Não foi possível comparar este ficheiro.")) :
        rows.length ? rows.map((r) => h("div", { class: "diff-row" }, h("span", { class: "path" }, r.path.replace(/\.AdditionalDatas\[(\w+)\]\.Contents/g, ".$1").replace(/\.(BaseData|Contents)(?=[.\[]|$)/g, "").replace(/^\./, "") || "(raiz)"), h("span", { class: "from" }, shortVal(r.a)), h("span", { class: "to" }, shortVal(r.b)))) :
          h("div", { class: "diff-row" }, h("span", { class: "muted" }, "Só mudou a formatação dos números, os valores são iguais.")));
  });
  out.push(h("section", { class: "panel flat" }, h("div", { class: "body" }, files)));
  queueMicrotask(() => {
    const b = $("resetAll");
    if (!b) return;
    let armed = null;
    b.onclick = () => {
      if (!armed) { b.textContent = "Clica outra vez para confirmar"; armed = setTimeout(() => { armed = null; b.textContent = "Repor tudo"; }, 3500); return; }
      clearTimeout(armed);
      for (const e of S.entries.values()) if (!e.bytes) { e.text = e.orig; e.data = null; e.dirty = false; }
      buildCatalog(); refreshChrome(); renderRail(); render();
      toast("Tudo reposto como no original.");
    };
  });
  return out;
}

const VIEWS = {
  resumo: viewResumo, jogadores: viewJogadores, contactos: viewContactos, produtos: viewProdutos,
  imoveis: viewImoveis, producao: viewProducao, dealers: viewDealers, veiculos: viewVeiculos,
  missoes: viewMissoes, ferramentas: viewFerramentas, procurar: viewProcurar,
  variaveis: viewVariaveis, ficheiros: viewFicheiros, alteracoes: viewAlteracoes,
};

// ================= eventos =================
$("pickZip").onclick = () => $("zipInput").click();
$("pickDir").onclick = () => $("dirInput").click();
$("zipInput").onchange = (ev) => {
  const f = ev.target.files[0];
  ev.target.value = "";
  $("loadErr").hidden = true;
  if (f) openZip(f).catch(showLoadError);
};
$("dirInput").onchange = (ev) => {
  const files = [...ev.target.files];
  ev.target.value = "";
  $("loadErr").hidden = true;
  if (files.length) openFromList(files.map((file) => ({ path: file.webkitRelativePath || file.name, file }))).catch(showLoadError);
};
const drop = $("drop");
["dragenter", "dragover"].forEach((t) => document.addEventListener(t, (ev) => { ev.preventDefault(); if (!$("empty").hidden) drop.classList.add("over"); }));
document.addEventListener("dragleave", (ev) => { if (!ev.relatedTarget) drop.classList.remove("over"); });
document.addEventListener("drop", async (ev) => {
  ev.preventDefault();
  drop.classList.remove("over");
  if ($("empty").hidden) return;
  $("loadErr").hidden = true;
  try {
    const entries = [...(ev.dataTransfer.items || [])].map((it) => it.webkitGetAsEntry && it.webkitGetAsEntry()).filter(Boolean);
    const dirs = entries.filter((en) => en.isDirectory);
    if (dirs.length) {
      const list = [];
      for (const d of dirs) await walkEntry(d, "", list);
      await openFromList(list);
      return;
    }
    const f = [...ev.dataTransfer.files].find((x) => /\.zip$/i.test(x.name));
    if (f) await openZip(f);
    else throw new Error("Larga o .zip exportado pelo jogo ou uma pasta SaveGame_N.");
  } catch (err) { showLoadError(err); }
});
function walkEntry(entry, prefix, list) {
  return new Promise((resolve, reject) => {
    if (entry.isFile) { entry.file((file) => { list.push({ path: prefix + entry.name, file }); resolve(); }, reject); return; }
    const reader = entry.createReader();
    const all = [];
    const readBatch = () => reader.readEntries(async (batch) => {
      if (!batch.length) {
        try { for (const c of all) await walkEntry(c, prefix + entry.name + "/", list); resolve(); } catch (e) { reject(e); }
        return;
      }
      all.push(...batch);
      readBatch();
    }, reject);
    readBatch();
  });
}
$("exportBtn").onclick = exportZip;
$("pending").onclick = () => go("alteracoes");
$("closeBtn").onclick = () => {
  $("editor").hidden = true;
  $("empty").hidden = false;
  S.entries = new Map();
  S.lastDirty = undefined;
  $("loadErr").hidden = true;
};
const hud = $("hud");
const setTop = () => {
  const sticky = getComputedStyle(hud).position === "sticky";
  document.documentElement.style.setProperty("--top", (sticky ? hud.offsetHeight : 0) + "px");
};
new ResizeObserver(setTop).observe(hud);
window.addEventListener("resize", setTop);
