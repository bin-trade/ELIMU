// app.js — Professeur
// Lecture seule stricte. Le professeur peut consulter les paiements détaillés
// des élèves de ses classes, sans recevoir les coordonnées des parents.

const App = {
  state: { classes: [], eleves: [], salaires: [], schoolConfig: {}, professeur: null, professeurCode: "", route: "classes", seuil: 0, filtre: "insolvables", recouvrementClasse: "", recouvrementRecherche: "" },

  async init() {
    if (sessionStorage.getItem("elimu_professor_portal_unlocked") !== "1") return;
    document.getElementById("professor-gate")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
    document.getElementById("tabbar")?.classList.remove("hidden");
    window.addEventListener("hashchange", () => this.render());
    window.addEventListener("online", () => this.refreshStatusPill());
    window.addEventListener("offline", () => this.refreshStatusPill());
    document.addEventListener("click", (e) => { if (e.target.closest(".btn-sync")) this.syncNow(); });
    this.render();
    if (navigator.onLine) await this.syncNow(true);
    setInterval(() => { this.refreshStatusPill(); if (navigator.onLine) this.syncNow(true); }, 60000);
    window.addEventListener("online", () => this.syncNow(true));
    document.addEventListener("visibilitychange", () => { if (!document.hidden && navigator.onLine) this.syncNow(true); });
  },

  unlockPortal() {
    const input = document.getElementById("portal-access-code");
    const error = document.getElementById("portal-access-error");
    if ((input?.value || "").trim() !== "0000") {
      error?.classList.remove("hidden");
      if (input) { input.value = ""; input.focus(); }
      return;
    }
    sessionStorage.setItem("elimu_professor_portal_unlocked", "1");
    window.location.reload();
  },

  applyBranding() {
    const cfg = this.state.schoolConfig || {};
    const name = cfg.school_name || "Établissement scolaire";
    document.title = name + " — Espace professeur";
    const title = document.getElementById("school-name");
    if (title) title.textContent = name;
    document.documentElement.style.setProperty("--primary", cfg.primary_color || "#1a3d7c");
    document.documentElement.style.setProperty("--secondary", cfg.secondary_color || "#c99a2e");
  },

  async refreshSession(silent) {
    try {
      if (!this.state.professeurCode) return;
      const result = await ELIMU_Api.professorProfile(this.state.professeurCode);
      this.state.professeur = result.professeur;
      this.state.salaires = result.salaires || [];
      this.render();
    } catch (e) { if (!silent) this.toast(e.message); }
  },

  async login() {
    const btn = document.getElementById("prof-login-btn");
    if (btn) { btn.disabled = true; btn.classList.add("is-loading"); btn.querySelector(".button-label").textContent = "Connexion en cours…"; }
    try {
      const code = val("prof-code");
      if (!code) throw new Error("Code professeur requis");
      if (!ELIMU_Api.isOnline()) throw new Error("La consultation du salaire nécessite Internet");
      const result = await ELIMU_Api.professorProfile(code);
      this.state.professeur = result.professeur;
      this.state.professeurCode = code;
      this.state.salaires = result.salaires || [];
      this.state.classes = (result.classes || this.state.classes).map((c) => Object.assign({}, c, { active: true }));
      this.state.schoolConfig = Object.assign({}, result.etablissement || {}, { school_year: result.anneeScolaire || (result.etablissement || {}).school_year || "" });
      this.render();
    } catch (e) {
      const box = document.getElementById("prof-login-error");
      if (box) box.textContent = e.message;
    } finally {
      if (document.getElementById("prof-login-btn") === btn) { btn.disabled = false; btn.classList.remove("is-loading"); btn.querySelector(".button-label").textContent = "Afficher mon salaire"; }
    }
  },

  logout() { this.state.professeur = null; this.state.professeurCode = ""; this.state.salaires = []; this.render(); },
  async syncNow(silent) {
    const btns = document.querySelectorAll(".btn-sync");
    btns.forEach((b) => (b.disabled = true));
    try {
      const result = await ELIMU_Api.publicClasses();
      this.state.classes = (result.classes || []).map((c) => Object.assign({}, c, { active: true }));
      this.state.schoolConfig = Object.assign({}, result.etablissement || {}, { school_year: result.anneeScolaire || (result.etablissement || {}).school_year || "" });
      if (this.state.professeurCode) {
        const profile = await ELIMU_Api.professorProfile(this.state.professeurCode);
        this.state.professeur = profile.professeur;
        this.state.salaires = profile.salaires || [];
      }
      this.render();
      if (!silent) this.toast("Données actualisées");
    } catch (e) {
      if (!silent) this.toast("Hors connexion ou erreur");
    } finally {
      btns.forEach((b) => (b.disabled = false));
      this.refreshStatusPill();
    }
  },

  refreshStatusPill() {
    const pill = document.getElementById("status-pill");
    if (!pill) return;
    pill.className = "status-pill " + (navigator.onLine ? "online" : "offline");
    pill.textContent = navigator.onLine ? "En ligne" : "Connexion requise";
    pill.title = navigator.onLine ? "Consultation en ligne" : "Internet est requis";
  },

  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  },

  escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  },

  fmt(n, currency = "USD") { return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency; },
  dateFmt(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value || "");
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  },

  activeClasses() { return this.state.classes.filter((c) => c.active === true || c.active === 1 || c.active === "1" || c.active === "TRUE" || c.active === "VRAI"); },
  classGroups() {
    const order = ["MATERNELLE", "PRIMAIRE", "SECONDAIRE"];
    const classes = this.activeClasses();
    const categoryName = (c) => String(c.categorie || c.category || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const natural = (c) => { const label = String(c.niveau || c.level || c.nom || ""); const match = label.match(/\d+/); return [match ? Number(match[0]) : 999, label.toLocaleLowerCase("fr"), String(c.section || "")]; };
    return order.map((category) => {
      const grouped = classes.filter((c) => categoryName(c) === category)
        .sort((a, b) => { const ak = natural(a), bk = natural(b); return ak[0] - bk[0] || ak[1].localeCompare(bk[1], "fr") || ak[2].localeCompare(bk[2], "fr"); });
      const levels = {};
      grouped.forEach((c) => { const level = String(c.niveau || c.level || "Non classé"); (levels[level] ||= []).push(c); });
      return { category, classes: grouped, levels: Object.keys(levels).sort((a, b) => natural({ niveau: a })[0] - natural({ niveau: b })[0] || a.localeCompare(b, "fr")).map((level) => ({ level, classes: levels[level] })) };
    }).filter((g) => g.classes.length);
  },
  classById(id) { return this.state.classes.find((c) => c.id === id); },

  captureDetailsState() {
    return [...document.querySelectorAll("#app details")].map((node, index) => ({
      key: node.dataset.stateKey || `${index}:${node.querySelector("summary")?.textContent.trim() || ""}`,
      open: node.open
    }));
  },

  restoreDetailsState(state) {
    if (!Array.isArray(state) || !state.length) return;
    const nodes = [...document.querySelectorAll("#app details")];
    state.forEach((saved, index) => {
      const node = nodes.find((candidate) => (candidate.dataset.stateKey || `${nodes.indexOf(candidate)}:${candidate.querySelector("summary")?.textContent.trim() || ""}`) === saved.key) || nodes[index];
      if (node) node.open = Boolean(saved.open);
    });
  },

  render() {
    const hash = location.hash.replace("#", "") || "classes";
    this.state.route = hash.split("/")[0];
    const detailsState = this.captureDetailsState();
    document.getElementById("app").innerHTML = this.renderRoute();
    this.restoreDetailsState(detailsState);
    this.renderTabbar();
    this.refreshStatusPill();
    this.applyBranding();
    if (this.state.route === "classe") this.loadClassStudents(location.hash.split("/")[1]);
    if (this.state.route === "recouvrement" && this.state.recouvrementClasse) this.loadClassStudents(this.state.recouvrementClasse);
  },

  renderRoute() {
    switch (this.state.route) {
      case "classes": return this.viewClasses();
      case "classe": return this.viewClasseEleves(location.hash.split("/")[1]);
      case "eleve": return this.viewEleve(location.hash.split("/")[1]);
      case "recouvrement": return this.viewRecouvrement();
      case "salaires": return this.viewSalaires();
      default: return this.viewClasses();
    }
  },

  renderTabbar() {
    const tabs = [["classes", "🏫", "Classes"], ["recouvrement", "📋", "Recouvr."], ["salaires", "💰", "Mon salaire"]];
    document.getElementById("tabbar").innerHTML = tabs.map(([id, icon, label]) =>
      `<button class="${this.state.route === id || (id==='classes'&&this.state.route==='classe') ? "active" : ""}" onclick="location.hash='${id}'">
        <span class="tab-icon">${icon}</span>${label}</button>`).join("");
  },

  viewLogin() { return `<div class="card login-card"><h2>Connexion professeur</h2><p class="meta">Saisissez le code communiqué par l'établissement.</p><div id="prof-login-error" class="err-box"></div><label>Code professeur</label><input id="prof-code" autocomplete="off" placeholder="APR001"><button id="prof-login-btn" class="ok" onclick="App.login()"><span class="button-label">Se connecter</span><span class="button-spinner" aria-hidden="true"></span></button></div>`; },

  viewSalaires() {
    if (!this.state.professeur) return `<div class="card login-card"><h2>Mon salaire</h2><p class="meta">Saisissez votre code professeur pour consulter uniquement vos versements.</p><div id="prof-login-error" class="err-box"></div><label>Code professeur</label><input id="prof-code" autocomplete="off" placeholder="APR001"><button id="prof-login-btn" class="ok" onclick="App.login()"><span class="button-label">Afficher mon salaire</span><span class="button-spinner" aria-hidden="true"></span></button></div>`;
    const total=this.state.salaires.reduce((n,s)=>n+Number(s.montant_paye||0),0); return `<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Mon salaire</h2><button class="secondary btn-sync">Actualiser</button></div><p><strong>${this.state.professeur.nom}</strong></p><div class="stat"><div class="n">${this.fmt(total)}</div><div class="l">Total versé</div></div><button class="secondary" onclick="App.logout()">Fermer mon salaire</button></div><div class="card"><h2>Historique</h2>${this.state.salaires.length ? this.state.salaires.map(s=>`<div class="list-item"><div><strong>${s.periode||"Versement"}</strong><div class="meta">${this.dateFmt(s.date_paiement)} · ${s.mode||""}</div></div><span class="badge ok">${this.fmt(s.montant_paye)}</span></div>`).join("") : `<div class="empty">Aucun versement</div>`}</div>`;
  },
  viewClasses() {
    const classes = this.activeClasses();
    return `
      <div class="card searchbar">
        <input type="search" placeholder="Rechercher un eleve..." oninput="App.search(this.value)">
        <div id="search-results"></div>
      </div>
      <div class="card">
        <h2>Classes actives</h2>
        ${classes.length ? this.classGroups().map((group) => `<details class="class-group" data-state-key="class-group-${group.category}"><summary><span>${group.category}</span><span class="badge">${group.classes.length} classe(s)</span></summary><div class="class-group-list">${group.levels.map((level) => `<details class="class-level-group" data-state-key="class-level-${group.category}-${level.level}"><summary><span>${level.level}</span><span class="badge">${level.classes.length} classe(s)</span></summary><div class="class-group-list">${level.classes.map((c) => {
          const count = this.state.eleves.filter((e) => e.classe_id === c.id).length || Number(c.effectif || 0);
          return `<div class="list-item" style="cursor:pointer" onclick="location.hash='classe/${c.id}'">
            <div>${c.nom}<div class="meta">${c.categorie} · ${c.niveau}</div></div>
            <div class="badge">${count} eleve(s)</div>
          </div>`;
        }).join("")}</div></details>`).join("")}</div></details>`).join("") : `<div class="empty">Aucune classe (synchronisez si en ligne)</div>`}
      </div>`;
  },

  search(q) {
    const box = document.getElementById("search-results");
    if (!q || q.length < 2) { box.innerHTML = ""; return; }
    const qq = q.toLowerCase();
    const results = this.state.eleves.filter((e) => `${e.nom} ${e.postnom} ${e.prenom}`.toLowerCase().includes(qq));
    box.innerHTML = results.length ? results.map((e) => this.eleveRow(e)).join("") : `<div class="empty">Aucun resultat</div>`;
  },

  eleveRow(e) {
    const c = this.classById(e.classe_id);
    return `<div class="list-item" style="cursor:pointer" onclick="App.openEleve('${e.id}')">
      <div>${e.nom} ${e.postnom || ""} ${e.prenom || ""}<div class="meta">${c ? c.nom : ""}</div></div>
      <span class="badge">Voir le dossier</span>
    </div>`;
  },

  openEleve(id) { location.hash = "eleve/" + id; },

  showResponsable(id) {
    const e = this.state.eleves.find((x) => x.id === id);
    if (!e) return;
    alert(`Responsable: ${e.responsable_nom || "-"}\nTelephone: ${e.responsable_telephone || "-"}`);
  },

  viewClasseEleves(classeId) {
    const c = this.classById(classeId);
    const eleves = this.state.eleves.filter((e) => e.classe_id === classeId);
    return `
      <div class="card">
        <button class="secondary" onclick="history.back()">‹ Retour</button>
        <button class="ok" onclick="App.openRecouvrementClasse('${classeId}')">Voir le recouvrement</button>
        <h2>${c ? c.nom : ""}</h2>
        ${eleves.length ? eleves.map((e) => this.eleveRow(e)).join("") : `<div class="empty">Chargement des élèves…</div>`}
      </div>`;
  },

  viewEleve(id) {
    const e = this.state.eleves.find((x) => x.id === id);
    if (!e) return `<div class="card"><button class="secondary" onclick="history.back()">‹ Retour</button><div class="empty">Élève non chargé</div></div>`;
    const c = this.classById(e.classe_id);
    const s = e.scolarite || { du: 0, paye: Number(e.paye || 0), solde: Number(e.solde || 0), devise: "USD" };
    const frais = e.frais || [];
    const paiements = e.paiements || [];
    return `<div class="card">
      <button class="secondary" onclick="history.back()">‹ Retour</button>
      <h2>${e.nom} ${e.postnom || ""} ${e.prenom || ""}</h2>
      <p class="meta">${e.matricule || ""} · ${c ? c.nom : ""}</p>
      <div class="grid">
        <div class="stat"><div class="n">${this.fmt(s.du, s.devise)}</div><div class="l">Scolarité due</div></div>
        <div class="stat"><div class="n">${this.fmt(s.paye, s.devise)}</div><div class="l">Scolarité payée</div></div>
        <div class="stat"><div class="n">${this.fmt(s.solde, s.devise)}</div><div class="l">Solde scolaire</div></div>
      </div>
    </div>
    <div class="card"><h2>Autres frais</h2>${frais.length ? `<div class="fee-grid fee-grid-head" aria-hidden="true"><span>Frais</span><span>Dû</span><span>Payé</span><span>Solde</span></div>${frais.map(f => { const due = Number(f.dueCents || 0) / 100; const paid = Number(f.total || 0); const balance = Number(f.balanceCents || 0) / 100; return `<div class="fee-grid fee-grid-row"><strong>${this.escapeHtml(f.type)}</strong><span class="fee-value"><span>${this.fmt(due, f.devise)}</span><small class="meta">${(f.paiements || []).length} paiement(s)</small></span><span class="fee-value fee-paid">${this.fmt(paid, f.devise)}</span><span class="fee-value ${balance > 0 ? "fee-balance" : "fee-clear"}">${this.fmt(balance, f.devise)}</span></div>`; }).join("")}` : `<div class="empty">Aucun autre frais configuré</div>`}</div>
    <div class="card"><h2>Historique des paiements</h2>${paiements.length ? paiements.map(p => `<div class="list-item"><div><strong>${p.type}</strong><div class="meta">${this.dateFmt(p.date)} · ${p.mode || ""}</div></div><span class="badge ok">${this.fmt(p.montant, p.devise)}</span></div>`).join("") : `<div class="empty">Aucun paiement</div>`}</div>`;
  },

  async loadClassStudents(classeId) {
    if (!classeId) return;
    const alreadyLoaded = this.state.eleves.filter((e) => e.classe_id === classeId);
    if (alreadyLoaded.length && alreadyLoaded.every((e) => e.financialLoaded === true)) return;
    if (!ELIMU_Api.isOnline()) return;
    try {
      const result = await ELIMU_Api.publicClassStudents(classeId);
      // Conserver les montants renvoyés par Apps Script. L'ancien code les
      // écrasait systématiquement à zéro, ce qui masquait le recouvrement.
      const rows = (result.eleves || []).map((e) => Object.assign({}, e, {
        classe_id: classeId,
        paye: Number(e.paye ?? e.paid ?? 0),
        solde: Number(e.solde ?? e.balance ?? 0),
        scolarite: e.scolarite || null,
        frais: Array.isArray(e.frais) ? e.frais : [],
        paiements: Array.isArray(e.paiements) ? e.paiements : [],
        financialLoaded: true
      }));
      this.state.eleves = this.state.eleves.filter((e) => e.classe_id !== classeId).concat(rows);
      if ((this.state.route === "classe" && location.hash.split("/")[1] === classeId) ||
          (this.state.route === "recouvrement" && this.state.recouvrementClasse === classeId)) this.render();
    } catch (e) { this.toast("Impossible de charger les élèves"); }
  },

  viewRecouvrement() {
    const classes = this.activeClasses();
    return `
      <div class="card">
        <h2>Recouvrement</h2>
        <label>Classe à consulter</label>
        <select id="prof-rec-classe" onchange="App.setRecouvrementClasse(this.value)">
          <option value="">Sélectionner une classe</option>
          ${this.classGroups().map((group) => `<optgroup label="${group.category}">${group.classes.map((c) => `<option value="${c.id}" ${c.id === this.state.recouvrementClasse ? "selected" : ""}>${c.nom}</option>`).join("")}</optgroup>`).join("")}
        </select>
        ${this.state.recouvrementClasse ? `<input type="search" placeholder="Rechercher dans cette classe..." value="${this.state.recouvrementRecherche || ""}" oninput="App.setRecouvrementRecherche(this.value)">` : ""}
        <label>Seuil</label>
        <input type="number" id="seuil" value="${this.state.seuil}" oninput="App.setSeuil(this.value)">
        <div class="tag-row" ${this.state.recouvrementClasse ? "" : "style=\"opacity:.55;pointer-events:none\""}>
          <button class="tag-btn ${this.state.filtre==='insolvables'?'active':''}" onclick="App.setFiltre('insolvables')">Insolvables</button>
          <button class="tag-btn ${this.state.filtre==='solvables'?'active':''}" onclick="App.setFiltre('solvables')">Solvables</button>
        </div>
      </div>
      <div class="card" id="prof-recouvrement-list">
        ${this.recouvrementList()}
      </div>`;
  },

  setRecouvrementClasse(v) { this.state.recouvrementClasse = v || ""; this.state.recouvrementRecherche = ""; this.render(); },
  setRecouvrementRecherche(v) { this.state.recouvrementRecherche = v || ""; const list = document.getElementById("prof-recouvrement-list"); if (list) list.innerHTML = this.recouvrementList(); },
  openRecouvrementClasse(id) { this.state.recouvrementClasse = id; this.state.recouvrementRecherche = ""; location.hash = "recouvrement"; },
  setSeuil(v) { this.state.seuil = Math.max(0, Number(v) || 0); const list = document.getElementById("prof-recouvrement-list"); if (list) list.innerHTML = this.recouvrementList(); },
  setFiltre(f) { this.state.filtre = f; this.render(); },

  recouvrementList() {
    if (!this.state.recouvrementClasse) return `<div class="empty">Sélectionnez une classe pour afficher son recouvrement</div>`;
    const q = (this.state.recouvrementRecherche || "").trim().toLowerCase();
    const list = this.state.eleves.filter((e) => {
      if (e.classe_id !== this.state.recouvrementClasse) return false;
      if (q && ![e.nom, e.postnom, e.prenom, e.responsable_nom, e.responsable_telephone].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
      const paye = Number(e.paye || 0);
      return this.state.filtre === "insolvables" ? paye < this.state.seuil : paye >= this.state.seuil;
    });
    return list.length ? list.map((e) => `
      <div class="list-item" style="cursor:pointer" onclick="App.openEleve('${e.id}')"><div>${e.nom} ${e.postnom || ""} ${e.prenom || ""}<div class="meta">${(this.classById(e.classe_id)||{}).nom || ""}</div></div>
      <div class="right"><span class="badge ${this.state.filtre==='insolvables'?'danger':'ok'}">${this.state.filtre === 'insolvables' ? 'Pas en ordre' : 'En ordre'}</span><div class="meta">Payé : ${this.fmt(e.paye)} · Solde restant : ${this.fmt(e.solde)}</div></div></div>`).join("")
      : `<div class="empty">Aucun eleve dans ce filtre</div>`;
  }
};

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }

window.App = App;
document.addEventListener("DOMContentLoaded", () => App.init());
