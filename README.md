# ClarityCart AI | Embeddable product advisor

<p align="center">
  <img src="./demo.gif" alt="ClarityCart AI Demo" width="700" />
</p>

## Problem & Value
ClarityCart AI reads product details from an e-commerce page and uses them to answer shoppers’ questions. This repository contains the browser widget and the Vercel function that calls Gemini. See the [product landing page source](https://github.com/agouti-ar/claritycart-landing) for the marketing site.

## Core Features
- **Zero-dependency Vanilla JS**: Lightweight and fast.
- **Shadow DOM**: Fully encapsulated styling that won't conflict with your store's CSS.
- **Autonomous Data Scraping**: Automatically extracts product context via JSON-LD, OpenGraph, or DOM fallback.
- **Vercel function**: Keeps the Gemini API key on the server.
- **Gemini AI Integration**: Tries configured Gemini Flash models in order.
- **Translate Guard**: Protected against Google Translate DOM mutations (`translate="no"`).

## Quick Start
To integrate ClarityCart into your store, simply include the script just before the closing `</body>` tag on your product pages:

```html
<script src="https://clarity-cart-widget.vercel.app/clarity.js" defer></script>
```

The widget will autonomously mount itself to the page, parse the product data, and be ready to assist your customers.

## Configuration
1. **API Key**: Set your `GEMINI_API_KEY` in your Vercel project environment variables.
2. **CORS**: For production, restrict access to your widget backend by updating `api/chat.js`:
   ```javascript
   // Production security: replace '*' with allowed domains (e.g. 'https://yourstore.com')
   res.setHeader('Access-Control-Allow-Origin', 'https://yourstore.com');
   ```

Before exposing a production endpoint, add abuse protection and request limits. CORS controls browser access and does not authenticate direct requests.
