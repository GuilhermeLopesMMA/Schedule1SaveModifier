// ================= etiquetas e campos automáticos =================
const STATIONS = {
  PotData: "Vaso", MushroomBedData: "Cama de cogumelos", DryingRackData: "Secador",
  MixingStationData: "Estação de mistura", ChemistryStationData: "Estação de química", LabOvenData: "Forno",
  CauldronData: "Caldeirão", BrickPressData: "Prensa de tijolos", PackagingStationData: "Estação de embalagem",
  SpawnStationData: "Estação de esporos",
};
const LBL = {
  SoilID: "Terra", SoilLevel: "Nível de terra", RemainingSoilUses: "Usos de terra restantes", WaterLevel: "Água",
  SeedID: "Semente", GrowthProgress: "Crescimento", MushroomSpawnID: "Esporos", Quality: "Qualidade",
  CurrentRecipeID: "Receita atual", ProductQuality: "Qualidade do produto", LiquidLevel: "Nível de líquido",
  CurrentTime: "Tempo decorrido", CurrentIngredientID: "Ingrediente", CurrentIngredientQuantity: "Quantidade do ingrediente",
  CurrentIngredientQuality: "Qualidade do ingrediente", CurrentProductID: "Produto", CurrentCookProgress: "Progresso da cozedura",
  RemainingCookTime: "Tempo de cozedura restante", InputQuality: "Qualidade de entrada", CurrentMixTime: "Tempo de mistura",
  ProductID: "Produto", IngredientID: "Ingrediente", Quantity: "Quantidade", StartLiquidColor: "Cor do líquido",
  Gender: "Género", Weight: "Peso", SkinColor: "Cor da pele", HairStyle: "Cabelo", HairColor: "Cor do cabelo",
  Mouth: "Boca", FacialHair: "Barba", FacialDetails: "Detalhes do rosto", FacialDetailsIntensity: "Intensidade dos detalhes",
  EyeballColor: "Cor dos olhos", UpperEyeLidRestingPosition: "Pálpebra superior", LowerEyeLidRestingPosition: "Pálpebra inferior",
  PupilDilation: "Dilatação da pupila", EyebrowScale: "Tamanho das sobrancelhas", EyebrowThickness: "Espessura das sobrancelhas",
  EyebrowRestingHeight: "Altura das sobrancelhas", EyebrowRestingAngle: "Ângulo das sobrancelhas",
  Top: "Camisola", TopColor: "Cor da camisola", Bottom: "Calças", BottomColor: "Cor das calças",
  Shoes: "Sapatos", ShoesColor: "Cor dos sapatos", Headwear: "Chapéu", HeadwearColor: "Cor do chapéu",
  Eyewear: "Óculos", EyewearColor: "Cor dos óculos", Tattoos: "Tatuagens",
  HairStyleId: "Cabelo", FaceId: "Rosto", FacialHairId: "Barba", FacialDetailId: "Detalhes do rosto",
  FacialDetailIntensity: "Intensidade dos detalhes", UpperEyelidPosition: "Pálpebra superior",
  LowerEyelidPosition: "Pálpebra inferior", EyebrowHeight: "Altura das sobrancelhas", EyebrowAngle: "Ângulo das sobrancelhas",
  AdditionalAvatarObjects: "Tatuagens e extras",
};
const SLOT_LBL = {
  Contents: "Conteúdo", Input: "Entrada", Output: "Saída", InputContents: "Entrada", OutputContents: "Saída",
  ProductContents: "Produto", MixerContents: "Misturador", Ingredients: "Ingredientes", Liquid: "Líquido",
  OverflowItems: "Transbordo", Items: "Itens",
};
const AUTO_SKIP = new Set(["DataType", "DataVersion", "GameVersion", "LoadOrder", "GridGUID", "GUID", "OriginCoordinate",
  "ItemString", "Rotation", "ParentSurfaceGUID", "RelativePosition", "RelativeRotation", "FootprintMatches", "SlotFilters",
  "ActiveMushroomAlignmentIndices", "ActiveBuds", "AppliedAdditives", "Tattoos", "AdditionalAvatarObjects"]);
