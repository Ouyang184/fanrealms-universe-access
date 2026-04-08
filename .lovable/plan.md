

# Color Palette Update: Cool Blue-Gray

Shift the entire theme from warm orange to a cool steel-blue palette inspired by GitHub/Linear.

## Changes

### `src/index.css` — Update CSS variables

**Light mode:**
- `--primary`: `214 60% 50%` (steel blue)
- `--primary-foreground`: `0 0% 100%`
- `--ring`: `214 60% 50%`
- `--chart-1` through `--chart-5`: cool-toned variants

**Dark mode:**
- `--background`: `220 16% 7%` (deeper cool black)
- `--foreground`: `214 15% 90%`
- `--card`: `220 14% 10%`
- `--card-foreground`: `214 15% 90%`
- `--popover` / `--popover-foreground`: match card
- `--primary`: `214 60% 55%` (slightly brighter for dark)
- `--primary-foreground`: `220 16% 7%`
- `--secondary`: `216 12% 14%`
- `--secondary-foreground`: `214 10% 72%`
- `--muted`: `216 12% 14%`
- `--muted-foreground`: `216 10% 48%`
- `--accent`: `216 12% 14%`
- `--border`: `216 12% 16%`
- `--input`: `216 12% 16%`
- `--ring`: `214 60% 55%`

### `src/pages/Landing.tsx` — Update accent references

Replace the warm orange `text-primary` on the hero span with the new blue — no code change needed since it uses CSS vars, but verify the hero text `"build, share, and earn."` still reads well in blue. The pill badges and button colors all use `--primary` so they update automatically.

### No other files need changes
All components reference CSS variables, so the palette propagates globally.

