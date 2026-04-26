## Export the FanRealms logo (mark only)

I'll extract the castle SVG from `src/components/Logo.tsx` (the blue rounded square with white merlons + tower) and render it to the formats you picked. Nothing in the app changes — these are downloadable files only.

### What you'll get in `/mnt/documents/`

**Transparent PNG (1024px)**
- `fanrealms-mark-1024.png` — high-res, transparent background, the blue mark on its own. Good for slides, social, README headers.

**Favicon set**
- `favicon.ico` — multi-size ICO (16, 32, 48) for browser tabs
- `favicon-16.png`
- `favicon-32.png`
- `favicon-192.png` — Android home-screen
- `favicon-512.png` — PWA / maskable

All exports use the **exact SVG** from `Logo.tsx` (blue `#478CBF` background, white castle), so they match what's rendered in the app today. Background is transparent **outside** the rounded square; the square itself stays solid blue (that's the logo).

### How
1. Build the standalone SVG markup (just the `<svg>` block from `Logo.tsx`, no React wrapper).
2. Use ImageMagick (via `nix run nixpkgs#imagemagick`) to rasterize at 16/32/48/192/512/1024.
3. Combine the 16/32/48 PNGs into a single `favicon.ico`.
4. QA: open each PNG to confirm the castle is centered, crisp, and not clipped at small sizes.
5. Emit `<lov-artifact>` tags so each file shows up as a download.

### Not included (let me know if you want them)
- SVG / PDF vector versions
- Full logo with "FanRealms" wordmark
- Replacing the site's current `public/favicon.ico` with the new one

Approve and I'll generate the files.