// ================= Resumo =================
function viewResumo() {
  const out = [viewHead("Resumo", "Dinheiro, progressão e estado do mundo.",
    h("div", { class: "row" }, h("button", { class: "btn small", onClick: backupZip }, "Descarregar cópia do original")))];
  const game = safeJ("Game.json"), money = safeJ("Money.json"), rank = safeJ("Rank.json"), time = safeJ("Time.json"), law = safeJ("Law.json"), cartel = safeJ("Cartel.json");
  const row1 = [];
  if (game) row1.push(panel("Organização", h("div", { class: "grid" },
    fld("Nome", text(game, "OrganisationName", { path: "Game.json", after: refreshChrome })),
    fld("Seed do mundo", h("input", { type: "text", value: game.Seed, readonly: true, disabled: true }), "Só leitura: define o mundo gerado."),
    game.Settings ? fld("Consola", check(game.Settings, "ConsoleEnabled", "Comandos de consola ativos", { path: "Game.json" })) : null)));
  if (money) row1.push(panel("Finanças", h("div", { class: "grid" },
    fld("Saldo no banco", num(money, "OnlineBalance", { float: true, min: 0, path: "Money.json", after: refreshChrome })),
    fld("Património", num(money, "Networth", { float: true, min: 0, path: "Money.json" }), "Recalculado pelo jogo."),
    fld("Ganhos totais", num(money, "LifetimeEarnings", { float: true, min: 0, path: "Money.json" })),
    fld("Depósitos esta semana", num(money, "WeeklyDepositSum", { float: true, min: 0, path: "Money.json" }), "A 0 liberta o limite semanal do multibanco."))));
  if (row1.length) out.push(h("div", { class: "cols" }, row1));

  const row2 = [];
  if (rank) {
    const rSel = h("select", null, RANKS.map((r, i) => h("option", { value: i }, r)));
    if (rank.Rank >= RANKS.length) rSel.append(h("option", { value: rank.Rank }, "Rank " + rank.Rank));
    rSel.value = rank.Rank;
    rSel.onchange = () => { rank.Rank = Number(rSel.value); touch("Rank.json"); };
    const tSel = h("select", null, [1, 2, 3, 4, 5].map((t) => h("option", { value: t }, ROMAN[t])));
    if (!(rank.Tier >= 1 && rank.Tier <= 5)) tSel.append(h("option", { value: rank.Tier }, String(rank.Tier)));
    tSel.value = rank.Tier;
    tSel.onchange = () => { rank.Tier = Number(tSel.value); touch("Rank.json"); };
    const regions = Array.isArray(rank.UnlockedRegions) ? h("div", { class: "chips" }, REGIONS.map((name, i) => {
      const c = h("input", { type: "checkbox", checked: rank.UnlockedRegions.includes(i) });
      c.onchange = () => {
        const set = new Set(rank.UnlockedRegions);
        c.checked ? set.add(i) : set.delete(i);
        rank.UnlockedRegions = [...set].sort((a, b) => a - b);
        touch("Rank.json");
      };
      return h("label", { class: "check" }, c, name);
    })) : null;
    row2.push(panel("Rank", [h("div", { class: "grid" },
      fld("Rank", rSel), fld("Nível", tSel),
      fld("XP no nível", num(rank, "XP", { min: 0, path: "Rank.json" })),
      fld("XP total", num(rank, "TotalXP", { min: 0, path: "Rank.json" }), "Ajusta junto com o rank para ficarem coerentes.")),
      regions ? h("div", { class: "fld", style: "margin-top:16px" }, h("span", null, "Regiões desbloqueadas"), regions) : null]));
  }
  if (time) {
    const hhmm = (t) => String(Math.floor(t / 100)).padStart(2, "0") + ":" + String(t % 100).padStart(2, "0");
    const tIn = h("input", { type: "time", value: hhmm(time.TimeOfDay) });
    tIn.onchange = () => {
      const [hh, mm] = tIn.value.split(":").map(Number);
      if (!isFinite(hh) || !isFinite(mm)) return;
      time.TimeOfDay = hh * 100 + mm;
      touch("Time.json");
    };
    row2.push(panel("Tempo", h("div", { class: "grid" },
      fld("Dia", num(time, "ElapsedDays", { min: 0, path: "Time.json", after: refreshChrome })),
      fld("Hora", tIn),
      fld("Tempo de jogo", h("input", { type: "text", value: (time.Playtime / 3600).toFixed(1) + " h", readonly: true, disabled: true })))));
  }
  if (row2.length) out.push(h("div", { class: "cols" }, row2));

  if (law || cartel) {
    const kids = [];
    const g = [];
    if (law) g.push(fld("Intensidade policial", num(law, "InternalLawIntensity", { float: true, min: 0, step: 0.1, path: "Law.json" }), "Valor interno do jogo."));
    if (cartel) {
      g.push(fld("Estado do cartel", num(cartel, "Status", { min: 0, path: "Cartel.json" }), "Código interno. Muda com cuidado."));
      (cartel.RegionInfluence || []).forEach((r) => g.push(fld("Cartel em " + (REGIONS[r.Region] || "região " + r.Region),
        slider(r, "Influence", 0, 1, 0.01, 2, { path: "Cartel.json", label: "Influência do cartel em " + (REGIONS[r.Region] || r.Region) }))));
    }
    kids.push(h("div", { class: "grid" }, g));
    if (cartel) kids.push(h("p", { class: "note" }, "Influência do cartel: 0 é nenhuma, 1 é controlo total da região."));
    out.push(panel("Polícia e cartel", kids));
  }
  return out;
}

