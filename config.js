// Configuration CENTRALE de l'établissement client.
// Les trois portails (parent, professeur, direction) utilisent cette même
// adresse. Le pilote ELIMU possède une autre configuration, séparée.
window.ELIMU_ESTABLISHMENT_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbybsL4OthVSjmVY7BJl5eejF8BzxXUTYyZ1RpwYn1AnZ21SiZMNY5Oh0JFYrftglWEg/exec",
  configVersion: "2026-10-08-parent-session-2"
};

window.ELIMU_APPS_SCRIPT_URL = window.ELIMU_ESTABLISHMENT_CONFIG.appsScriptUrl;
window.ELIMU_getCentralAppsScriptUrl = function () {
  return window.ELIMU_ESTABLISHMENT_CONFIG.appsScriptUrl;
};
