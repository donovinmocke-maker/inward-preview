/* Inward shop — the only file to edit to connect Shopify.
   Full steps, in plain language: SHOP-SETUP.md

   Change the two empty strings below. Nothing else in the site needs editing.

   domain
     Katie’s Shopify store domain. Use the myshopify.com address from
     Shopify admin → Settings → Domains, for example inward-with-katie.myshopify.com
     No https:// and no trailing slash.

   storefrontToken
     The PUBLIC Storefront API access token from the Headless channel.
     Shopify labels it “Public access token”. It is meant to be used in a
     browser. It can list products and start a checkout. It cannot see
     orders, change prices, issue refunds, or touch a bank account.

   Leave both strings empty to keep the example products (preview only).

   NEVER paste any of these:
     - Admin API access token (starts with shpat_)
     - API secret key (starts with shpss_)
     - The Headless “Private access token”
   Those are secrets. They do not belong in this file or anywhere on the website.
*/
window.INWARD_SHOP = {
  domain: "",
  storefrontToken: ""
};

/* Detect preview / live / blocked. Edit the two strings above, not this. */
window.INWARD_SHOP_resolve = function (cfg) {
  cfg = cfg || {};
  function cleanDomain(value) {
    return String(value || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/\s+/g, "");
  }
  function cleanToken(value) {
    return String(value || "").trim();
  }
  var domain = cleanDomain(cfg.domain);
  var token = cleanToken(cfg.storefrontToken);
  var secret = /^(shpat_|shpss_|shpca_|shppa_|shppt_|shpua_)/i.test(token);
  var placeholderDomain = /^(your-store\.myshopify\.com|your-store-name\.myshopify\.com|store-name\.myshopify\.com|example\.myshopify\.com|todo|changeme|xxx+)$/i.test(domain);
  var placeholderToken = /^(your[-_a-z0-9]*|paste[-_a-z0-9]*|todo|changeme|xxx+|public[-_]?token|storefront[-_]?token)$/i.test(token);
  var domainOk = domain.indexOf(".") > 0 && /^[a-z0-9.-]+$/i.test(domain) && !placeholderDomain;
  var tokenOk = token.length >= 20 && !placeholderToken && !secret;
  var mode = secret ? "blocked" : domainOk && tokenOk ? "live" : "preview";
  var partial = mode === "preview" && !!(domain || token);
  if (mode !== "live") cfg.storefrontToken = "";
  return {
    mode: mode,
    partial: partial,
    domain: mode === "live" ? domain : "",
    token: mode === "live" ? token : ""
  };
};

window.INWARD_SHOP_RUNTIME = window.INWARD_SHOP_resolve(window.INWARD_SHOP);
document.documentElement.classList.add("shop-" + window.INWARD_SHOP_RUNTIME.mode);