// ================= Jogadores =================
function viewJogadores() {
  const out = [viewHead("Jogadores", "Cada pessoa que jogou neste save tem inventário e dinheiro próprios. O anfitrião é o Player_0.")];
  const dirs = playerDirs();
  if (!dirs.length) return [...out, missing("jogadores")];
  if (!dirs.includes(S.player)) S.player = dirs[0];
  out.push(h("div", { class: "players" }, dirs.map((d) => {
    const sid = steamIdOf(d);
    const prof = getProfile(sid);
    const cash = playerCash(d);
    const pl = safeJ("Players/" + d + "/Player.json");
    return h("button", { class: "pcard", "aria-pressed": d === S.player ? "true" : "false", onClick: () => { S.player = d; render(); } },
      avatarEl(sid),
      h("span", { style: "display:block;min-width:0" },
        h("span", { class: "pname" }, prof.name || (d === "Player_0" ? "Anfitrião" : "Jogador convidado")),
        h("span", { class: "mono muted", style: "display:block" }, sid || d),
        h("span", { class: "meta" },
          d === "Player_0" ? h("span", { class: "tag ok" }, "Anfitrião") : h("span", { class: "tag" }, "Convidado"),
          cash != null ? h("span", { class: "tag" }, fmtMoney(cash)) : null,
          pl && pl.GameVersion && pl.GameVersion !== S.gv ? h("span", { class: "tag warn", title: "Última vez guardado nesta versão" }, "v" + pl.GameVersion) : null)));
  })));

  const epIn = h("input", { type: "text", class: "mono", value: getEndpoint(), placeholder: "https://o-teu-proxy.exemplo/api/steam", "aria-label": "Endereço do proxy" });
  epIn.onchange = () => setEndpoint(epIn.value.trim());
  const epStatus = h("small", { class: "muted" }, S.steamStatus || "");
  const report = (m) => { S.steamStatus = m; epStatus.textContent = m; };
  const sync = h("button", { class: "btn small", onClick: async () => {
    setEndpoint(epIn.value.trim());
    sync.disabled = true;
    await syncSteam(report);
    sync.disabled = false;
  } }, "Ir buscar nomes e fotos");
  out.push(panel("Ligação à Steam", [
    h("div", { class: "fld" }, h("span", null, "Endereço do teu proxy da Steam Web API"), h("div", { class: "row" }, epIn, sync), epStatus),
    h("p", { class: "note" }, "A Steam não deixa o browser falar diretamente com a API dela, por isso precisas de um proxy teu com a tua chave. Deixa isto vazio e continuas a poder definir nome e foto à mão em cada jogador. O endereço fica guardado só neste browser."),
  ]));

  const dir = S.player;
  const sid = steamIdOf(dir);
  const prof = getProfile(sid);
  const pl = safeJ("Players/" + dir + "/Player.json");
  const idBody = h("div", { class: "identity" }, avatarEl(sid, true), h("div", { style: "display:grid;gap:10px" },
    h("div", null, h("div", { style: "font-family:var(--display);font-size:28px;font-weight:600;line-height:1.1" }, prof.name || "Sem nome definido"),
      h("div", { class: "mono muted" }, sid ? "SteamID " + sid : dir)),
    h("div", { class: "row" },
      h("button", { class: "btn small primary", onClick: () => profileDialog(sid, playerLabel(dir), () => render()) }, prof.name || prof.avatar ? "Editar nome e foto" : "Definir nome e foto"),
      sid ? h("a", { class: "btn small", href: "https://steamcommunity.com/profiles/" + sid, target: "_blank", rel: "noopener noreferrer" }, "Perfil na Steam") : null),
    pl ? h("div", { class: "chips muted", style: "font-size:13px" },
      pl.Position ? h("span", null, "Posição " + ["x", "y", "z"].map((k) => Number(pl.Position[k]).toFixed(1)).join(" / ")) : null,
      "IntroCompleted" in pl ? check(pl, "IntroCompleted", "Introdução concluída", { path: "Players/" + dir + "/Player.json" }) : null) : null));
  out.push(panel("Identidade", idBody));

  const path = "Players/" + dir + "/Inventory.json";
  const inv = safeJ(path);
  if (!inv || !Array.isArray(inv.Items)) return [...out, missing("inventário para este jogador")];
  const cashIdx = inv.Items.findIndex((s) => { try { return parseJSON(s).DataType === "CashData"; } catch (e) { return false; } });
  const fillN = h("input", { type: "number", value: 20, min: 1, style: "width:90px", "aria-label": "Quantidade para todos os slots" });
  const fill = h("div", { class: "row" }, h("span", { class: "muted", style: "font-size:13.5px" }, "Pôr todos os itens a"), fillN,
    h("button", { class: "btn small", onClick: () => {
      const n = Math.max(1, Math.round(Number(fillN.value) || 1));
      let c = 0;
      inv.Items.forEach((s, i) => { try { const o = parseJSON(s); if (o.ID && o.DataType !== "CashData") { o.Quantity = n; inv.Items[i] = stringify(o, false); c++; } } catch (e) {} });
      touch(path); render(); toast(c + " slots atualizados.");
    } }, "Aplicar"));
  const body = [];
  if (cashIdx >= 0) {
    const cash = parseJSON(inv.Items[cashIdx]);
    body.push(h("div", { class: "grid", style: "margin-bottom:16px" }, fld("Dinheiro em mão", num(cash, "CashBalance", { float: true, min: 0, after: () => { inv.Items[cashIdx] = stringify(cash, false); touch(path); } }), "Dinheiro físico, separado do banco.")));
  }
  body.push(slotsEditor(inv.Items, () => touch(path), { hideCash: true }),
    h("p", { class: "note" }, "Escreve o ID do item; as sugestões incluem tudo o que aparece no save. Quantidades acima do limite do stack podem ser cortadas pelo jogo."));
  out.push(panel("Inventário", body, { extra: fill }));
  out.push(...appearancePanels(dir));
  return out;
}