const PROGRESS_KEYS = /^(GrowthProgress|LiquidLevel|Quality|Weight|FacialDetailsIntensity|FacialDetailIntensity|UpperEyeLidRestingPosition|LowerEyeLidRestingPosition|UpperEyelidPosition|LowerEyelidPosition|PupilDilation)$/;
const ID_KEYS = /(SeedID|SoilID|IngredientID|ProductID|SpawnID|RecipeID)$/;

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const to255 = (x) => Math.round(clamp01(Number(x) || 0) * 255);
function colorField(c, save) {
  const hex = "#" + [c.r, c.g, c.b].map((v) => to255(v).toString(16).padStart(2, "0")).join("");
  const inp = h("input", { type: "color", value: hex, style: "height:36px;padding:2px" });
  inp.onchange = () => {
    const v = inp.value;
    setFloat(c, "r", parseInt(v.slice(1, 3), 16) / 255);
    setFloat(c, "g", parseInt(v.slice(3, 5), 16) / 255);
    setFloat(c, "b", parseInt(v.slice(5, 7), 16) / 255);
    if ("a" in c && Number(c.a) === 0) setFloat(c, "a", 1);
    save();
  };
  return inp;
}
function roChips(arr) {
  if (!arr.length) return h("span", { class: "muted", style: "font-size:13px" }, "nenhum");
  return h("div", { class: "fx" }, arr.map((x) => h("span", { class: "tag" },
    typeof x === "string" ? x.split("/").pop() : x && typeof x === "object" ? (x.Id || x.Name || stringify(x, false).slice(0, 40)) : String(x))));
}
function autoFields(obj, save, opts = {}) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (AUTO_SKIP.has(k)) continue;
    const label = LBL[k] || k;
    if (v && typeof v === "object" && Array.isArray(v.Items)) continue;
    if (Array.isArray(v)) { out.push(fld(label, roChips(v))); continue; }
    if (v && typeof v === "object" && "r" in v && "g" in v && "b" in v) { out.push(fld(label, colorField(v, save))); continue; }
    if (v && typeof v === "object") { out.push(...autoFields(v, save, opts)); continue; }
    if (typeof v === "boolean") { out.push(fld(label, check(obj, k, "sim", { after: save }))); continue; }
    if (typeof v === "number") {
      if (k === "Gender") {
        const s = h("select", null, h("option", { value: 0 }, "Masculino"), h("option", { value: 1 }, "Feminino"));
        s.value = v;
        s.onchange = () => { obj[k] = Number(s.value); save(); };
        out.push(fld(label, s));
        continue;
      }
      let ctrl;
      if (PROGRESS_KEYS.test(k) && v >= 0 && v <= 1) ctrl = slider(obj, k, 0, 1, 0.01, 2, { after: save, label });
      else {
        const f = isFloat(obj, k);
        ctrl = num(obj, k, { float: f, step: f ? 0.01 : 1, after: save });
        if (f) ctrl.value = String(Number(v.toFixed(3)));
      }
      out.push(fld(label, ctrl));
      continue;
    }
    if (typeof v === "string") out.push(fld(label, text(obj, k, { after: save, mono: true, list: ID_KEYS.test(k) ? "dl-items" : opts.list })));
  }
  return out;
}
function slotGroups(base, onSave) {
  const groups = [];
  for (const [k, v] of Object.entries(base)) {
    if (!v || typeof v !== "object" || !Array.isArray(v.Items)) continue;
    groups.push(h("div", { class: "fld", style: "margin-bottom:12px" },
      h("span", null, SLOT_LBL[k] || k), slotsEditor(v.Items, onSave)));
  }
  return groups;
}

