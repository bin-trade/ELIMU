// sync.js — Professeur
// Le backend restreint deja les champs envoyes a ce role (voir apps-script/*.gs).
// Le portail en ligne recharge les classes et les élèves depuis Apps Script.
// (avec statut de solvabilite calcule cote serveur, jamais de montants).

const ELIMU_Sync = {
  listeners: [],
  onChange(fn) { this.listeners.push(fn); },
  notify() { this.listeners.forEach((fn) => { try { fn(); } catch (e) {} }); },

  async pullAll() {
    if (!ELIMU_Api.isOnline()) return false;
    const profile = await ELIMU_Api.publicClasses();
    const classes = (profile.classes || []).map((c) => Object.assign({}, c, { active: true }));
    await ELIMU_Storage.replaceAll("classes", classes);
    await ELIMU_Storage.replaceAll("salaires", profile.salaires || []);
    await ELIMU_Storage.setMeta("school_config", Object.assign({}, profile.etablissement || {}, { school_year: profile.anneeScolaire || (profile.etablissement || {}).school_year || "" }));
    await ELIMU_Storage.setMeta("last_sync", new Date().toISOString());
    this.notify();
    return true;
  },

  async fullSync() {
    const pulled = await this.pullAll();
    return { pulled, pushed: 0, failed: 0 };
  },

  async getStatus() {
    const lastSync = await ELIMU_Storage.getMeta("last_sync");
    return { online: ELIMU_Api.isOnline(), lastSync, pending: 0 };
  }
};

window.addEventListener("online", () => { ELIMU_Sync.fullSync().catch(() => {}); });

window.ELIMU_Sync = ELIMU_Sync;