// ================= Contactos =================
function npcModels() {
  const N = safeJ("NPCs.json");
  if (!N || !Array.isArray(N.NPCs)) return null;
  return N.NPCs.map((n, i) => {
    let base = {};
    try { base = parseJSON(n.BaseData); } catch (e) {}
    const ad = {};
    for (const a of n.AdditionalDatas || []) {
      if (!["Relationship", "CustomerData", "Health"].includes(a.Name)) continue;
      try { ad[a.Name] = { a, o: parseJSON(a.Contents), pretty: a.Contents.includes("\n") }; } catch (e) {}
    }
    return {
      i, n, base, ad,
      kind: base.DataType === "DealerData" ? "dealer" : base.DataType === "SupplierData" ? "supplier" : ad.CustomerData ? "customer" : "npc",
      saveBase() { n.BaseData = stringify(base, false); },
      saveAd(name) { const x = ad[name]; x.a.Contents = stringify(x.o, x.pretty); },
    };
  });
}
function viewContactos() {
  const out = [viewHead("Contactos", "Relações, clientes, dealers e quem está morto. As ações em massa aplicam-se só aos contactos filtrados.")];
  const especiais = specialCustomersPanel();
  if (especiais) out.push(especiais);
  const models = npcModels();
  if (!models) return [...out, missing("NPCs.json")];
  const P = "NPCs.json";
  const F = S.npcFilter;
  const KIND = { customer: "Cliente", dealer: "Dealer", supplier: "Fornecedor", npc: "Outro" };
  const list = models.filter((m) => {
    const id = m.base.ID || "";
    if (F.q && !(id + " " + titleCase(id)).toLowerCase().includes(F.q.toLowerCase())) return false;
    if (F.type === "dead") return !!m.ad.Health?.o.IsDead;
    if (F.type === "locked") return m.ad.Relationship && !m.ad.Relationship.o.Unlocked;
    return F.type === "all" || m.kind === F.type;
  });
  const q = h("input", { type: "search", class: "grow", placeholder: "Procurar por nome", value: F.q, "aria-label": "Procurar contactos" });
  q.oninput = () => { F.q = q.value; const pos = q.selectionStart; render(); const nq = document.querySelector("#view input[type=search]"); if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); } };
  const type = h("select", { "aria-label": "Filtrar" },
    [["all", "Todos"], ["customer", "Clientes"], ["dealer", "Dealers"], ["supplier", "Fornecedores"], ["npc", "Outros"], ["locked", "Bloqueados"], ["dead", "Mortos"]].map(([v, l]) => h("option", { value: v }, l)));
  type.value = F.type;
  type.onchange = () => { F.type = type.value; render(); };
  const bulk = (label, fn) => h("button", { class: "btn small", onClick: () => { let c = 0; for (const m of list) if (fn(m)) c++; touch(P); render(); toast(c + " contactos alterados."); } }, label);
  out.push(h("div", { class: "toolbar" }, q, type,
    bulk("Relação máxima", (m) => { const r = m.ad.Relationship; if (!r) return false; setFloat(r.o, "RelationDelta", 5); m.saveAd("Relationship"); return true; }),
    bulk("Desbloquear", (m) => { const r = m.ad.Relationship; if (!r || r.o.Unlocked) return false; r.o.Unlocked = true; m.saveAd("Relationship"); return true; }),
    bulk("Dependência máxima", (m) => { const c = m.ad.CustomerData; if (!c) return false; setFloat(c.o, "Dependence", 1); m.saveAd("CustomerData"); return true; }),
    bulk("Ressuscitar", (m) => reviveModel(m))));
  if (!list.length) return [...out, h("p", { class: "muted" }, "Nenhum contacto corresponde ao filtro.")];
  const rows = list.map((m) => {
    const r = m.ad.Relationship, c = m.ad.CustomerData, hp = m.ad.Health;
    const extra = [];
    if (m.kind === "dealer") {
      if ("Recruited" in m.base) extra.push(check(m.base, "Recruited", "Recrutado", { after: () => m.saveBase(), path: P }));
      if ("Cash" in m.base) { const inp = num(m.base, "Cash", { float: true, min: 0, after: () => m.saveBase(), path: P }); inp.style.width = "110px"; extra.push(h("label", { class: "check" }, "Dinheiro", inp)); }
    }
    if (hp) extra.push(check(hp.o, "IsDead", "Morto", { after: () => { if (!hp.o.IsDead) setFloat(hp.o, "Health", 100); m.saveAd("Health"); render(); }, path: P }));
    return h("tr", null,
      h("td", { class: "name" }, titleCase(m.base.ID || "?")),
      h("td", null, h("span", { class: "tag" + (m.kind === "dealer" ? " ok" : m.kind === "supplier" ? " info" : "") }, KIND[m.kind]), hp && hp.o.IsDead ? [" ", h("span", { class: "tag bad" }, "morto")] : null),
      h("td", null, r ? slider(r.o, "RelationDelta", 0, 5, 0.1, 1, { after: () => m.saveAd("Relationship"), path: P, label: "Relação com " + titleCase(m.base.ID) }) : h("span", { class: "muted" }, "—")),
      h("td", null, r ? check(r.o, "Unlocked", null, { after: () => m.saveAd("Relationship"), path: P }) : h("span", { class: "muted" }, "—")),
      h("td", null, c ? slider(c.o, "Dependence", 0, 1, 0.01, 2, { after: () => m.saveAd("CustomerData"), path: P, label: "Dependência de " + titleCase(m.base.ID) }) : h("span", { class: "muted" }, "—")),
      h("td", null, c ? h("span", { class: "num-tab" }, c.o.CompletedDeals ?? 0) : h("span", { class: "muted" }, "—")),
      h("td", null, h("div", { class: "chips" }, extra)));
  });
  out.push(h("section", { class: "panel flat" }, h("div", { class: "table-wrap" }, h("table", null,
    h("thead", null, h("tr", null, ["Nome", "Tipo", "Relação", "Desbloqueado", "Dependência", "Negócios", "Extra"].map((t) => h("th", null, t)))),
    h("tbody", null, rows)))));
  return out;
}
function reviveModel(m) {
  const x = m.ad.Health;
  if (!x || !x.o.IsDead) return false;
  x.o.IsDead = false;
  setFloat(x.o, "Health", 100);
  if ("DaysPassedSinceDeath" in x.o) x.o.DaysPassedSinceDeath = 0;
  m.saveAd("Health");
  return true;
}

