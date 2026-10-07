// Configuration CENTRALE de l'établissement client.
// Les trois portails (parent, professeur, direction) utilisent cette même
// adresse. Le pilote ELIMU possède une autre configuration, séparée.
window.ELIMU_ESTABLISHMENT_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxr4VYcij40KAidg0HABtWIJVePk0Qry51G_NDCeytCp-Sn3jauFEsvdetSY8UAdOnr/exec",
  configVersion: "2026-10-07"
};

window.ELIMU_APPS_SCRIPT_URL = window.ELIMU_ESTABLISHMENT_CONFIG.appsScriptUrl;
window.ELIMU_getCentralAppsScriptUrl = function () {
  return window.ELIMU_ESTABLISHMENT_CONFIG.appsScriptUrl;
};