// ================= Produção =================
function stationSummary(base) {
  const bits = [];
  const pd = base.PlantData, sc = base.ShroomColonyData;
  if (pd) bits.push(pd.SeedID ? pd.SeedID + ", " + Math.round(pd.GrowthProgress * 100) + "%" : "vazio");
  if (sc) bits.push(sc.MushroomSpawnID ? sc.MushroomSpawnID + ", " + Math.round(sc.GrowthProgress * 100) + "%" : "vazio");
  if (base.CurrentRecipeID) bits.push("receita " + base.CurrentRecipeID);
  if (base.CurrentIngredientID) bits.push(base.CurrentIngredientID + " no forno");
  if (base.CurrentMixOperation?.ProductID) bits.push("a misturar " + base.CurrentMixOperation.ProductID);
  if (Array.isArray(base.DryingOperations) && base.DryingOperations.length) bits.push(base.DryingOperations.length + " a secar");
  let used = 0, total = 0;
  for (const v of Object.values(base)) if (v && typeof v === "object" && Array.isArray(v.Items)) {
    total += v.Items.length;
    for (const s of v.Items) { try { if (parseJSON(s).ID) used++; } catch (e) {} }
  }
  if (total) bits.push(used + "/" + total + " slots");
  return bits.join(" · ");
}
function viewProducao() {
  const out = [viewHead("Produção", "Vasos, camas de cogumelos, secadores, fornos e estações de mistura, química, embalagem e prensa.")];
  const found = [];
  for (const path of propertyPaths()) {
    const d = safeJ(path);
    if (!d) continue;
    const list = (d.Objects || []).filter((o) => STATIONS[o.DataType]);
    if (list.length) found.push([path, list]);
  }
  if (!found.length) return [...out, h("p", { class: "muted" }, "Não há estações de produção colocadas neste save.")];
  const types = new Set();
  found.forEach(([, l]) => l.forEach((o) => types.add(o.DataType)));
  const tSel = h("select", { "aria-label": "Tipo de estação" }, h("option", { value: "all" }, "Todos os tipos"),
    [...types].sort().map((t) => h("option", { value: t }, STATIONS[t])));
  tSel.value = S.stationFilter || "all";
  tSel.onchange = () => { S.stationFilter = tSel.value; render(); };
  out.push(h("div", { class: "toolbar" }, tSel,
    h("button", { class: "btn small", onClick: () => {
      let c = 0;
      for (const [path, list] of found) for (const o of list) {
        let base;
        try { base = parseJSON(o.BaseData); } catch (e) { continue; }
        const pd = base.PlantData, sc = base.ShroomColonyData;
        let hit = false;
        if (pd && pd.SeedID && pd.GrowthProgress < 1) { setFloat(pd, "GrowthProgress", 1); hit = true; }
        if (sc && sc.MushroomSpawnID && sc.GrowthProgress < 1) { setFloat(sc, "GrowthProgress", 1); hit = true; }
        if (hit) { o.BaseData = stringify(base, false); mark(path); c++; }
      }
      refreshChrome(); render();
      toast(c ? c + " culturas prontas a colher." : "Não havia nada a crescer.");
    } }, "Crescimento a 100% em tudo"),
    h("span", { class: "muted", style: "font-size:13px" }, "As plantas ganham botões durante o crescimento; se a planta era nova, pode não haver nada para colher.")));

  for (const [path, list] of found) {
    const shown = list.filter((o) => (S.stationFilter || "all") === "all" || o.DataType === S.stationFilter);
    if (!shown.length) continue;
    const name = path.split("/").pop().replace(/\.json$/, "");
    const items = shown.map((o) => {
      let base;
      try { base = parseJSON(o.BaseData); } catch (e) { return null; }
      const save = () => { o.BaseData = stringify(base, false); touch(path); sum.textContent = stationSummary(base); };
      const sum = h("span", { class: "muted", style: "font-size:13px" }, stationSummary(base));
      const det = h("details", { class: "store" }, h("summary", null, h("b", null, STATIONS[o.DataType]), sum));
      let built = false;
      det.ontoggle = () => {
        if (!det.open || built) return;
        built = true;
        const body = h("div", { style: "padding:2px 18px 16px 30px;display:grid;gap:10px" },
          slotGroups(base, save),
          h("div", { class: "grid" }, autoFields(base, save)),
          base.AppliedAdditives?.length ? h("div", { class: "fld" }, h("span", null, "Aditivos aplicados"), roChips(base.AppliedAdditives)) : null,
          base.PlantData?.ActiveBuds ? h("small", { class: "muted" }, base.PlantData.ActiveBuds.length + " botões prontos na planta") : null);
        det.append(body);
      };
      return det;
    }).filter(Boolean);
    out.push(h("section", { class: "panel flat" },
      h("header", null, h("h3", null, name), h("span", { class: "tag" }, shown.length + " estações")),
      h("div", { class: "body" }, items)));
  }
  return out;
}

function collapsibleSlots(label, items, onSave) {
  const sum = h("span", { class: "tag" }, slotSummary(items));
  const det = h("details", { class: "store", style: "border:1px solid var(--line);border-radius:8px" },
    h("summary", null, h("b", null, label), sum));
  let built = false;
  det.ontoggle = () => {
    if (!det.open || built) return;
    built = true;
    det.append(slotsEditor(items, () => { sum.textContent = slotSummary(items); onSave(); }));
  };
  return det;
}

