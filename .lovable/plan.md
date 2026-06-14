## Add multi-engine support to the marketplace

Right now every asset is tagged with `godot_version` and the marketplace UI is Godot-only. To list RPG Maker plugins (and future Unity/Unreal/Other items) cleanly, we'll add a proper **Engine** field alongside the existing version field — minimal migration, no rename, no data loss.

### Database (one migration)

Add a single column to `digital_products`:

- `engine TEXT` — values: `'Godot'`, `'RPG Maker'`, `'Unity'`, `'Unreal'`, `'Other'`, or `NULL` (engine-agnostic).
- Backfill: every existing row gets `engine = 'Godot'` (safe — only Godot assets exist today).
- No rename of `godot_version`. We'll repurpose it in UI as "engine version" (column stays `godot_version` to avoid touching 8+ files of types/selects/hooks). Values per engine:
  - Godot → `Godot 4.3+`, `Godot 4.2`, `Godot 4.1`, `Godot 4.0`, `Godot 3.x`
  - RPG Maker → `MZ`, `MV`, `VX Ace`, `XP`, `2003`
  - Unity → `6 LTS`, `2022 LTS`, `2021 LTS`
  - Unreal → `5.x`, `4.x`
  - Other / null → no version dropdown

### Upload forms (`AssetFormDialog.tsx` + `DashboardAssetDetail.tsx`)

Two dropdowns instead of one:
1. **Engine** (required) — replaces the current single "Godot Version" select. Default = `Godot`.
2. **Engine version** (optional) — options change based on the selected engine. Hidden entirely for `Other`.

Switching engines resets the version to the first option for that engine.

### Marketplace filters (`MarketplaceSidebar.tsx` + `Marketplace.tsx`)

Sidebar becomes a two-level filter:

```text
Engine
  All engines        (default)
  Godot
    Godot 4.3+
    Godot 4.2
    ...
  RPG Maker
    MZ
    MV
    ...
  Unity
  Unreal
  Other
```

Selecting an engine filters the list; selecting a sub-version filters further. State in `Marketplace.tsx` gains an `engine` filter alongside the existing `godotVersion` (renamed in-component to `engineVersion`).

### Product detail (`ProductDetail.tsx`)

Show both fields when present:

```text
Engine:   RPG Maker
Version:  MZ
```

Falls back to just one or hides the row entirely if both are null.

### Data layer (`useMarketplace.ts`, `useSellerProfile.ts`)

- Add `engine` to the SELECT lists.
- Add `engine?: string` to the create/update payload types.
- No RPC/policy changes needed — RLS on `digital_products` is unchanged.

### Out of scope

- Renaming `godot_version` → `engine_version` (deferrable; would touch types.ts which is regenerated, but also 6 hand-written files. Not worth it now.)
- Category/tag changes — RPG Maker plugins can live under existing "Plugins & Addons", "Scripts & Systems", "2D Assets", etc.
- Engine-specific badges/icons on cards (can add later).
- Backfill UX for creators to retag — defaults to Godot, they can edit any asset to change it.

### Technical notes

- New column is nullable; no constraint enforcing engine-version pairing (kept loose for flexibility).
- Existing `godot_version` filter in `Marketplace.tsx` stays as the version-level filter, just renamed in scope.
- Sidebar collapse/expand for engine sub-versions: simple — only show sub-versions for the currently selected engine, matching the existing accordion-free pattern in `MarketplaceSidebar.tsx`.
