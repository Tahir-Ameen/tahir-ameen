/*
 * ============================================================
 *  API BASE URL - Frontend backend se kahaan baat karega
 * ------------------------------------------------------------
 *  - Local (apne PC pe testing): http://127.0.0.1:3000
 *  - Production backend Vercel pe deployed hai
 * ============================================================
 */

const PRODUCTION_API_URL = "https://tahir-ameen.vercel.app";

const API_BASE_URL = (function () {
  const host = window.location.hostname;

  // Local dev / file:// se kholna
  if (host === "localhost" || host === "127.0.0.1" || host === "") {
    return "http://127.0.0.1:3000";
  }

  // GitHub Pages / Netlify / baqi sab - deployed backend
  return PRODUCTION_API_URL;
})();
window.API_BASE_URL = API_BASE_URL;