// ================= Clientes especiais (0.4.7) =================
const GROUPS = { businessmen: "Empresários", hippies: "Hippies", partybus: "Party bus", bikers: "Motards", rockband: "Banda rock" };
function specialCustomersPanel() {
  const path = "SpecialCustomers.json";
  const SC = safeJ(path);
  if (!SC) return null;
  const save = () => touch(path);
  const groups = (SC.GroupData || []).map((g) => {
    const items = g.GroupInventory?.Items;
    const body = Array.isArray(items) && items.length
      ? collapsibleSlots("Inventário do grupo", items, save)
      : h("span", { class: "muted", style: "font-size:13px" }, "sem inventário guardado");
    return h("tr", null,
      h("td", { class: "name" }, GROUPS[g.GroupId] || titleCase(g.GroupId)),
      h("td", null, (() => { const n = num(g, "VisitCount", { min: 0, path }); n.style.width = "90px"; return n; })()),
      h("td", null, (() => { const n = num(g, "DaySinceLastVisit", { min: 0, path }); n.style.width = "90px"; return n; })()),
      h("td", null, body));
  });
  const cur = h("select", { style: "width:auto" }, h("option", { value: "" }, "ninguém na cidade"),
    (SC.GroupData || []).map((g) => h("option", { value: g.GroupId }, GROUPS[g.GroupId] || titleCase(g.GroupId))));
  cur.value = SC.GroupId || "";
  cur.onchange = () => { SC.GroupId = cur.value; save(); };
  return h("section", { class: "panel flat" },
    h("header", null, h("h3", null, "Clientes especiais"), h("span", { class: "tag" }, (SC.GroupData || []).length + " grupos")),
    h("div", { class: "body" },
      h("div", { class: "grid", style: "margin-bottom:14px" },
        fld("Grupo em visita", cur),
        "Phase" in SC ? fld("Fase", num(SC, "Phase", { min: 0, path })) : null,
        "DaysLeftInPhase" in SC ? fld("Dias que faltam na fase", num(SC, "DaysLeftInPhase", { min: 0, path })) : null,
        "RunningBudget" in SC ? fld("Orçamento do grupo", num(SC, "RunningBudget", { float: isFloat(SC, "RunningBudget"), min: 0, path })) : null,
        "ChanceToAppear" in SC ? fld("Hipótese de aparecerem", slider(SC, "ChanceToAppear", 0, 1, 0.01, 2, { path, label: "Hipótese de aparecerem" })) : null),
      Array.isArray(SC.DesiredEffects) && SC.DesiredEffects.length
        ? h("div", { class: "fld", style: "margin-bottom:14px" }, h("span", null, "Efeitos que procuram"), roChips(SC.DesiredEffects)) : null),
    h("div", { class: "table-wrap" }, h("table", null,
      h("thead", null, h("tr", null, ["Grupo", "Visitas", "Dias desde a última", "Inventário"].map((t) => h("th", null, t)))),
      h("tbody", null, groups))));
}

// ================= Dealers =================
function viewDealers() {
  const out = [viewHead("Dealers", "Quem trabalha para ti, quanto dinheiro tem consigo e que clientes atende.")];
  const models = npcModels();
  if (!models) return [...out, missing("NPCs.json")];
  const P = "NPCs.json";
  const dealers = models.filter((m) => m.kind === "dealer" && m.base.ID !== "carteldealer");
  if (!dealers.length) return [...out, h("p", { class: "muted" }, "Ainda não tens dealers recrutados.")];
  const customers = models.filter((m) => m.ad.CustomerData).map((m) => m.base.ID);
  const assignedTo = new Map();
  for (const d of dealers) for (const cid of d.base.AssignedCustomerIDs || []) assignedTo.set(cid, d.base.ID);

  for (const d of dealers) {
    const save = () => { d.saveBase(); touch(P); };
    const ids = d.base.AssignedCustomerIDs || (d.base.AssignedCustomerIDs = []);
    const chips = h("div", { class: "fx" });
    const drawChips = () => chips.replaceChildren(...(ids.length ? ids.map((cid) => h("span", { class: "tag" }, titleCase(cid), " ",
      h("button", { class: "icon-btn", style: "padding:0 4px", title: "Remover cliente", "aria-label": "Remover " + titleCase(cid), onClick: () => {
        ids.splice(ids.indexOf(cid), 1); save(); render();
      } }, "×"))) : [h("span", { class: "muted", style: "font-size:13px" }, "sem clientes atribuídos")]));
    drawChips();
    const free = customers.filter((c) => !assignedTo.has(c)).sort();
    const sel = h("select", { style: "width:auto", "aria-label": "Adicionar cliente a " + titleCase(d.base.ID) },
      h("option", { value: "" }, free.length ? "Adicionar cliente…" : "Sem clientes livres"), free.map((c) => h("option", { value: c }, titleCase(c))));
    sel.onchange = () => {
      const c = sel.value;
      if (!c) return;
      for (const other of dealers) {
        const oi = other.base.AssignedCustomerIDs || [];
        const at = oi.indexOf(c);
        if (at >= 0) { oi.splice(at, 1); other.saveBase(); }
      }
      ids.push(c);
      save(); render();
    };
    const inv = (d.n.AdditionalDatas || []).find((a) => a.Name === "Inventory");
    let invNode = null;
    if (inv) {
      try {
        const io = parseJSON(inv.Contents);
        const pretty = inv.Contents.includes("\n");
        if (Array.isArray(io.Items)) invNode = collapsibleSlots("Bolsos", io.Items, () => { inv.Contents = stringify(io, pretty); touch(P); });
      } catch (e) { /* ignora */ }
    }
    const over = d.base.OverflowItems?.Items;
    out.push(h("section", { class: "panel" },
      h("header", null, h("h3", null, titleCase(d.base.ID)),
        h("span", { class: "tag" }, ids.length + " clientes"),
        ids.includes("mick_lubbin") ? h("span", { class: "tag warn", title: "O Mick atende a loja de penhores e desaparece de lá quando anda a fazer entregas" }, "tem o Mick") : null,
        h("span", { class: "sp" }),
        "Recruited" in d.base ? check(d.base, "Recruited", "Recrutado", { after: save }) : null),
      h("div", { class: "body", style: "display:grid;gap:14px" },
        h("div", { class: "grid" },
          "Cash" in d.base ? fld("Dinheiro consigo", num(d.base, "Cash", { float: true, min: 0, after: save })) : null,
          d.ad.Relationship ? fld("Relação", slider(d.ad.Relationship.o, "RelationDelta", 0, 5, 0.1, 1, { after: () => { d.saveAd("Relationship"); touch(P); }, label: "Relação com " + titleCase(d.base.ID) })) : null,
          Array.isArray(d.base.ActiveContractGUIDs) ? fld("Contratos ativos", h("input", { type: "text", value: d.base.ActiveContractGUIDs.length, readonly: true, disabled: true })) : null),
        h("div", { class: "fld" }, h("span", null, "Clientes atribuídos"), chips, h("div", { class: "row", style: "margin-top:6px" }, sel)),
        Array.isArray(over) ? collapsibleSlots("Transbordo", over, save) : null,
        invNode)));
  }
  out.push(h("p", { class: "note" }, "Cada cliente só pode estar num dealer: ao atribuíres, ele sai automaticamente da lista dos outros. Se o Mick Lubbin estiver atribuído a alguém, sai da loja de penhores para fazer negócios."));
  return out;
}

