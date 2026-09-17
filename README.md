# ClarityCart AI — Instant pre-purchase AI assistant for e-commerce

## Problem & Value
Shopping cart abandonment is a major issue in e-commerce. Often, customers leave because they can't quickly find answers about sizing, materials, or delivery. **ClarityCart AI** solves this by providing instant, AI-driven answers directly on the product page, reducing friction and increasing conversion rates.

## Core Features
- **Zero-dependency Vanilla JS**: Lightweight and fast.
- **Shadow DOM**: Fully encapsulated styling that won't conflict with your store's CSS.
- **Autonomous Data Scraping**: Automatically extracts product context via JSON-LD, OpenGraph, or DOM fallback.
- **Vercel Backend**: Secure API proxy that hides your API keys.
- **Gemini AI Integration**: Uses Gemini 3.5/2.5 Flash for rapid, accurate responses.
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
