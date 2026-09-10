/*
 * ============================================================
 *  API BASE URL - Frontend backend se kahaan baat karega
 * ------------------------------------------------------------
 *  - Local (apne PC pe testing): http://127.0.0.1:3000
 *  - Render pe backend deploy karne ke baad neeche wale
 *    PRODUCTION_API_URL ko apne Render URL se change karna:
 *      https://YOUR-PORTFOLIO-BACKEND.onrender.com
 * ============================================================
 */

const PRODUCTION_API_URL = "https://YOUR-PORTFOLIO-BACKEND.onrender.com";

const API_BASE_URL = (function () {
  const host = window.location.hostname;

  // Local dev / file:// se kholna
  if (host === "localhost" || host === "127.0.0.1" || host === "") {
    return "http://127.0.0.1:3000";
  }

  // Render ka backend hi frontend bhi serve kar raha hai (same origin)
  if (host.endsWith(".onrender.com")) {
    return window.location.origin;
  }

  // GitHub Pages / Netlify / baqi sab - deployed backend
  return PRODUCTION_API_URL;
})();