// ================= Aparência e roupa (dentro de Jogadores) =================
function avatarObjectsEditor(arr, save) {
  const wrap = h("div", { style: "display:grid;gap:8px" });
  const draw = () => {
    const rows = arr.map((o, i) => {
      const colors = (o.Colors || []).map((c) => c && c.Value ? h("label", { class: "check" },
        h("span", { class: "muted", style: "font-size:12.5px" }, c.PropertyId || "Cor"), colorField(c.Value, save)) : null);
      return h("div", { class: "row" },
        (() => { const t = text(o, "Id", { after: save, mono: true }); t.style.width = "200px"; return t; })(),
        colors,
        h("button", { class: "icon-btn", title: "Remover", "aria-label": "Remover " + (o.Id || "objeto"), onClick: () => { arr.splice(i, 1); save(); draw(); } }, "×"));
    });
    const novo = h("input", { type: "text", class: "mono", placeholder: "id novo, ex. teardrop", style: "width:200px", "aria-label": "Id do objeto novo" });
    rows.push(h("div", { class: "row" }, novo, h("button", { class: "btn small", onClick: () => {
      const id = novo.value.trim();
      if (!id) return;
      const col = { PropertyId: "MainColor", Value: { r: 1, g: 1, b: 1, a: 1 } };
      for (const k of ["r", "g", "b", "a"]) setFloat(col.Value, k, 1);
      arr.push({ Id: id, Colors: [col] });
      save(); draw();
    } }, "Adicionar")));
    wrap.replaceChildren(...rows);
  };
  draw();
  return wrap;
}

// ================= conversão do formato da aparência (0.4.6 <-> 0.4.7) =================
const APMAP_KEY = "s1-editor:mapa-avatar";
const APSNAP_KEY = "s1-editor:aparencia";
const apFormat = (ap) => (ap && "HairStyleId" in ap ? "novo" : ap && "HairStyle" in ap ? "antigo" : null);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lastSeg = (p) => String(p || "").split("/").pop();

