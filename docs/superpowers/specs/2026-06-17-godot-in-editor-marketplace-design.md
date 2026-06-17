# Godot In-Editor Marketplace (v1) — Design

**Date:** 2026-06-17
**Status:** Approved for planning
**Author:** Jake (FanRealms) with Claude

## Goal

Find out, as cheaply as possible, whether "get Godot assets without leaving the
editor" is a real enough draw to build FanRealms around — before sinking months
into it. v1 is a **test**, delivered as a working demo we can put in front of a
warm lead (Quaternius) and the wider Godot community.

This is the platform's **wedge**: a creator in the target market said the
successful asset sites are either engine-specific or have a unique feature, and
named Unity-style in-editor integration as the kind of thing that draws people
in. Godot's built-in asset library is free-only and clunky, so there is a real
gap and no incumbent.

## Success criteria

1. **It works:** a Godot dev installs the addon, browses free assets, and
   one-click imports one into their project without leaving the editor.
2. **Quaternius reacts well:** opens it, sees his own CC0 models import into
   Godot, and is willing to mention it to his audience.
3. **Real usage:** some number of Godot devs install it and import something.
   Usage (not signups) is the signal.

If those happen, the wedge is validated. If the demo lands flat even with a
unique feature and a warm audience, that is also a cheap, clear answer.

## Explicitly out of scope for v1 (this is v2)

- Login / accounts inside the editor
- Paid asset purchase and import
- Download analytics / per-user library
- Search and filtering beyond a basic list
- Godot 3.x support (v1 targets Godot 4.x only)
- Addon auto-update

## Constraints discovered in the codebase

- Asset files live in the **private** `product-files` storage bucket. They are
  not publicly downloadable.
- The existing `get-download-url` edge function **requires a logged-in JWT**
  even for free assets (it only skips the *purchase* check when price is 0).
  So anonymous download needs a **new, free-only public endpoint**.
- `digital_products` has an `engine` column (values include `'Godot'`) and a
  `price` column (free = 0 or null). Downloadable assets have `asset_file_path`
  (storage) and/or `asset_url` (external link).
- As of writing, the site has 2 published assets, 0 free, 0 free Godot — so the
  plugin needs seeded content to demo against.

## Architecture

Three pieces:

1. **`godot-marketplace` edge function** — new, public (no JWT), free-only API.
2. **Godot 4.x editor addon** (`addons/fanrealms/`) — the in-editor UI.
3. **Existing `product-files` storage** — reached only via short-lived signed
   URLs the edge function generates. Paid files are never exposed.

```
Godot editor (addon)  --HTTP-->  godot-marketplace edge function
                                   |  (service role)
                                   +--> digital_products (filter: published,
                                   |     price 0/null, engine='Godot')
                                   +--> storage.product-files (signed URL, 1h)
```

## Component: `godot-marketplace` edge function

Public function, `verify_jwt = false`. Single function, `POST` with a JSON
body; the `action` field selects behavior (`"list"` or `"download"`). This
mirrors the existing edge-function convention in this codebase (JSON body in,
JSON out, shared `corsHeaders`).

### `list`
Returns an array of free, published, Godot, downloadable assets. Each item:

- `id` (uuid)
- `title`
- `short_description`
- `cover_image_url`
- `creator_name`
- `creator_url` (link back to the creator — their website/profile)
- `file_name` (basename of `asset_file_path`, or derived from `asset_url`)
- `category`
- `tags`
- `updated_at`

Query filter (service role, bypasses RLS for a clean read):
`status = 'published' AND (price IS NULL OR price = 0) AND engine = 'Godot'
AND (asset_file_path IS NOT NULL OR asset_url IS NOT NULL)`.

### `download`
Input: `{ asset_id: uuid }`. Steps:

1. Validate `asset_id` is a UUID.
2. Fetch the product (service role).
3. **Re-check** it is `published`, `price` is 0/null, and `engine = 'Godot'`.
   If not, return 403/404. This hard guard means the public endpoint can never
   return a paid file even if asked.
4. If `asset_file_path` present → return a 1-hour signed URL from
   `product-files`. Else if `asset_url` present → return that URL.
5. On any storage error → 500 with a generic message.

### Security reasoning
Anyone can already obtain free assets, so serving them without auth is fine.
The endpoint filters to free assets server-side at both `list` and `download`,
so it cannot be used to enumerate or fetch paid files. Signed URLs expire in
1 hour. No write paths exist.

## Component: Godot addon (`addons/fanrealms/`)

Standard Godot 4.x addon: `plugin.cfg` + an `EditorPlugin` script that adds a
dock.

### UI
- A "FanRealms" dock (left or right slot).
- On open / refresh, calls `list` via `HTTPRequest`, renders a scrollable list
  of asset cards: thumbnail (`cover_image_url`), title, creator credit with a
  clickable link back, and an **Import** button.
- Clear non-blocking states for: loading, empty, and error.

### Import flow (the core "wow")
On **Import**:
1. Call `download` for the asset id, get a URL.
2. `HTTPRequest` the file bytes to a temp location.
3. If the file is a `.zip` → extract into `res://fanrealms/<asset-slug>/` using
   `ZIPReader`. If a single file → write it into `res://fanrealms/<asset-slug>/`.
4. Call `EditorInterface.get_resource_filesystem().scan()` so Godot imports the
   new files immediately.
5. Show success (and the credit/link) in the dock.

### Version handling
On load, check the Godot version. If not 4.x, show a clear "requires Godot 4.x"
message instead of failing obscurely.

## Content seeding (no new code)

To make the demo non-empty, upload ~10–15 **CC0** Godot-ready assets through the
existing dashboard upload flow as **free** assets with `engine = 'Godot'`:

- Quaternius CC0 models (glTF) and Kenney CC0 packs.
- Each with creator credit + link back to their page in the description.
- **Hard rule: CC0 only.** No "free but rights-reserved" assets.

This uses the normal upload UI; no code is required for seeding.

## Distribution

- Develop the addon in the repo under `godot-addon/` (or `addons/fanrealms/`
  within a small example project).
- For the Quaternius demo: send the addon as a zip or a GitHub link.
- Publishing to Godot's AssetLib for organic discovery is a later step, not a
  v1 blocker.

## Error handling summary

| Failure | Behavior |
| --- | --- |
| Network error on `list` | Dock shows "Couldn't reach FanRealms. Retry." |
| Empty list | Dock shows "No free Godot assets yet." |
| `download` returns error | Toast/inline error, import aborts cleanly |
| Zip extraction fails | Error message, partial files cleaned up |
| Non-4.x Godot | "Requires Godot 4.x" notice, controls disabled |
| Paid/invalid asset id to `download` | 403/404 from endpoint, handled as error |

## Testing strategy

**Edge function (automated):**
- `list` returns only free + published + Godot assets (seed a paid one and a
  non-Godot one; assert they are excluded).
- `download` for a free Godot asset returns a usable signed URL.
- `download` for a paid asset id returns 403/404 and no URL.
- `download` for a non-existent / malformed id returns 400/404.

**Addon (mostly manual + unit where possible):**
- Unit-test the non-UI helpers: slug derivation, zip-vs-single detection, the
  target res:// path builder.
- Manual end-to-end in a real Godot 4 project: install addon → dock loads list
  → Import a seeded asset → file lands in `res://fanrealms/...` and imports →
  credit/link visible.

## Open questions / future (v2+)

- Login + paid purchase/import (the money path).
- Per-user library and download analytics.
- Search/filter, categories, sorting.
- Godot AssetLib publication for discovery.
- Auto-update of the addon.