// ================= Produtos =================
function viewProdutos() {
  const out = [viewHead("Produtos", "Preços pedidos, nomes das tuas misturas e favoritos.")];
  const P = safeJ("Products.json");
  if (!P) return [...out, missing("Products.json")];
  const path = "Products.json";
  P.ProductPrices = P.ProductPrices || [];
  const priceOf = (id) => {
    let e = P.ProductPrices.find((x) => x.String === id);
    if (!e) { e = { String: id, Int: 0 }; P.ProductPrices.push(e); }
    return e;
  };
  const ids = P.DiscoveredProducts || [];
  const fav = new Set(P.FavouritedProducts || []);
  const factor = h("input", { type: "number", value: 1.5, step: 0.1, min: 0.1, style: "width:90px", "aria-label": "Fator de preço" });
  const flt = h("select", { "aria-label": "Tipo de produto" }, [["all", "Todos os tipos"], ...Object.entries(DRUG).map(([k, v]) => [k, v[0]])].map(([v, l]) => h("option", { value: v }, l)));
  flt.value = S.prodFilter || "all";
  flt.onchange = () => { S.prodFilter = flt.value; render(); };
  const shown = ids.filter((id) => (S.prodFilter || "all") === "all" || String(S.products.get(id)?.type) === S.prodFilter);
  out.push(h("div", { class: "toolbar" }, flt,
    h("span", { class: "muted", style: "margin-left:8px" }, "Multiplicar preços filtrados por"), factor,
    h("button", { class: "btn small", onClick: () => {
      const f = Number(factor.value);
      if (!(f > 0)) return;
      for (const id of shown) { const e = priceOf(id); e.Int = Math.max(1, Math.round(e.Int * f)); }
      touch(path); render(); toast(shown.length + " preços atualizados.");
    } }, "Aplicar")));
  const rows = shown.map((id) => {
    const info = S.products.get(id) || { name: titleCase(id), type: -1, fx: [] };
    const price = num(priceOf(id), "Int", { min: 0, path });
    price.style.width = "100px";
    const favBox = h("input", { type: "checkbox", checked: fav.has(id), "aria-label": "Favorito" });
    favBox.onchange = () => {
      favBox.checked ? fav.add(id) : fav.delete(id);
      P.FavouritedProducts = ids.filter((x) => fav.has(x));
      touch(path);
    };
    return h("tr", null,
      h("td", null, info.ref ? text(info.ref, "Name", { path, after: () => { info.name = info.ref.Name; } }) : h("b", null, info.name)),
      h("td", null, h("span", { class: "mono muted" }, id)),
      h("td", null, h("span", { class: "tag" }, DRUG[info.type]?.[0] || "?")),
      h("td", null, h("div", { class: "fx" }, info.fx.map((f) => h("span", { class: "tag" }, f)))),
      h("td", null, price),
      h("td", null, favBox));
  });
  out.push(h("section", { class: "panel flat" }, h("div", { class: "table-wrap" }, h("table", null,
    h("thead", null, h("tr", null, ["Nome", "ID", "Tipo", "Efeitos", "Preço ($)", "Favorito"].map((t) => h("th", null, t)))),
    h("tbody", null, rows)))));
  return out;
}

