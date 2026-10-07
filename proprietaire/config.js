// Profil du portail direction.
// L'URL n'est volontairement pas redéfinie ici : elle vient uniquement de
// ../config.js, la configuration centrale commune aux trois portails client.
window.ELIMU_CONFIG = {
  appsScriptUrl: window.ELIMU_getCentralAppsScriptUrl(),
  schoolId: "",
  role: "PROPRIETAIRE",
  configVersion: window.ELIMU_ESTABLISHMENT_CONFIG.configVersion
};

window.ELIMU_getAppsScriptUrl = function () {
  return window.ELIMU_getCentralAppsScriptUrl();
};