function learnedMap() { try { return JSON.parse(localStorage.getItem(APMAP_KEY)) || {}; } catch (e) { return {}; } }
function learnPaths(ap) {
  if (apFormat(ap) !== "antigo") return;
  const m = learnedMap();
  const add = (p, kind) => { if (p) m[pathToId(p, kind)] = p; };
  add(ap.HairStyle, "hair"); add(ap.Mouth, "face"); add(ap.FacialHair, "facialhair"); add(ap.FacialDetails, "detail");
  for (const t of ap.Tattoos || []) add(t, "tattoo");
  try { localStorage.setItem(APMAP_KEY, JSON.stringify(m)); } catch (e) {}
}
function pathToId(p, kind) {
  if (!p) return "";
  let s = lastSeg(p);
  if (kind === "face") s = s.replace(/^Face_(.+)$/, "$1face");
  else if (kind === "facialhair") s = s.replace(/^FacialHair_/, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
const TATTOO_GROUPS = [["leftarm", "LeftArm"], ["rightarm", "RightArm"], ["leftleg", "LeftLeg"], ["rightleg", "RightLeg"],
  ["chest", "Chest"], ["back", "Back"], ["stomach", "Stomach"], ["neck", "Neck"], ["face", "Face"], ["head", "Face"]];
function idToPath(id, kind) {
  if (!id) return { path: "", sure: true };
  const known = learnedMap()[id];
  if (known) return { path: known, sure: true };
  if (kind === "hair") return { path: "Avatar/Hair/" + cap(id) + "/" + cap(id), sure: false };
  if (kind === "face") return { path: "Avatar/Layers/Face/Face_" + cap(id.replace(/face$/, "")), sure: false };
  if (kind === "facialhair") return { path: "Avatar/Layers/Face/FacialHair_" + cap(id), sure: false };
  if (kind === "detail") return { path: "Avatar/Layers/Face/" + cap(id), sure: false };
  for (const [pre, folder] of TATTOO_GROUPS) if (id.startsWith(pre) && id.length > pre.length) {
    return { path: "Avatar/Layers/Tattoos/" + folder + "/" + folder + "_" + cap(id.slice(pre.length)), sure: false };
  }
  return { path: "Avatar/Layers/Tattoos/Face/Face_" + cap(id), sure: false };
}
function white(a) {
  const c = {};
  for (const k of ["r", "g", "b"]) setFloat(c, k, 1);
  setFloat(c, "a", a == null ? 1 : a);
  return c;
}
function cp(dst, dk, src, sk, fallback) {
  if (!(sk in src)) { if (fallback !== undefined) setFloat(dst, dk, fallback); return; }
  const v = src[sk];
  if (typeof v === "number" && isFloat(src, sk)) setFloat(dst, dk, v);
  else dst[dk] = v;
}
function apToNew(o) {
  const n = {};
  cp(n, "Gender", o, "Gender");
  cp(n, "Weight", o, "Weight", 0.5);
  n.SkinColor = o.SkinColor || white();
  n.HairStyleId = pathToId(o.HairStyle, "hair");
  n.HairColor = o.HairColor || white();
  n.FaceId = pathToId(o.Mouth, "face");
  n.FacialHairId = pathToId(o.FacialHair, "facialhair");
  n.FacialDetailId = pathToId(o.FacialDetails, "detail");
  cp(n, "FacialDetailIntensity", o, "FacialDetailsIntensity", 1);
  n.EyeballColor = o.EyeballColor || white();
  cp(n, "PupilDilation", o, "PupilDilation", 1);
  cp(n, "UpperEyelidPosition", o, "UpperEyeLidRestingPosition", 0);
  cp(n, "LowerEyelidPosition", o, "LowerEyeLidRestingPosition", 0);
  cp(n, "EyebrowScale", o, "EyebrowScale", 1);
  cp(n, "EyebrowThickness", o, "EyebrowThickness", 1);
  cp(n, "EyebrowHeight", o, "EyebrowRestingHeight", 0);
  cp(n, "EyebrowAngle", o, "EyebrowRestingAngle", 0);
  n.AdditionalAvatarObjects = (o.Tattoos || []).map((t) => ({ Id: pathToId(t, "tattoo"), Colors: [{ PropertyId: "MainColor", Value: white() }] }));
  return { ap: n, guesses: [], lost: ["roupa vestida (Top, Bottom, Shoes, Headwear, Eyewear e as cores)"] };
}
function apToOld(n) {
  const o = {};
  const guesses = [];
  const conv = (id, kind) => { const r = idToPath(id, kind); if (id && !r.sure) guesses.push(id + " → " + r.path); return r.path; };
  cp(o, "Gender", n, "Gender");
  cp(o, "Weight", n, "Weight", 0.5);
  o.SkinColor = n.SkinColor || white();
  o.HairStyle = conv(n.HairStyleId, "hair");
  o.HairColor = n.HairColor || white();
  o.Mouth = conv(n.FaceId, "face");
  o.FacialHair = conv(n.FacialHairId, "facialhair");
  o.FacialDetails = conv(n.FacialDetailId, "detail");
  cp(o, "FacialDetailsIntensity", n, "FacialDetailIntensity", 1);
  o.EyeballColor = n.EyeballColor || white();
  cp(o, "UpperEyeLidRestingPosition", n, "UpperEyelidPosition", 0);
  cp(o, "LowerEyeLidRestingPosition", n, "LowerEyelidPosition", 0);
  cp(o, "PupilDilation", n, "PupilDilation", 1);
  cp(o, "EyebrowScale", n, "EyebrowScale", 1);
  cp(o, "EyebrowThickness", n, "EyebrowThickness", 1);
  cp(o, "EyebrowRestingHeight", n, "EyebrowHeight", 0);
  cp(o, "EyebrowRestingAngle", n, "EyebrowAngle", 0);
  for (const [item, color] of [["Top", "TopColor"], ["Bottom", "BottomColor"], ["Shoes", "ShoesColor"], ["Headwear", "HeadwearColor"], ["Eyewear", "EyewearColor"]]) {
    o[item] = "";
    o[color] = white();
  }
  o.Tattoos = (n.AdditionalAvatarObjects || []).map((x) => conv(x.Id, "tattoo")).filter(Boolean);
  return { ap: o, guesses, lost: ["as cores individuais de cada tatuagem"] };
}
const snapKey = (dir, fmt) => APSNAP_KEY + ":" + S.name + ":" + dir + ":" + fmt;
function getSnap(dir, fmt) { try { return localStorage.getItem(snapKey(dir, fmt)); } catch (e) { return null; } }
function putSnap(dir, fmt, txt) { try { localStorage.setItem(snapKey(dir, fmt), txt); } catch (e) {} }

function convertDialog(dir) {
  const path = "Players/" + dir + "/Appearance.json";
  const e = E(path);
  const ap = J(path);
  const from = apFormat(ap);
  if (!from) { toast("Não reconheço o formato desta aparência."); return; }
  const to = from === "novo" ? "antigo" : "novo";
  const snap = getSnap(dir, to);
  const res = from === "novo" ? apToOld(ap) : apToNew(ap);
  const body = [
    h("p", { style: "margin:0" }, "Vais passar do formato ", h("b", null, from === "novo" ? "novo (0.4.7)" : "antigo (0.4.6)"),
      " para o ", h("b", null, to === "novo" ? "novo (0.4.7)" : "antigo (0.4.6)"), "."),
    snap ? h("p", { class: "note", style: "margin:0" }, "Há uma cópia deste jogador nesse formato, guardada por mim antes da conversão anterior. Vou usá-la, portanto a reposição é exata.")
      : h("p", { class: "note", style: "margin:0" }, "Não tenho nenhuma cópia neste formato, por isso vou traduzir campo a campo."),
    !snap && res.guesses.length ? h("div", { class: "fld" }, h("span", null, "Valores que tive de adivinhar"),
      h("div", { style: "display:grid;gap:2px" }, res.guesses.map((g) => h("span", { class: "mono", style: "font-size:12px" }, g)))) : null,
    !snap && res.lost.length ? h("div", { class: "fld" }, h("span", null, "O que se perde"), h("div", { style: "display:grid;gap:2px" }, res.lost.map((l) => h("small", { class: "muted" }, l)))) : null,
    h("small", { class: "muted" }, "A tabela de correspondência entre ids e caminhos foi deduzida dos nomes, não é oficial. O caminho seguro continua a ser guardares o .zip original antes de experimentares a beta."),
  ];
  const m = modal("Converter aparência", body, [
    h("button", { class: "btn", onClick: () => m.remove() }, "Cancelar"),
    snap ? h("button", { class: "btn", onClick: () => { m.remove(); applyConvert(dir, res.ap, from, false); } }, "Converter sem usar a cópia") : null,
    h("button", { class: "btn primary", onClick: () => { m.remove(); applyConvert(dir, snap ? parseJSON(snap) : res.ap, from, !!snap); } }, snap ? "Repor a partir da cópia" : "Converter"),
  ]);
}
function applyConvert(dir, data, fromFmt, usedSnap) {
  const path = "Players/" + dir + "/Appearance.json";
  const e = E(path);
  putSnap(dir, fromFmt, stringify(e.data || parseJSON(e.text), false));
  e.data = data;
  e.dirty = true;
  refreshChrome();
  render();
  toast(usedSnap ? "Aparência reposta a partir da cópia guardada." : "Aparência convertida.");
}

function appearancePanels(dir) {
  const out = [];
  const aPath = "Players/" + dir + "/Appearance.json";
  const ap = safeJ(aPath);
  if (ap) {
    const strings = new Set();
    for (const d of playerDirs()) {
      const x = safeJ("Players/" + d + "/Appearance.json");
      if (!x) continue;
      for (const v of Object.values(x)) if (typeof v === "string" && v) strings.add(v);
    }
    const dl = $("dl-avatar");
    dl.replaceChildren(...[...strings].sort().map((v) => h("option", { value: v })));
    learnPaths(ap);
    const fmt = apFormat(ap);
    const head = fmt ? h("div", { class: "row" },
      h("span", { class: "tag" + (fmt === "novo" ? " ok" : "") }, fmt === "novo" ? "Formato novo (0.4.7)" : "Formato antigo (0.4.6)"),
      h("button", { class: "btn small", onClick: () => convertDialog(dir) },
        fmt === "novo" ? "Converter para o formato antigo" : "Converter para o formato novo")) : null;
    out.push(panel("Aparência", [
      h("div", { class: "grid" }, autoFields(ap, () => touch(aPath), { list: "dl-avatar" })),
      Array.isArray(ap.Tattoos) ? h("div", { class: "fld", style: "margin-top:14px" }, h("span", null, "Tatuagens"), roChips(ap.Tattoos)) : null,
      Array.isArray(ap.AdditionalAvatarObjects) ? h("div", { class: "fld", style: "margin-top:14px" },
        h("span", null, "Tatuagens e extras"), avatarObjectsEditor(ap.AdditionalAvatarObjects, () => touch(aPath))) : null,
      h("p", { class: "note" }, ap.HairStyleId != null
        ? "Formato novo da versão 0.4.7: o cabelo, o rosto e a barba são ids curtos (afro, goatee), e as tatuagens e extras vivem na lista em baixo."
        : "Formato antigo: os caminhos (Avatar/Layers/…) têm de existir no jogo; as sugestões mostram os que já aparecem neste save."),
    ], { extra: head }));
  }
  const cPath = "Players/" + dir + "/Clothing.json";
  const cl = safeJ(cPath);
  if (cl && Array.isArray(cl.Items)) {
    out.push(panel("Roupa vestida", [slotsEditor(cl.Items, () => touch(cPath)),
      h("p", { class: "note" }, "A coluna do meio é o índice de cor da peça, tal como o jogo o guarda.")]));
  }
  return out;
}

// ================= Procurar =================
function viewProcurar() {
  const out = [viewHead("Procurar", "Procura texto em todos os ficheiros do save, incluindo o JSON aninhado dentro de strings.")];
  const inp = h("input", { type: "search", class: "grow", placeholder: "ID de item, nome, GUID, número…", value: S.search || "", "aria-label": "Texto a procurar" });
  const results = h("div");
  const runSearch = () => {
    const q = inp.value.trim();
    S.search = q;
    if (q.length < 2) { results.replaceChildren(h("p", { class: "muted" }, "Escreve pelo menos dois caracteres.")); return; }
    const needle = q.toLowerCase();
    const blocks = [];
    let total = 0;
    for (const path of jsonPaths()) {
      const e = E(path);
      const txt = outText(e);
      const low = txt.toLowerCase();
      const hits = [];
      let at = low.indexOf(needle);
      while (at >= 0 && hits.length < 6) { hits.push(at); at = low.indexOf(needle, at + needle.length); }
      if (!hits.length) continue;
      let count = hits.length;
      if (count === 6) { let more = low.indexOf(needle, hits[5] + needle.length); while (more >= 0 && count < 500) { count++; more = low.indexOf(needle, more + needle.length); } }
      total += count;
      blocks.push(h("div", { class: "diff-file" },
        h("h4", null, path, h("span", { class: "tag" }, count === 500 ? "500+" : count), h("span", { style: "flex:1" }),
          h("button", { class: "btn small ghost", onClick: () => { S.rawPath = path; S.rawSelect = [hits[0], hits[0] + q.length]; go("ficheiros"); } }, "Abrir no editor")),
        hits.map((i) => h("div", { class: "diff-row", style: "grid-template-columns:1fr" },
          h("span", { class: "path" },
            "…" + txt.slice(Math.max(0, i - 70), i).replace(/\s+/g, " "),
            h("mark", null, txt.substr(i, q.length)),
            txt.slice(i + q.length, i + q.length + 70).replace(/\s+/g, " ") + "…")))));
    }
    results.replaceChildren(
      h("p", { class: "muted" }, total ? total + " ocorrências em " + blocks.length + " ficheiros" : "Nada encontrado."),
      blocks.length ? h("section", { class: "panel flat" }, h("div", { class: "body" }, blocks)) : null);
  };
  inp.onchange = runSearch;
  const btn = h("button", { class: "btn small primary", onClick: runSearch }, "Procurar");
  out.push(h("div", { class: "toolbar" }, inp, btn), results);
  queueMicrotask(() => { inp.focus(); if (S.search) runSearch(); });
  return out;
}
