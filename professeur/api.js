// api.js — Gestionnaire
// Enveloppe unique pour parler au backend Apps Script.
// Utilise text/plain pour eviter le preflight CORS (limitation connue d'Apps Script Web App).

const ELIMU_Api = {
  async call(action, payload) {
    const url = window.ELIMU_getAppsScriptUrl();
    if (!url || url.indexOf("A_REMPLACER") !== -1) {
      throw new Error("Connexion non configuree. Ouvrez Configuration.");
    }
    const body = JSON.stringify(Object.assign({
      action,
      schoolId: window.ELIMU_CONFIG.schoolId,
      role: window.ELIMU_CONFIG.role
    }, payload || {}));
    const readOnly = !["updateLicense", "registerInstallation"].includes(action);
    const target = readOnly ? url + "?" + new URLSearchParams(JSON.parse(body)) : url;
    const res = await fetch(target, readOnly ? {} : {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    if (!res.ok) {
      throw new Error("Erreur reseau (" + res.status + ")");
    }
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { throw new Error("Le service de l'établissement a renvoyé une réponse invalide. Vérifiez l'URL /exec et le déploiement Apps Script."); }
    if (!data.ok) {
      throw new Error(data.error || "Erreur serveur");
    }
    // Le déploiement Apps Script actuel renvoie les données directement.
    // L'ancien contrat renvoyait parfois { result: ... }; les deux restent acceptés.
    return Object.prototype.hasOwnProperty.call(data, "result") ? data.result : data;
  },

  isOnline() {
    return navigator.onLine;
  },

  async professorProfile(code) {
    try {
      return await this.call("verifierProfesseur", { code });
    } catch (e) {
      // Compatibilité avec le déploiement Apps Script actuel, qui expose déjà teacherClasses.
      const base = await this.call("teacherClasses", { code });
      return Object.assign({}, base, { salaires: [] });
    }
  },

  async publicClasses() {
    return this.call("publicClasses", {});
  },

  async publicClassStudents(classId) {
    return this.call("publicClassStudents", { classId });
  }
};

window.ELIMU_Api = ELIMU_Api;
