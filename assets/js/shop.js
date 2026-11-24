/* Inward shop.
   Preview products until assets/js/shop-config.js has a store domain
   and a public Storefront API token. See SHOP-SETUP.md.
   This file never reads an Admin API token and never collects payment. */
(function () {
  "use strict";

  var API_VERSION = "2026-10";
  var CART_KEY = "inward.shop.cart.v1";
  var MAX_QTY = 20;
  var runtime = window.INWARD_SHOP_RUNTIME || { mode: "preview", partial: false, domain: "", token: "" };
  var mode = runtime.mode || "preview";

  var SIZES = ["XS", "S", "M", "L", "XL"];
  var HOODIE_SIZES = ["S", "M", "L", "XL"];

  function product(spec) {
    var options = spec.options || [];
    var variants = [];
    function walk(index, chosen) {
      if (index === options.length) {
        var snapshot = {};
        options.forEach(function (opt) { snapshot[opt.name] = chosen[opt.name]; });
        var colour = snapshot.Colour || "";
        variants.push({
          id: "example:" + spec.handle + ":" + options.map(function (opt) { return snapshot[opt.name]; }).join(":"),
          title: options.map(function (opt) { return snapshot[opt.name]; }).join(" / "),
          available: true,
          options: snapshot,
          price: { amount: spec.price, currencyCode: "USD" },
          image: (spec.images && (spec.images[colour] || spec.images["*"])) || spec.image,
          alt: spec.altFor ? spec.altFor(snapshot) : spec.alt
        });
        return;
      }
      options[index].values.forEach(function (value) {
        chosen[options[index].name] = value;
        walk(index + 1, chosen);
      });
    }
    walk(0, {});
    return {
      id: "example:" + spec.handle,
      handle: spec.handle,
      title: spec.title,
      description: spec.description,
      example: true,
      image: spec.image,
      alt: spec.alt,
      options: options,
      variants: variants
    };
  }

  var EXAMPLES = [
    product({
      handle: "inward-tee",
      title: "Inward Tee",
      price: "48.00",
      image: "assets/img/shop/tee-black.svg",
      alt: "Example black Inward t-shirt",
      description: "Heavyweight cotton. A small Inward wordmark, nothing across the back.",
      options: [
        { name: "Colour", values: ["Black", "White"] },
        { name: "Size", values: SIZES }
      ],
      images: {
        Black: "assets/img/shop/tee-black.svg",
        White: "assets/img/shop/tee-white.svg"
      },
      altFor: function (o) { return "Example " + o.Colour.toLowerCase() + " Inward t-shirt"; }
    }),
    product({
      handle: "inward-hoodie",
      title: "Inward Hoodie",
      price: "92.00",
      image: "assets/img/shop/hoodie-black.svg",
      alt: "Example black Inward hoodie",
      description: "For early runs and late episodes. The wordmark sits small, over the heart.",
      options: [
        { name: "Colour", values: ["Black", "Grey"] },
        { name: "Size", values: HOODIE_SIZES }
      ],
      images: {
        Black: "assets/img/shop/hoodie-black.svg",
        Grey: "assets/img/shop/hoodie-grey.svg"
      },
      altFor: function (o) { return "Example " + o.Colour.toLowerCase() + " Inward hoodie"; }
    }),
    product({
      handle: "inward-mug",
      title: "Inward Mug",
      price: "28.00",
      image: "assets/img/shop/mug-black.svg",
      alt: "Example black Inward mug",
      description: "A thick stoneware mug for the quiet cup before the day starts.",
      options: [{ name: "Colour", values: ["Black", "White"] }],
      images: {
        Black: "assets/img/shop/mug-black.svg",
        White: "assets/img/shop/mug-white.svg"
      },
      altFor: function (o) { return "Example " + o.Colour.toLowerCase() + " Inward mug"; }
    }),
    product({
      handle: "inward-journal",
      title: "Inward Journal",
      price: "32.00",
      image: "assets/img/shop/journal.svg",
      alt: "Example black hardcover journal with the Inward wordmark",
      description: "Plain pages. A hard cover. Somewhere to put the things you don’t say out loud yet."
    }),
    product({
      handle: "inward-cap",
      title: "Inward Cap",
      price: "36.00",
      image: "assets/img/shop/cap-black.svg",
      alt: "Example black Inward cap",
      description: "A washed cap with a small mark. Shade, and a reminder.",
      options: [{ name: "Colour", values: ["Black", "White"] }],
      images: {
        Black: "assets/img/shop/cap-black.svg",
        White: "assets/img/shop/cap-white.svg"
      },
      altFor: function (o) { return "Example " + o.Colour.toLowerCase() + " Inward cap"; }
    })
  ];

  var catalog = mode === "live" ? [] : EXAMPLES.slice();
  var cart = loadCart();
  var selection = {};
  var currentHandle = "";
  var lastFocus = null;
  var checkingOut = false;

  var view = document.getElementById("shop-view");
  var hero = document.getElementById("shop-hero");
  var kicker = document.getElementById("shop-kicker");
  var statusEl = document.getElementById("shop-status");
  var drawer = document.getElementById("cart-drawer");
  var linesEl = document.getElementById("cart-lines");
  var subEl = document.getElementById("cart-sub");
  var fineEl = document.getElementById("cart-fine");
  var noteEl = document.getElementById("checkout-note");
  var checkoutBtn = document.getElementById("checkout");
  var cartBtn = document.getElementById("cart-open");
  var countEl = document.getElementById("cart-count");
  var tools = document.getElementById("shop-tools");

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child) node.appendChild(child);
    }
    return node;
  }

  function money(amount, currency) {
    var n = Number(amount);
    if (!isFinite(n)) return "";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(n);
    } catch (err) {
      return n.toFixed(2) + (currency ? " " + currency : "");
    }
  }

  function cents(amount) {
    var n = Number(amount);
    if (!isFinite(n)) return 0;
    return Math.round(n * 100);
  }

  function say(message) {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.textContent = message;
  }

  function visibleOptions(product) {
    return (product.options || []).filter(function (opt) {
      return !(opt.name === "Title" && opt.values.length === 1 && opt.values[0] === "Default Title");
    });
  }

  function findProduct(handle) {
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].handle === handle) return catalog[i];
    }
    return null;
  }

  function variantFor(product, selected) {
    var options = visibleOptions(product);
    for (var i = 0; i < product.variants.length; i++) {
      var variant = product.variants[i];
      var match = options.every(function (opt) {
        return variant.options[opt.name] === selected[opt.name];
      });
      if (match) return variant;
    }
    return null;
  }

  function comboAvailable(product, selected) {
    return product.variants.some(function (variant) {
      if (!variant.available) return false;
      return visibleOptions(product).every(function (opt) {
        return variant.options[opt.name] === selected[opt.name];
      });
    });
  }

  function priceLabel(product) {
    if (!product.variants.length) return "";
    var currency = product.variants[0].price.currencyCode;
    var min = product.variants[0].price.amount;
    var max = min;
    product.variants.forEach(function (variant) {
      if (Number(variant.price.amount) < Number(min)) min = variant.price.amount;
      if (Number(variant.price.amount) > Number(max)) max = variant.price.amount;
    });
    if (Number(min) === Number(max)) return money(min, currency);
    return "From " + money(min, currency);
  }

  function defaultSelection(product) {
    var selected = {};
    var pool = product.variants.filter(function (variant) { return variant.available; });
    if (!pool.length) pool = product.variants;
    var first = pool[0];
    for (var i = 0; i < pool.length; i++) {
      var values = visibleOptions(product).map(function (opt) { return pool[i].options[opt.name]; });
      if (values.indexOf("M") !== -1) { first = pool[i]; break; }
    }
    visibleOptions(product).forEach(function (opt) {
      selected[opt.name] = first && first.options[opt.name] ? first.options[opt.name] : opt.values[0];
    });
    return selected;
  }

  function loadCart() {
    var empty = { mode: mode, lines: [] };
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "null");
      if (!raw || raw.mode !== mode || !Array.isArray(raw.lines)) return empty;
      raw.lines = raw.lines.filter(function (line) {
        return line && typeof line.variantId === "string" && line.title && line.priceAmount != null && line.qty >= 1 && line.qty <= MAX_QTY;
      });
      return raw;
    } catch (err) {
      return empty;
    }
  }

  function saveCart() {
    cart.mode = mode;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) {}
  }

  function lineCount() {
    return cart.lines.reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function subtotal() {
    var currency = cart.lines.length ? cart.lines[0].currency : "USD";
    var mixed = cart.lines.some(function (line) { return line.currency !== currency; });
    if (mixed) return { label: "—", currency: "" };
    var total = cart.lines.reduce(function (sum, line) {
      return sum + cents(line.priceAmount) * line.qty;
    }, 0);
    return { label: money(total / 100, currency), currency: currency };
  }

  function updateCount() {
    var n = lineCount();
    if (countEl) countEl.textContent = String(n);
    if (cartBtn) {
      cartBtn.setAttribute("aria-label", n === 1 ? "Cart, 1 item" : "Cart, " + n + " items");
    }
  }

  function updateTotals() {
    var totals = subtotal();
    if (subEl) subEl.textContent = cart.lines.length ? totals.label : "—";
    if (checkoutBtn) checkoutBtn.disabled = checkingOut || cart.lines.length === 0;
  }

  function renderLines(focusId, focusAct) {
    if (!linesEl) return;
    linesEl.textContent = "";
    if (!cart.lines.length) {
      linesEl.appendChild(el("p", { class: "cart-empty", text: "Your cart is empty." }));
      updateTotals();
      updateCount();
      return;
    }
    cart.lines.forEach(function (line) {
      var img = el("img", {
        src: line.image || "",
        alt: line.alt || "",
        width: "84",
        height: "105"
      });
      var title = el("h3", { text: line.title });
      var variant = line.variantTitle ? el("p", { class: "cart-var", text: line.variantTitle }) : null;
      var price = el("p", {
        class: "line-price",
        text: money(cents(line.priceAmount) * line.qty / 100, line.currency)
      });
      var minus = el("button", { type: "button", "data-act": "minus", "aria-label": "Decrease quantity of " + line.title });
      minus.textContent = "–";
      var input = el("input", {
        class: "qty-input",
        type: "number",
        inputmode: "numeric",
        min: "1",
        max: String(MAX_QTY),
        value: String(line.qty),
        "aria-label": "Quantity of " + line.title + (line.variantTitle ? ", " + line.variantTitle : "")
      });
      var plus = el("button", { type: "button", "data-act": "plus", "aria-label": "Increase quantity of " + line.title });
      plus.textContent = "+";
      var qty = el("div", { class: "qty" }, minus, input, plus);
      var remove = el("button", {
        type: "button",
        class: "remove",
        "data-act": "remove",
        text: "Remove"
      });
      remove.setAttribute("aria-label", "Remove " + line.title + (line.variantTitle ? ", " + line.variantTitle : ""));
      var actions = el("div", { class: "cart-actions" }, qty, remove);
      var copy = el("div", {}, title, variant, price, actions);
      var row = el("article", { class: "cart-line", "data-variant-id": line.variantId }, img, copy);
      linesEl.appendChild(row);
    });
    updateTotals();
    updateCount();
    if (focusId) {
      var rows = linesEl.querySelectorAll("[data-variant-id]");
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute("data-variant-id") === focusId) {
          var target = focusAct ? rows[i].querySelector("[data-act='" + focusAct + "']") : rows[i].querySelector(".qty-input");
          if (target) target.focus();
          break;
        }
      }
    }
  }

  function setQty(variantId, qty, focusAct) {
    var line = null;
    cart.lines.forEach(function (item) { if (item.variantId === variantId) line = item; });
    if (!line) return;
    var n = parseInt(qty, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > MAX_QTY) n = MAX_QTY;
    line.qty = n;
    saveCart();
    renderLines(variantId, focusAct);
    say(line.title + ", quantity " + n + ". Subtotal " + subtotal().label + ".");
  }

  function removeLine(variantId) {
    var removed = null;
    cart.lines = cart.lines.filter(function (line) {
      if (line.variantId === variantId) { removed = line; return false; }
      return true;
    });
    saveCart();
    renderLines();
    if (removed) say(removed.title + " removed from cart.");
    var close = drawer.querySelector("[data-cart-close].cart-close");
    if (close) close.focus();
  }

  function addVariant(product, variant) {
    if (!variant || !variant.available) return;
    var existing = null;
    cart.lines.forEach(function (line) { if (line.variantId === variant.id) existing = line; });
    var options = visibleOptions(product);
    var variantTitle = options.map(function (opt) { return variant.options[opt.name]; }).filter(Boolean).join(" / ");
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + 1);
    } else {
      cart.lines.push({
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variantTitle,
        priceAmount: variant.price.amount,
        currency: variant.price.currencyCode,
        image: variant.image || product.image || "",
        alt: variant.alt || product.alt || product.title,
        qty: 1
      });
    }
    saveCart();
    updateCount();
    var label = product.title + (variantTitle ? ", " + variantTitle : "");
    say(label + " added to cart. " + lineCount() + (lineCount() === 1 ? " item." : " items."));
    openCart();
  }

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    document.body.classList.remove("menu-open");
    var burger = document.querySelector(".burger");
    if (burger) burger.setAttribute("aria-expanded", "false");
    renderLines();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;
    if (cartBtn) cartBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("cart-open");
    var title = document.getElementById("cart-title");
    if (title) title.focus();
  }

  function closeCart() {
    if (!drawer || !drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    if (cartBtn) cartBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cart-open");
    if (lastFocus && typeof lastFocus.focus === "function" && drawer.contains(lastFocus) === false) {
      lastFocus.focus();
    }
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !drawer.classList.contains("open")) return;
    var nodes = drawer.querySelectorAll("a, button, input, select, textarea, [tabindex]");
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.disabled || node.getAttribute("aria-hidden") === "true") continue;
      if (node.tabIndex < 0 && node.id !== "cart-title" && node.id !== "checkout-note") continue;
      if (node.offsetParent === null && node.id !== "cart-title") continue;
      list.push(node);
    }
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showCheckoutNote(message) {
    if (!noteEl) return;
    noteEl.hidden = false;
    noteEl.textContent = "";
    noteEl.textContent = message;
    noteEl.focus();
  }

  function checkoutUrlOk(url) {
    try {
      var parsed = new URL(url);
      return parsed.protocol === "https:" ? parsed.href : "";
    } catch (err) {
      return "";
    }
  }

  function storefront(query, variables) {
    return fetch("https://" + runtime.domain + "/api/" + API_VERSION + "/graphql.json", {
      method: "POST",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Shopify-Storefront-Access-Token": runtime.token
      },
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok || (json.errors && json.errors.length)) {
          var raw = (json.errors && json.errors[0] && json.errors[0].message) || "";
          if (runtime.token && raw.indexOf(runtime.token) !== -1) raw = raw.split(runtime.token).join("…");
          var friendly = res.status === 401 || res.status === 403
            ? "Shopify refused the public token. Check the token in shop-config.js, and that product and checkout permissions are turned on."
            : "Shopify couldn’t complete that request. Check the store domain and public token in shop-config.js.";
          throw new Error(friendly);
        }
        return json.data || {};
      });
    });
  }

  function startCheckout() {
    if (checkingOut) return;
    if (mode !== "live") {
      showCheckoutNote("Checkout opens once the store is connected. This preview does not take payment. No card or bank details are collected on this site.");
      return;
    }
    var bad = cart.lines.some(function (line) {
      return line.variantId.indexOf("gid://shopify/ProductVariant/") !== 0;
    });
    if (bad) {
      showCheckoutNote("This cart can’t be checked out. Remove the items and add them again from the connected shop.");
      return;
    }
    checkingOut = true;
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Opening checkout…";
    }
    storefront(
      "mutation cartCreate($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } } }",
      {
        lines: cart.lines.map(function (line) {
          return { merchandiseId: line.variantId, quantity: line.qty };
        })
      }
    ).then(function (data) {
      var payload = data.cartCreate || {};
      var errors = payload.userErrors || [];
      if (errors.length) throw new Error(errors[0].message || "Shopify couldn’t open checkout.");
      var url = checkoutUrlOk(payload.cart && payload.cart.checkoutUrl);
      if (!url) throw new Error("Shopify didn’t return a checkout link.");
      window.location.assign(url);
    }).catch(function (err) {
      checkingOut = false;
      if (checkoutBtn) checkoutBtn.textContent = "Checkout";
      updateTotals();
      showCheckoutNote(err && err.message ? err.message : "Shopify couldn’t open checkout. Nothing was charged.");
    });
  }

  function clear(node) {
    if (node) node.textContent = "";
  }

  function renderGrid() {
    currentHandle = "";
    if (hero) hero.hidden = false;
    if (kicker) {
      kicker.textContent = mode === "preview"
        ? "Five example pieces"
        : (catalog.length === 1 ? "1 piece" : catalog.length + " pieces");
    }
    clear(view);
    if (!catalog.length) {
      view.appendChild(el("p", {
        class: "shop-empty",
        text: "No products are published to this shop yet. Add them in Shopify and they’ll show up here."
      }));
      return;
    }
    var grid = el("div", { class: "shop-grid" });
    catalog.forEach(function (product) {
      var media = el("span", { class: "ph" });
      if (product.image) {
        media.appendChild(el("img", {
          src: product.image,
          alt: product.alt || product.title,
          width: "800",
          height: "1000",
          loading: "lazy",
          decoding: "async"
        }));
      }
      var eyebrow = el("p", { class: "eyebrow muted", text: product.example ? "Example" : "Inward" });
      var row = el("div", { class: "shop-card-row" },
        el("h2", { text: product.title }),
        el("span", { class: "price", text: priceLabel(product) })
      );
      var card = el("a", { class: "shop-card", href: "#" + encodeURIComponent(product.handle) }, media, eyebrow, row);
      grid.appendChild(card);
    });
    view.appendChild(grid);
  }

  function renderMissing() {
    currentHandle = "";
    if (hero) hero.hidden = true;
    clear(view);
    view.appendChild(el("p", { class: "eyebrow muted", text: "Shop" }));
    view.appendChild(el("h1", { text: "That piece isn’t here." }));
    view.appendChild(el("p", { class: "shop-empty", text: "It may have moved, or it isn’t published yet." }));
    view.appendChild(el("a", { class: "btn", href: "shop.html", text: "All pieces" }));
  }

  function syncDetail(product) {
    var options = visibleOptions(product);
    options.forEach(function (opt) {
      if (!selection[opt.name]) selection[opt.name] = opt.values[0];
    });
    options.forEach(function (opt) {
      var trial = {};
      options.forEach(function (other) { trial[other.name] = selection[other.name]; });
      if (!comboAvailable(product, trial)) {
        for (var i = 0; i < opt.values.length; i++) {
          trial[opt.name] = opt.values[i];
          if (comboAvailable(product, trial)) {
            selection[opt.name] = opt.values[i];
            break;
          }
        }
      }
    });
    var variant = variantFor(product, selection);
    var price = view.querySelector(".pdp-price");
    if (price) {
      price.textContent = variant ? money(variant.price.amount, variant.price.currencyCode) : priceLabel(product);
    }
    var img = view.querySelector(".pdp-img img");
    if (img && variant && variant.image) {
      if (img.getAttribute("src") !== variant.image) img.setAttribute("src", variant.image);
      img.alt = variant.alt || product.alt || product.title;
    }
    options.forEach(function (opt) {
      var inputs = view.querySelectorAll('input[data-option="' + CSS.escape(opt.name) + '"]');
      inputs.forEach(function (input) {
        var trial = {};
        options.forEach(function (other) { trial[other.name] = selection[other.name]; });
        trial[opt.name] = input.value;
        var ok = product.variants.some(function (item) {
          return item.available && options.every(function (other) {
            return item.options[other.name] === trial[other.name];
          });
        });
        input.disabled = !ok;
        input.checked = selection[opt.name] === input.value;
      });
    });
    var button = view.querySelector("[data-add]");
    if (button) {
      var soldOut = !variant || !variant.available;
      button.disabled = soldOut;
      button.textContent = soldOut ? "Sold out" : "Add to cart";
    }
    var chosen = view.querySelector(".pdp-chosen");
    if (chosen) {
      var bits = options.map(function (opt) { return selection[opt.name]; }).filter(Boolean);
      chosen.textContent = bits.join(" · ");
    }
  }

  function renderDetail(product) {
    currentHandle = product.handle;
    if (hero) hero.hidden = true;
    if (kicker) kicker.textContent = "Shop";
    selection = defaultSelection(product);
    clear(view);
    var media = el("div", { class: "pdp-img" });
    media.appendChild(el("img", {
      src: product.image || "",
      alt: product.alt || product.title,
      width: "800",
      height: "1000",
      decoding: "async"
    }));
    var copy = el("div", { class: "pdp-copy" });
    copy.appendChild(el("a", { class: "link", href: "shop.html", text: "All pieces" }));
    if (product.example) copy.appendChild(el("p", { class: "eyebrow", text: "Example" }));
    var heading = el("h1", { id: "product-title", tabindex: "-1", text: product.title });
    copy.appendChild(heading);
    copy.appendChild(el("p", { class: "pdp-price", text: priceLabel(product) }));
    if (product.description) copy.appendChild(el("p", { class: "desc", text: product.description }));
    visibleOptions(product).forEach(function (opt) {
      if (opt.values.length < 2) {
        copy.appendChild(el("p", { class: "pdp-single", text: opt.name + " · " + opt.values[0] }));
        return;
      }
      var field = el("fieldset", { class: "opt" });
      field.appendChild(el("legend", { text: opt.name }));
      var choices = el("div", { class: "choices" });
      opt.values.forEach(function (value) {
        var input = el("input", { type: "radio", name: "opt-" + opt.name.replace(/\s+/g, "-"), value: value });
        input.dataset.option = opt.name;
        var choice = el("label", { class: "choice" }, input, el("span", { text: value }));
        choices.appendChild(choice);
      });
      field.appendChild(choices);
      copy.appendChild(field);
    });
    copy.appendChild(el("p", { class: "pdp-chosen" }));
    var add = el("button", { type: "button", class: "btn solid", "data-add": "true", text: "Add to cart" });
    copy.appendChild(add);
    if (product.example) {
      copy.appendChild(el("p", {
        class: "pdp-note",
        text: "Example product. Preview only. Nothing is charged from this page."
      }));
    }
    view.appendChild(el("div", { class: "pdp" }, media, copy));
    syncDetail(product);
    heading.focus({ preventScroll: true });
  }

  function route() {
    var handle = "";
    try { handle = decodeURIComponent((location.hash || "").replace(/^#/, "")); } catch (err) { handle = ""; }
    if (!handle) {
      renderGrid();
      return;
    }
    var product = findProduct(handle);
    if (!product) {
      renderMissing();
      return;
    }
    if (currentHandle !== handle) renderDetail(product);
    else syncDetail(product);
  }

  function showLoadError() {
    if (hero) hero.hidden = false;
    clear(view);
    if (kicker) kicker.textContent = "Shop";
    view.appendChild(el("p", {
      class: "shop-empty",
      text: "The shop couldn’t be loaded from Shopify. Check the store domain and the public token in assets/js/shop-config.js. Nothing was charged."
    }));
  }

  function mapProducts(data) {
    var edges = (data && data.products && data.products.edges) || [];
    return edges.map(function (edge) {
      var node = edge.node || {};
      var variants = ((node.variants && node.variants.edges) || []).map(function (item) {
        var variant = item.node || {};
        var opts = {};
        (variant.selectedOptions || []).forEach(function (opt) { opts[opt.name] = opt.value; });
        return {
          id: variant.id,
          title: variant.title,
          available: !!variant.availableForSale,
          options: opts,
          price: variant.price ? { amount: variant.price.amount, currencyCode: variant.price.currencyCode } : null,
          image: variant.image && variant.image.url || "",
          alt: (variant.image && variant.image.altText) || node.title || ""
        };
      }).filter(function (variant) { return variant.id && variant.price && variant.price.amount; });
      return {
        id: node.id,
        handle: node.handle,
        title: node.title,
        description: node.description || "",
        example: false,
        image: (node.featuredImage && node.featuredImage.url) || (variants[0] && variants[0].image) || "",
        alt: (node.featuredImage && node.featuredImage.altText) || node.title || "",
        options: (node.options || []).map(function (opt) { return { name: opt.name, values: (opt.values || []).slice() }; }),
        variants: variants
      };
    }).filter(function (item) { return item.handle && item.variants.length; });
  }

  function bind() {
    if (cartBtn) cartBtn.addEventListener("click", openCart);
    if (checkoutBtn) checkoutBtn.addEventListener("click", startCheckout);
    if (drawer) {
      drawer.querySelectorAll("[data-cart-close]").forEach(function (node) {
        node.addEventListener("click", closeCart);
      });
    }
    document.addEventListener("keydown", function (event) {
      if (!drawer || !drawer.classList.contains("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
      } else {
        trapFocus(event);
      }
    });
    var burger = document.querySelector(".burger");
    if (burger) {
      burger.addEventListener("click", function () {
        if (document.body.classList.contains("menu-open")) closeCart();
      });
    }
    if (linesEl) {
      linesEl.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-act]");
        if (!button) return;
        var row = button.closest("[data-variant-id]");
        if (!row) return;
        var id = row.getAttribute("data-variant-id");
        var act = button.getAttribute("data-act");
        if (act === "remove") removeLine(id);
        else {
          var line = null;
          cart.lines.forEach(function (item) { if (item.variantId === id) line = item; });
          if (!line) return;
          setQty(id, line.qty + (act === "plus" ? 1 : -1), act);
        }
      });
      linesEl.addEventListener("change", function (event) {
        if (!event.target.classList.contains("qty-input")) return;
        var row = event.target.closest("[data-variant-id]");
        if (!row) return;
        setQty(row.getAttribute("data-variant-id"), event.target.value);
      });
    }
    if (view) {
      view.addEventListener("change", function (event) {
        if (!event.target.dataset || !event.target.dataset.option) return;
        selection[event.target.dataset.option] = event.target.value;
        var product = findProduct(currentHandle);
        if (product) syncDetail(product);
      });
      view.addEventListener("click", function (event) {
        var button = event.target.closest("[data-add]");
        if (!button) return;
        var product = findProduct(currentHandle);
        if (!product) return;
        addVariant(product, variantFor(product, selection));
      });
    }
    window.addEventListener("hashchange", function () {
      closeCart();
      window.scrollTo(0, 0);
      route();
    });
  }

  function boot() {
    if (fineEl && mode === "live") {
      fineEl.textContent = "Shipping and tax are calculated by Shopify at checkout.";
    }
    if (mode === "blocked") {
      if (hero) hero.hidden = true;
      if (tools) tools.hidden = true;
      document.documentElement.classList.add("shop-ready");
      bind();
      updateCount();
      renderLines();
      return;
    }
    if (runtime.partial) {
      var banner = document.getElementById("shop-banner");
      if (banner && !banner.querySelector(".shop-banner-partial")) {
        banner.appendChild(el("span", {
          class: "shop-banner-partial",
          text: "The shop config is incomplete. Add both the store domain and the public token in assets/js/shop-config.js."
        }));
      }
    }
    bind();
    updateCount();
    renderLines();
    if (mode !== "live") {
      document.documentElement.classList.add("shop-ready");
      route();
      return;
    }
    storefront(
      "query Products { products(first: 50, sortKey: TITLE) { edges { node { id handle title description featuredImage { url altText } options { name values } variants(first: 100) { edges { node { id title availableForSale selectedOptions { name value } price { amount currencyCode } image { url altText } } } } } } } }"
    ).then(function (data) {
      catalog = mapProducts(data);
      document.documentElement.classList.add("shop-ready");
      route();
    }).catch(function () {
      document.documentElement.classList.add("shop-ready");
      showLoadError();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
