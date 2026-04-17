
## Fix: Footer import in MarketplaceLayout

`Footer` is a default export, but `MarketplaceLayout.tsx` imports it as a named export.

**Change** (`src/components/Layout/MarketplaceLayout.tsx` line 3):
```ts
import Footer from "@/components/Layout/Footer";
```

That's the only change needed to clear the build error.