// ================= Imóveis =================
const LAUNDER_CAP = { "Post Office": [4000, 5000], "Car Wash": [6000, 8000], "Taco Ticklers": [8000, 12000] };
function viewImoveis() {
  const out = [viewHead("Imóveis e negócios", "Posse, lavagem de dinheiro, empregados e o conteúdo de prateleiras, cacifos e armários.")];
  const paths = propertyPaths();
  if (!paths.length) out.push(missing("imóveis"));
  for (const path of paths) {
    let d;
    try { d = J(path); } catch (e) { out.push(panel(path, h("p", { class: "err" }, e.message))); continue; }
    const name = path.split("/").pop().replace(/\.json$/, "");
    const kids = [];
    const cap = LAUNDER_CAP[name];
    const ops = (d.LaunderingOperations || []).map((op) => h("div", { class: "grid" },
      fld("Valor a lavar", num(op, "Amount", { float: true, min: 0, path }), cap ? "Capacidade na 0.4.7: " + cap[1] + " (era " + cap[0] + ")" : null),
      fld("Minutos decorridos", num(op, "MinutesSinceStarted", { min: 0, path }), "Um dia de jogo são 1440 minutos.")));
    if (ops.length) kids.push(h("div", { style: "padding:14px 18px;border-bottom:1px solid var(--line);display:grid;gap:10px" }, h("b", null, "Lavagem em curso"), ops));
    const emps = (d.Employees || []).map((em) => {
      let b;
      try { b = parseJSON(em.BaseData); } catch (e) { return null; }
      const save = () => { em.BaseData = stringify(b, false); };
      const role = (b.DataType || "").replace(/Data$/, "");
      const ROLE = { Botanist: "Botânico", Chemist: "Químico", Packager: "Embalador", Cleaner: "Empregado de limpeza" };
      return h("tr", null,
        h("td", null, text(b, "FirstName", { path, after: save })),
        h("td", null, text(b, "LastName", { path, after: save })),
        h("td", null, h("span", { class: "tag" }, ROLE[role] || role)),
        h("td", null, "PaidForToday" in b ? check(b, "PaidForToday", "Pago hoje", { path, after: save }) : null));
    }).filter(Boolean);
    if (emps.length) kids.push(h("div", { class: "table-wrap", style: "border-bottom:1px solid var(--line)" }, h("table", null,
      h("thead", null, h("tr", null, ["Nome", "Apelido", "Função", "Salário"].map((t) => h("th", null, t)))), h("tbody", null, emps))));
    const stores = [];
    (d.Objects || []).forEach((obj) => {
      if (obj.DataType !== "PlaceableStorageData") return;
      let base;
      try { base = parseJSON(obj.BaseData); } catch (e) { return; }
      if (!base.Contents || !Array.isArray(base.Contents.Items)) return;
      let itemId = "armazenamento";
      try { itemId = parseJSON(base.ItemString).ID; } catch (e) {}
      const items = base.Contents.Items;
      const sum = h("span", { class: "tag" }, slotSummary(items));
      const det = h("details", { class: "store" }, h("summary", null, h("span", { class: "mono" }, itemId), sum));
      let built = false;
      det.ontoggle = () => {
        if (!det.open || built) return;
        built = true;
        det.append(slotsEditor(items, () => { obj.BaseData = stringify(base, false); sum.textContent = slotSummary(items); touch(path); }));
      };
      stores.push(det);
    });
    if (stores.length) kids.push(h("div", null, stores));
    else kids.push(h("p", { class: "muted", style: "margin:0;padding:12px 18px" }, "Sem armazenamento colocado."));
    out.push(h("section", { class: "panel flat" },
      h("header", null, h("h3", null, name), h("span", { class: "tag" }, path.startsWith("Businesses") ? "Negócio" : "Imóvel"),
        emps.length ? h("span", { class: "tag" }, emps.length + " empregados") : null, h("span", { class: "sp" }),
        "IsOwned" in d ? check(d, "IsOwned", "Comprado", { path }) : null),
      h("div", { class: "body" }, kids)));
  }
  const W = safeJ("WorldStorageEntities.json");
  if (W && Array.isArray(W.Entities) && W.Entities.length) {
    out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, "Outros armazenamentos no mundo")),
      h("div", { class: "body" }, W.Entities.filter((en) => en.Contents && Array.isArray(en.Contents.Items)).map((en, i) => {
        const sum = h("span", { class: "tag" }, slotSummary(en.Contents.Items));
        return h("details", { class: "store" }, h("summary", null, h("span", { class: "mono" }, "Entidade " + (i + 1)), sum),
          slotsEditor(en.Contents.Items, () => { sum.textContent = slotSummary(en.Contents.Items); touch("WorldStorageEntities.json"); }));
      }))));
  }
  return out;
}

