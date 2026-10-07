// Configuration du portail professeur. L'identité visible provient de la
// feuille PARAMETRES du snapshot publié par l'établissement.
window.ELIMU_CONFIG = {
  appsScriptUrl: window.ELIMU_getCentralAppsScriptUrl(),
  schoolId: "",
  role: "PROFESSEUR",
  configVersion: "2026-10-07"
};

const ELIMU_URL_STORAGE_KEY = "elimu_professeur_online_config";

window.ELIMU_getAppsScriptUrl = function () {
  try {
    const saved = JSON.parse(localStorage.getItem(ELIMU_URL_STORAGE_KEY) || "null");
    if (saved && saved.configVersion === window.ELIMU_CONFIG.configVersion && saved.appsScriptUrl) return saved.appsScriptUrl;
  } catch (e) {}
  return window.ELIMU_CONFIG.appsScriptUrl;
};

window.ELIMU_setAppsScriptUrl = function (url) {
  localStorage.setItem(ELIMU_URL_STORAGE_KEY, JSON.stringify({
    appsScriptUrl: url.trim(), configVersion: window.ELIMU_CONFIG.configVersion
  }));
};
