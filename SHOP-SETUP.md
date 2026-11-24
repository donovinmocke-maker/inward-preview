# Setting up the Inward shop

The Shop page is already on the site. Until it is connected, it shows five example products and does not take payment. Connecting the real shop means creating a Shopify store in Katie’s name, then pasting two values into one file. No other file needs to change.

The website never asks for a card number or a bank account. Shopify’s own checkout does that, on Shopify’s site.

## Who does what

**Katie** creates the store, installs Printful, adds the products, sets the prices, and connects her bank account inside Shopify.

**Donovin** copies the store domain and the public Storefront token into `assets/js/shop-config.js`, then publishes the site the usual way.

## 1. Katie creates the Shopify store

1. Go to [shopify.com](https://www.shopify.com) and start a store in Katie’s own name (or her business name, if she sells that way).
2. Choose the **Basic** plan. Basic is enough. Checkout stays on Shopify’s own page, so a more expensive plan is not required for this site.
3. Finish Shopify’s questions about the business. Use Katie’s real details. This is her store, not a store owned by the website.

When Shopify shows **Settings → Domains**, write down the address that ends in `.myshopify.com`. It looks like `inward-with-katie.myshopify.com`. That is the domain the website needs.

## 2. Katie installs Printful

Printful prints and ships each order after someone pays. Nothing is printed in advance.

1. In Shopify admin, open the **Shopify App Store**.
2. Install the **Printful** app (the one made by Printful).
3. Create a Printful account in Katie’s name and connect it to this Shopify store.
4. Add a payment method inside Printful when it asks. Printful bills the store for the blank item, the print, and its own shipping. That card is saved in Printful, not on this website.

## 3. Katie adds products and sets prices

1. Design the pieces in Printful (tee, hoodie, mug, and whatever else she wants). Publish them so they appear as products in Shopify.
2. Set the **customer price** in Shopify. That is the price people pay. It should be higher than Printful’s cost, or the order loses money.
3. The names, photos, options (size, colour), and prices on the website all come from Shopify. They are not typed into the website.

## 4. Turn on the Headless channel and copy the public token

The website reads products and starts checkout through Shopify’s Storefront API. The Headless channel is how Shopify hands out the key for that.

1. In Shopify admin, install the **Headless** channel from the Shopify App Store. It is free and made by Shopify. (If Shopify offers “create a storefront” during install, do that and name it “Inward website”.)
2. Open **Sales channels → Headless**, then the storefront.
3. Next to **Storefront API permissions**, choose **Edit** and turn these on, then save:
   - Read products (`unauthenticated_read_product_listings`)
   - Read checkouts (`unauthenticated_read_checkouts`)
   - Write checkouts (`unauthenticated_write_checkouts`)
4. On the same storefront, copy the **Public access token**.

   There is also a **Private access token**. Do not copy that one. It is a secret. The public token is the only one that belongs on the website. It is safe for visitors to see. It can list products and open a checkout. It cannot see orders, change prices, refund anyone, or reach the bank account.

5. Publish every product to the **Headless** channel as well as the Online Store. On a product, this is the same place Online Store is switched on (Sales channels and apps). If Headless is off, the website shows an empty shop.

An Admin API token (it starts with `shpat_`) is a different key entirely. Never paste it into the website. Anyone who can view the site would then have the keys to the whole store.

## 5. Katie connects payouts, inside Shopify only

In Shopify admin, open **Settings → Payments** and finish Shopify Payments (or the payout method Shopify offers for her country). Shopify will ask for a bank account. That form is on Shopify’s site, behind Katie’s login. Do not type a bank account or a card number into this website, an email, or a chat. The site has nowhere to put them.

## 6. Donovin pastes the domain and the public token

Open this file and edit only the two empty strings:

`assets/js/shop-config.js`

```javascript
window.INWARD_SHOP = {
  domain: "inward-with-katie.myshopify.com",
  storefrontToken: "paste-the-public-token-here"
};
```

- `domain` is the `.myshopify.com` address from step 1. No `https://` and no slash at the end.
- `storefrontToken` is the public token from step 4.

Leave both strings empty to stay in preview. Example products stay up, and Checkout explains that payment is not open yet.

Save the file and publish the site the way this preview is normally published. Do not edit `shop.js` or the product pictures. The page switches off the examples by itself once both values are real.

If the public token is ever replaced in Shopify, paste the new public token into the same two lines. The old one stops working.

## What Shopify handles after that

Once a visitor presses Checkout, they leave this site and pay on Shopify’s checkout page. This site does not see the card.

Shopify then takes care of:

- The order
- The receipt email
- Shipping emails and tracking
- Tax
- Refunds (from Shopify admin; if the item was already printed, Printful’s side is handled in the Printful app)

Printful receives the paid order, prints it, and ships it. The customer pays Katie’s price. Printful charges the store its own cost separately.

The cart on this site only shows a subtotal. Shipping and tax appear at Shopify checkout, after Katie’s shop settings are filled in.

## How to tell it’s working

- Before the two values are set, the shop says **Example products. Preview only.** Checkout does not leave the page, and it says checkout opens once the store is connected.
- After they are set, the example products disappear. Katie’s products and prices show instead. Checkout opens Shopify’s checkout page.
- If the shop says it couldn’t load, the domain or the public token is wrong, or the products are not published to the Headless channel.
- If a warning says a private token was pasted into the site, delete it from `shop-config.js` immediately and paste only the public token.