// ================= Veículos =================
function viewVeiculos() {
  const out = [viewHead("Veículos", "Cor e bagageira de cada veículo teu.")];
  const V = safeJ("OwnedVehicles.json");
  const path = "OwnedVehicles.json";
  if (!V || !Array.isArray(V.Vehicles) || !V.Vehicles.length) return [...out, missing("veículos")];
  V.Vehicles.forEach((v) => {
    const items = v.VehicleContents?.Items;
    out.push(h("section", { class: "panel" },
      h("header", null, h("h3", null, titleCase(v.VehicleCode || "veículo")), h("span", { class: "mono muted" }, v.VehicleCode), h("span", { class: "sp" }),
        h("label", { class: "check" }, "Cor", (() => { const t = text(v, "Color", { path, list: "dl-colors" }); t.style.width = "140px"; return t; })())),
      h("div", { class: "body" }, Array.isArray(items) ? slotsEditor(items, () => touch(path)) : h("p", { class: "muted" }, "Sem bagageira."))));
  });
  return out;
}

// ================= Missões =================
function stateSelect(obj, key, path, after) {
  const s = h("select", { style: "width:auto" }, QUEST_STATES.map((l, i) => h("option", { value: i }, l)));
  if (!(obj[key] >= 0 && obj[key] < QUEST_STATES.length)) s.append(h("option", { value: obj[key] }, "Estado " + obj[key]));
  s.value = obj[key];
  s.onchange = () => { obj[key] = Number(s.value); touch(path); after && after(); };
  return s;
}
function viewMissoes() {
  const out = [viewHead("Missões", "Estado das missões da história e dos contratos ativos. Alterar missões pode saltar partes da história, por isso guarda o original.")];
  const Q = safeJ("Quests.json");
  const path = "Quests.json";
  if (!Q) return [...out, missing("Quests.json")];
  const quests = Q.Quests || [];
  out.push(h("div", { class: "toolbar" },
    h("button", { class: "btn small", onClick: () => {
      let c = 0;
      for (const q of quests) if (q.State === 1) { q.State = 2; (q.Entries || []).forEach((e) => { e.State = 2; }); c++; }
      if (c) touch(path);
      render(); toast(c ? c + " missões ativas concluídas." : "Não havia missões ativas.");
    } }, "Concluir missões ativas")));
  const rows = quests.map((q) => {
    const entries = q.Entries || [];
    const det = entries.length ? h("details", null, h("summary", { class: "muted", style: "cursor:pointer;font-size:13px" }, entries.length + " passos"),
      h("div", { style: "display:grid;gap:6px;margin-top:8px" }, entries.map((e) => h("div", { class: "row", style: "justify-content:space-between" }, h("span", { style: "font-size:13.5px" }, e.Name), stateSelect(e, "State", path))))) : null;
    return h("tr", null,
      h("td", null, h("b", null, q.Title), h("div", { class: "muted", style: "font-size:13px;max-width:52ch" }, q.Description), det),
      h("td", null, stateSelect(q, "State", path)),
      h("td", null, check(q, "IsTracked", "Seguir", { path })));
  });
  out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, "Missões"), h("span", { class: "tag" }, quests.length)),
    h("div", { class: "table-wrap" }, h("table", null, h("thead", null, h("tr", null, ["Missão", "Estado", "No ecrã"].map((t) => h("th", null, t)))), h("tbody", null, rows)))));
  const contracts = Q.Contracts || [];
  if (contracts.length) {
    out.push(h("section", { class: "panel flat" }, h("header", null, h("h3", null, "Contratos"), h("span", { class: "tag" }, contracts.length)),
      h("div", { class: "table-wrap" }, h("table", null, h("thead", null, h("tr", null, ["Contrato", "Pagamento", "Estado"].map((t) => h("th", null, t)))),
        h("tbody", null, contracts.map((c) => h("tr", null,
          h("td", null, h("b", null, c.Title), h("div", { class: "muted", style: "font-size:13px" }, c.Description)),
          h("td", null, "Payment" in c ? (() => { const n = num(c, "Payment", { float: true, min: 0, path }); n.style.width = "110px"; return n; })() : null),
          h("td", null, stateSelect(c, "State", path)))))))));
  }
  return out;
}
