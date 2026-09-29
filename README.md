# Chebii Builds

A clean, no-build website for selling and sharing designs, 3D models, plans and teaching resources.
Plain HTML, CSS and JavaScript. No frameworks, no installs. Everything you sell is listed in **one file**: `data/site.json`.

## Folder map

```
chebii-builds/
├── index.html            page structure (rarely touched)
├── assets/
│   ├── css/style.css     colours and layout (palette is at the top)
│   └── js/app.js         builds the shop from site.json (rarely touched)
├── data/
│   └── site.json         YOUR CONTENT: site info, categories, products
└── products/
    └── <product-name>/   one folder per product: images, files
```

## 1. Put it online (one time, about 5 minutes)

1. Create a GitHub repo, for example `chebii-builds`. Keep it **Public** (free GitHub Pages needs that).
2. Upload everything in this folder, or from a terminal:
   ```bash
   git init
   git add .
   git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/chebii-builds.git
   git push -u origin main
   ```
3. On GitHub: **Settings > Pages > Build and deployment > Deploy from a branch > `main` / `(root)` > Save**.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/chebii-builds/`.

## 2. Edit your details

Open `data/site.json` and update the `site` block: name, tagline, about text, WhatsApp number (country code, no `+` or spaces), email, and your GitHub link.

## 3. Add a product (the routine you'll repeat)

1. Make a folder: `products/mombasa-logo-pack/` (lowercase, dashes, no spaces).
2. Drop in your preview image, for example `preview.jpg` (aim for 1200x900, under 300 KB).
3. Open `data/site.json` and copy this into the `products` list (mind the commas between items):

```json
{
  "title": "Mombasa Logo Pack",
  "category": "graphics",
  "description": "20 editable logo templates in AI and PNG.",
  "price": 800,
  "tags": ["logo", "branding"],
  "image": "products/mombasa-logo-pack/preview.jpg",
  "file": "",
  "buyLink": "",
  "date": "2026-10-05",
  "published": true
}
```

4. Commit and push. The site updates by itself in about a minute.

### What each field does

| Field | Meaning |
|---|---|
| `category` | Must match an `id` in `categories`: `graphics`, `models`, `plans`, `teaching` |
| `price` | `0` = free with a Download button. Any other number = paid |
| `image` | Preview picture path. Leave `""` to show the striped placeholder |
| `file` | Download path, **free items only**, e.g. `products/phone-stand/phone-stand.stl` |
| `buyLink` | Optional payment link (Paystack, Gumroad, Lemon Squeezy, PayPal). Empty = the Order button opens WhatsApp with the product name filled in |
| `date` | Newest dates show first |
| `published` | `false` hides a product without deleting it |

### Add a new category

Add a line to `categories`, for example `{ "id": "printing", "name": "3D print services" }`. It appears as a filter automatically.

### Remove the samples

The three "Sample:" products are placeholders. Delete them from `site.json` (and their folders in `products/`) once you've added your own. Their free download paths point to files that don't exist yet.

## 4. Selling: read this before uploading paid files

A public GitHub repo means **anyone can open any file inside it**. So:

- **Free items:** put the file in the product folder and set `file`. Fine.
- **Paid items:** put only the **preview image** in the repo. Keep the real files in Google Drive (or similar), and send the link after the customer pays (M-Pesa, or a `buyLink`). Never set `file` on paid items.

Add watermarks to preview images so they can't be reused.

## 5. Change the look

Open `assets/css/style.css`. The palette sits at the top:

| Name | Hex | Used for |
|---|---|---|
| plate | `#EDF1F2` | page background |
| resin | `#0F2A33` | text, dark layers |
| cobalt | `#2340E6` | buttons |
| safety | `#FFC629` | yellow highlight and layer stripes |
| sage | `#6E9A8C` | "Free" label |

Dark mode follows the visitor's phone or computer setting.

## 6. Test on your computer

Double-clicking `index.html` won't load the products (browsers block it). Use either:

- VS Code with the **Live Server** extension: right-click `index.html` > Open with Live Server, or
- Terminal in this folder: `python -m http.server 8000`, then open `http://localhost:8000`.

## 7. Tips for 3D models

- Export printable models as `.stl` or `.3mf`, and always include a rendered preview image.
- Note the material and layer height in the description (for example "PLA, 0.2 mm") once you start printing your own.
- Files over 100 MB can't be pushed to GitHub. Host big files on Drive and link them.

## Troubleshooting

- **Shop says it could not load:** a comma is missing or extra in `site.json`. Paste it into a JSON validator.
- **Image not showing:** check the path and lowercase spelling exactly.
- **Changes not visible:** wait a minute, then hard refresh (Ctrl+Shift+R).
