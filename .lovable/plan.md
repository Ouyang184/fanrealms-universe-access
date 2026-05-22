## Goal
The `/payment` (subscription checkout) page is hardcoded to a black background with `text-white`, `bg-gray-900`, `text-gray-400`, etc. It ignores the project's design system and looks out of place vs. the rest of FanRealms. Fix by swapping hardcoded colors for semantic Tailwind tokens (`background`, `card`, `foreground`, `muted-foreground`, `border`, `primary`).

## Files to update
All under `src/components/payment/` plus the Stripe Elements appearance:

1. **PaymentForm.tsx** — wrapper: `bg-black text-white` → `bg-background text-foreground`; inner cards use `bg-card`, `text-muted-foreground`.
2. **PaymentMethodSection.tsx** — `text-white` → `text-foreground`; `bg-gray-900 border-gray-700` → `bg-card border-border`.
3. **PaymentAmountSection.tsx** — `text-gray-400` → `text-muted-foreground`; `bg-gray-900 border-gray-700` → `bg-card border-border`; input `bg-transparent border-gray-600 text-white` → `bg-transparent border-border text-foreground`.
4. **OrderSummary.tsx** — `bg-gray-900 border-gray-800` → `bg-card border-border`; all `text-white` → `text-foreground` (or remove, inherits); `text-gray-400` → `text-muted-foreground`; help-centre hover → `hover:text-foreground`.
5. **PaymentTerms.tsx** — `text-gray-400` → `text-muted-foreground`.
6. **PaymentButtons.tsx** — cancel button `border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white` → use shadcn `variant="outline"` defaults (border-border, hover bg-accent).
7. **PaymentSuccess.tsx** — `bg-black text-white` → `bg-background text-foreground`; card + muted text tokens.
8. **PaymentPage.tsx** — Stripe `Elements` `appearance: { theme: 'stripe' }` → switch to `'flat'` with `variables` pulled from CSS HSL vars so the Stripe card input matches (background, text, border, primary).

## Out of scope
- No layout changes, no copy changes, no logic changes.
- `CommissionPaymentPage` not touched unless the user asks.

## Expected result
Payment page renders in the app's light/dark theme (cyan-teal primary, neutral card surfaces) instead of a pure-black slab, with proper contrast in both modes.