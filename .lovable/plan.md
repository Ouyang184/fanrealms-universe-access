

# Redesign Landing Page: Strip AI Patterns

The previous redesign only touched the authenticated home page (`HeroSection.tsx`, etc.). The actual page shown at `/` is `src/pages/Landing.tsx` — a 375-line file full of purple gradients, sparkle icons, animated glowing orbs, and hover-scale effects. This is what needs to change.

## What's wrong now

- Purple gradient text (`bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400`)
- Sparkle icons (`<Sparkles>`) used as decorative badges
- Animated pulsing orbs (`bg-purple-500/10 rounded-full blur-xl animate-pulse`)
- Background glow effects (`bg-gradient-to-r from-purple-500/20 via-blue-500/20`)
- Heavy hover animations (`hover:scale-105 hover:rotate-1`)
- Purple-tinted cards with `backdrop-blur-sm`
- "The creator economy, reimagined" tagline with sparkle icon
- Old messaging ("Support creators. Get exclusive content.") — doesn't match the indie marketplace pivot

## What it becomes

A clean, text-forward landing page matching the itch.io / Linear aesthetic already established in the inner pages. No gradients, no sparkles, no glowing orbs.

### Hero section
- Plain white heading on dark background: **"The indie marketplace for creators and makers."**
- One-line subtitle in muted gray
- Two buttons: solid primary "Browse Projects" + text-only "Start creating →"
- No badge, no sparkle icon, no background images, no floating elements
- Remove hero background image imports entirely

### "How it works" section (replaces "Empowering Creators Worldwide")
- Three columns with a number, title, and short description
- No cards, no background images, no hover-scale animations
- Reuse the same pattern from the authenticated `HowItWorks.tsx`

### CTA section (replaces "Ready to Transform Your Creativity?")
- Simple centered text block: heading + subtitle + one button
- No card wrapper, no sparkle icon, no gradient borders, no pulsing background blobs

### Footer
- Compact 4-column link grid (keep existing structure)
- Remove all `text-purple-300` hover colors — use `hover:text-foreground`
- Remove social media hover-scale animations
- Single-line copyright at bottom

### Navigation header
- Keep it simple: Logo left, "Log in" + "Sign up" right
- Sign up button: solid primary (teal from CSS vars), not `bg-purple-600`

## Files to change

- **`src/pages/Landing.tsx`** — Full rewrite of the template (keep routing/structure, replace all visual markup)
- **Remove unused imports**: `heroBackground`, `heroBackground2`, `creatorBackground`, `Sparkles`, `Heart`, `Star`, `CheckCircle2` (if no longer used)

## Files NOT changed
- No CSS variable changes needed (already updated in prior redesign)
- No routing changes
- No other components affected

