# Godot In-Editor Marketplace (v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Godot 4.x editor addon that lets anyone browse FanRealms' free Godot assets and one-click import them into their project, backed by a new public, free-only endpoint.

**Architecture:** A Godot `EditorPlugin` addon adds a dock that calls a new public Supabase edge function (`godot-marketplace`). The function serves only free, published, `engine='Godot'` assets and returns short-lived signed URLs from the private `product-files` bucket. No login, no paid assets in v1 (those are v2). Pure GDScript logic is unit-tested headless; the endpoint is verified via curl + SQL; the in-editor import is verified manually.

**Tech Stack:** Godot 4.6 (GDScript), Supabase Edge Functions (Deno/TypeScript), Supabase Storage signed URLs, Postgres.

**Key constants (public, safe to embed):**
- Supabase URL: `https://eaeqyctjljbtcatlohky.supabase.co`
- Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A`
- Project ref: `eaeqyctjljbtcatlohky`

**Testing reality:** There is no Deno toolchain locally and no existing edge-function unit tests in this repo, so the endpoint is tested by integration (curl against the deployed function + `execute_sql` checks). Godot 4.6 IS installed (`godot` on PATH), so GDScript pure logic is unit-tested headless for real.

---

## File Structure

**New — Godot addon (lives in a self-contained dev project at repo root):**
- `godot-addon/project.godot` — minimal Godot 4 project so the addon can run/test.
- `godot-addon/addons/fanrealms/plugin.cfg` — addon manifest.
- `godot-addon/addons/fanrealms/plugin.gd` — `EditorPlugin`: registers/unregisters the dock.
- `godot-addon/addons/fanrealms/lib.gd` — pure helpers (slug, zip detection, paths, version, URL). No node deps. Unit-tested.
- `godot-addon/addons/fanrealms/api_client.gd` — `Node` wrapping `HTTPRequest` for `list`/`download`.
- `godot-addon/addons/fanrealms/fanrealms_dock.gd` — the dock UI + orchestration (browse, import).
- `godot-addon/test/run_tests.gd` — headless test runner for `lib.gd`.
- `godot-addon/README.md` — install + usage for testers (Quaternius).

**New — backend:**
- `supabase/functions/godot-marketplace/index.ts` — the public endpoint.

**Modify:**
- `supabase/config.toml` — add `[functions.godot-marketplace] verify_jwt = false`.

**Reuse:**
- `supabase/functions/_shared/cors.ts` — shared CORS headers.

---

## Task 1: Scaffold the Godot project and addon skeleton

**Files:**
- Create: `godot-addon/project.godot`
- Create: `godot-addon/addons/fanrealms/plugin.cfg`
- Create: `godot-addon/addons/fanrealms/plugin.gd`
- Create: `godot-addon/addons/fanrealms/lib.gd` (stub)

- [ ] **Step 1: Create the minimal Godot project file**

`godot-addon/project.godot`:
```ini
config_version=5

[application]
config/name="FanRealms Addon Dev"
config/features=PackedStringArray("4.6")

[editor_plugins]
enabled=PackedStringArray("res://addons/fanrealms/plugin.gd")
```

- [ ] **Step 2: Create the addon manifest**

`godot-addon/addons/fanrealms/plugin.cfg`:
```ini
[plugin]
name="FanRealms"
description="Browse and import free FanRealms Godot assets without leaving the editor."
author="FanRealms"
version="0.1.0"
script="plugin.gd"
```

- [ ] **Step 3: Create the lib stub (filled in Task 2)**

`godot-addon/addons/fanrealms/lib.gd`:
```gdscript
@tool
class_name FanRealmsLib
extends RefCounted

# Pure helpers. No node or network dependencies so they can be unit-tested
# headless. Implemented in Task 2.
```

- [ ] **Step 4: Create the EditorPlugin entry**

`godot-addon/addons/fanrealms/plugin.gd`:
```gdscript
@tool
extends EditorPlugin

var _dock: Control

func _enter_tree() -> void:
	# Dock is built in Task 6; for now register an empty placeholder so the
	# plugin loads cleanly.
	_dock = VBoxContainer.new()
	_dock.name = "FanRealms"
	add_control_to_dock(DOCK_SLOT_LEFT_UR, _dock)

func _exit_tree() -> void:
	if _dock:
		remove_control_from_docks(_dock)
		_dock.free()
		_dock = null
```

- [ ] **Step 5: Verify the project loads headless without errors**

Run: `godot --headless --path godot-addon --editor --quit`
Expected: exits 0, no script parse errors in output (it may print import messages; there must be no `SCRIPT ERROR` or `Parse Error`).

- [ ] **Step 6: Commit**

```bash
git add godot-addon
git commit -m "feat(godot): scaffold FanRealms editor addon skeleton"
```

---

## Task 2: Pure helpers in `lib.gd` (TDD, headless)

**Files:**
- Modify: `godot-addon/addons/fanrealms/lib.gd`
- Create: `godot-addon/test/run_tests.gd`

- [ ] **Step 1: Write the failing test runner**

`godot-addon/test/run_tests.gd`:
```gdscript
extends SceneTree

const Lib = preload("res://addons/fanrealms/lib.gd")

var _failures := 0

func _check(name: String, cond: bool) -> void:
	if cond:
		print("PASS: ", name)
	else:
		print("FAIL: ", name)
		_failures += 1

func _initialize() -> void:
	_check("slugify lowercases and dashes", Lib.slugify("Cool Asset!") == "cool-asset")
	_check("slugify collapses spaces", Lib.slugify("  Two   Words ") == "two-words")
	_check("slugify fallback when empty", Lib.slugify("***") == "asset")
	_check("is_zip true for .zip", Lib.is_zip("pack.ZIP") == true)
	_check("is_zip false for .glb", Lib.is_zip("model.glb") == false)
	_check("target_dir under res://fanrealms", Lib.target_dir("my-pack") == "res://fanrealms/my-pack")
	_check("endpoint_url appends function path",
		Lib.endpoint_url("https://x.supabase.co") == "https://x.supabase.co/functions/v1/godot-marketplace")
	_check("is_godot_4 true on this engine", Lib.is_godot_4() == true)

	if _failures > 0:
		push_error("%d test(s) failed" % _failures)
		quit(1)
	else:
		print("ALL TESTS PASSED")
		quit(0)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `godot --headless --path godot-addon --script res://test/run_tests.gd`
Expected: FAIL — `slugify`/`is_zip`/etc. do not exist yet (parse error or failing checks, non-zero exit).

- [ ] **Step 3: Implement the helpers**

`godot-addon/addons/fanrealms/lib.gd`:
```gdscript
@tool
class_name FanRealmsLib
extends RefCounted

# Pure helpers. No node or network dependencies so they can be unit-tested
# headless via test/run_tests.gd.

const ENDPOINT_PATH := "/functions/v1/godot-marketplace"
const INSTALL_ROOT := "res://fanrealms"

# Turn an asset title into a filesystem-safe folder name.
static func slugify(title: String) -> String:
	var lower := title.strip_edges().to_lower()
	var out := ""
	for i in lower.length():
		var c := lower[i]
		if (c >= "a" and c <= "z") or (c >= "0" and c <= "9"):
			out += c
		else:
			out += " "
	var parts := out.split(" ", false)  # false = no empty strings
	var slug := "-".join(parts)
	return slug if slug != "" else "asset"

static func is_zip(file_name: String) -> bool:
	return file_name.to_lower().ends_with(".zip")

static func target_dir(slug: String) -> String:
	return "%s/%s" % [INSTALL_ROOT, slug]

static func endpoint_url(base_url: String) -> String:
	return base_url + ENDPOINT_PATH

static func is_godot_4() -> bool:
	return Engine.get_version_info().major == 4
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `godot --headless --path godot-addon --script res://test/run_tests.gd`
Expected: prints `ALL TESTS PASSED`, exits 0.

- [ ] **Step 5: Commit**

```bash
git add godot-addon/addons/fanrealms/lib.gd godot-addon/test/run_tests.gd
git commit -m "feat(godot): add tested pure helpers for the addon"
```

---

## Task 3: The `godot-marketplace` edge function

**Files:**
- Create: `supabase/functions/godot-marketplace/index.ts`
- Modify: `supabase/config.toml`

- [ ] **Step 1: Add the function config (no JWT)**

Append to `supabase/config.toml`:
```toml
[functions.godot-marketplace]
verify_jwt = false
```

- [ ] **Step 2: Write the function**

`supabase/functions/godot-marketplace/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

const SIGNED_URL_TTL_SECONDS = 3600
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function basename(path: string | null): string {
  if (!path) return 'download'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'download'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const svc = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => null)
    const action = body?.action

    // ---- list ----
    if (action === 'list') {
      const { data, error } = await svc
        .from('digital_products')
        .select('id, title, short_description, cover_image_url, category, tags, updated_at, asset_file_path, asset_url, creator_id, price, status, engine')
        .eq('status', 'published')
        .eq('engine', 'Godot')
        .or('price.is.null,price.eq.0')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('list query error:', error)
        return json({ error: 'Failed to list assets' }, 500)
      }

      const rows = (data ?? []).filter((r: any) => r.asset_file_path || r.asset_url)
      const creatorIds = [...new Set(rows.map((r: any) => r.creator_id).filter(Boolean))]
      const creatorsById: Record<string, any> = {}
      if (creatorIds.length) {
        const { data: creators } = await svc
          .from('creators')
          .select('id, display_name, username, website')
          .in('id', creatorIds)
        for (const c of creators ?? []) creatorsById[c.id] = c
      }

      const assets = rows.map((r: any) => {
        const c = creatorsById[r.creator_id] ?? {}
        return {
          id: r.id,
          title: r.title,
          short_description: r.short_description ?? '',
          cover_image_url: r.cover_image_url ?? '',
          creator_name: c.display_name || c.username || 'Unknown',
          creator_url: c.website || '',
          file_name: r.asset_file_path ? basename(r.asset_file_path) : basename(r.asset_url),
          category: r.category ?? '',
          tags: r.tags ?? [],
          updated_at: r.updated_at,
        }
      })
      return json({ assets })
    }

    // ---- download ----
    if (action === 'download') {
      const assetId = body?.asset_id
      if (!assetId || !UUID_RE.test(assetId)) return json({ error: 'Invalid asset_id' }, 400)

      const { data: p, error } = await svc
        .from('digital_products')
        .select('id, price, status, engine, asset_file_path, asset_url')
        .eq('id', assetId)
        .maybeSingle()

      if (error || !p) return json({ error: 'Not found' }, 404)

      const price = parseFloat(String(p.price ?? '0'))
      const isFree = !isFinite(price) || price <= 0
      // Hard guard: never serve anything paid, unpublished, or non-Godot.
      if (p.status !== 'published' || p.engine !== 'Godot' || !isFree) {
        return json({ error: 'Asset not available' }, 403)
      }
      if (!p.asset_file_path && !p.asset_url) return json({ error: 'No download available' }, 404)

      if (!p.asset_file_path) {
        return json({ url: p.asset_url, file_name: basename(p.asset_url) })
      }

      const { data: signed, error: sErr } = await svc.storage
        .from('product-files')
        .createSignedUrl(p.asset_file_path, SIGNED_URL_TTL_SECONDS)
      if (sErr || !signed?.signedUrl) {
        console.error('createSignedUrl error:', sErr)
        return json({ error: 'Failed to generate download link' }, 500)
      }
      return json({ url: signed.signedUrl, file_name: basename(p.asset_file_path) })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    console.error('godot-marketplace error:', e)
    return json({ error: 'Internal server error' }, 500)
  }
})
```

- [ ] **Step 3: Deploy the function**

Deploy via the Supabase MCP `deploy_edge_function` (project_id `eaeqyctjljbtcatlohky`, name `godot-marketplace`), or `supabase functions deploy godot-marketplace` if the CLI is available. Pushing to `main` also deploys it via Lovable.

- [ ] **Step 4: Verify the SQL filter is correct (data-level check)**

Run via Supabase MCP `execute_sql` (project `eaeqyctjljbtcatlohky`):
```sql
select id, title, engine, price, status,
       (asset_file_path is not null or asset_url is not null) as downloadable
from public.digital_products
where status='published' and engine='Godot' and (price is null or price=0);
```
Expected: only free, published, Godot, downloadable rows. (May be empty until Task 6 seeding — that's fine; the next step still validates shape and the paid-rejection guard.)

- [ ] **Step 5: Integration test — `list` shape and `download` paid-rejection**

`list` returns a well-formed envelope:
```bash
curl -s -X POST "https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/godot-marketplace" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A" \
  -H "Content-Type: application/json" \
  -d '{"action":"list"}'
```
Expected: `{"assets":[...]}` (HTTP 200). Array may be empty pre-seeding.

`download` MUST reject a paid asset. Get a real paid published asset id:
```sql
select id from public.digital_products where status='published' and (price > 0) limit 1;
```
Then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/godot-marketplace" \
  -H "apikey: <anon key above>" -H "Content-Type: application/json" \
  -d '{"action":"download","asset_id":"<PAID_ASSET_ID>"}'
```
Expected: `403`. (This is the security guarantee: the public endpoint never hands out paid files.)

`download` with a malformed id:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/godot-marketplace" \
  -H "apikey: <anon key above>" -H "Content-Type: application/json" \
  -d '{"action":"download","asset_id":"not-a-uuid"}'
```
Expected: `400`.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/godot-marketplace/index.ts supabase/config.toml
git commit -m "feat(api): public free-only godot-marketplace endpoint"
```

---

## Task 4: `api_client.gd` — addon network layer

**Files:**
- Create: `godot-addon/addons/fanrealms/api_client.gd`

- [ ] **Step 1: Write the API client**

`godot-addon/addons/fanrealms/api_client.gd`:
```gdscript
@tool
class_name FanRealmsApiClient
extends Node

const Lib = preload("res://addons/fanrealms/lib.gd")

const BASE_URL := "https://eaeqyctjljbtcatlohky.supabase.co"
const ANON_KEY := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A"

# Emitted with an Array of asset dictionaries, or [] on error (err non-empty).
signal list_completed(assets: Array, err: String)
# Emitted with a download URL + file name, or "" on error (err non-empty).
signal download_completed(url: String, file_name: String, err: String)

func _headers() -> PackedStringArray:
	return PackedStringArray([
		"Content-Type: application/json",
		"apikey: " + ANON_KEY,
		"Authorization: Bearer " + ANON_KEY,
	])

func fetch_list() -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, code, _h, body):
		http.queue_free()
		if code != 200:
			list_completed.emit([], "HTTP %d" % code)
			return
		var parsed = JSON.parse_string(body.get_string_from_utf8())
		if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("assets"):
			list_completed.emit([], "Bad response")
			return
		list_completed.emit(parsed["assets"], "")
	)
	var payload := JSON.stringify({"action": "list"})
	var err := http.request(Lib.endpoint_url(BASE_URL), _headers(), HTTPClient.METHOD_POST, payload)
	if err != OK:
		http.queue_free()
		list_completed.emit([], "Request failed")

func fetch_download(asset_id: String) -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, code, _h, body):
		http.queue_free()
		var parsed = JSON.parse_string(body.get_string_from_utf8())
		if code != 200 or typeof(parsed) != TYPE_DICTIONARY or not parsed.has("url"):
			download_completed.emit("", "", "HTTP %d" % code)
			return
		download_completed.emit(parsed["url"], parsed.get("file_name", "download"), "")
	)
	var payload := JSON.stringify({"action": "download", "asset_id": asset_id})
	var err := http.request(Lib.endpoint_url(BASE_URL), _headers(), HTTPClient.METHOD_POST, payload)
	if err != OK:
		http.queue_free()
		download_completed.emit("", "", "Request failed")
```

- [ ] **Step 2: Smoke-test the client against the deployed endpoint (headless)**

Create a throwaway runner `godot-addon/test/net_smoke.gd`:
```gdscript
extends SceneTree

const ApiClient = preload("res://addons/fanrealms/api_client.gd")

func _initialize() -> void:
	var client = ApiClient.new()
	get_root().add_child(client)
	client.list_completed.connect(func(assets, err):
		if err != "":
			print("FAIL: list error ", err); quit(1)
		else:
			print("PASS: list returned %d assets" % assets.size()); quit(0)
	)
	client.fetch_list()
```
Run: `godot --headless --path godot-addon --script res://test/net_smoke.gd`
Expected: `PASS: list returned N assets` (N may be 0 pre-seeding; success = the call round-trips with no error), exits 0.

- [ ] **Step 3: Delete the throwaway smoke runner**

```bash
rm godot-addon/test/net_smoke.gd
```

- [ ] **Step 4: Commit**

```bash
git add godot-addon/addons/fanrealms/api_client.gd
git commit -m "feat(godot): API client for the godot-marketplace endpoint"
```

---

## Task 5: The dock UI and import flow

**Files:**
- Create: `godot-addon/addons/fanrealms/fanrealms_dock.gd`
- Modify: `godot-addon/addons/fanrealms/plugin.gd`

- [ ] **Step 1: Write the dock**

`godot-addon/addons/fanrealms/fanrealms_dock.gd`:
```gdscript
@tool
class_name FanRealmsDock
extends VBoxContainer

const Lib = preload("res://addons/fanrealms/lib.gd")
const ApiClient = preload("res://addons/fanrealms/api_client.gd")

var _client: FanRealmsApiClient
var _list_container: VBoxContainer
var _status: Label
var _fs_rescan := Callable()  # set by the plugin to trigger an editor rescan

func setup(fs_rescan: Callable) -> void:
	_fs_rescan = fs_rescan

func _ready() -> void:
	name = "FanRealms"
	custom_minimum_size = Vector2(280, 0)

	var header := Label.new()
	header.text = "FanRealms — Free Godot Assets"
	add_child(header)

	if not Lib.is_godot_4():
		_status = Label.new()
		_status.text = "Requires Godot 4.x"
		add_child(_status)
		return

	var refresh := Button.new()
	refresh.text = "Refresh"
	refresh.pressed.connect(_load_list)
	add_child(refresh)

	_status = Label.new()
	_status.text = "Loading…"
	add_child(_status)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(scroll)
	_list_container = VBoxContainer.new()
	_list_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_list_container)

	_client = ApiClient.new()
	add_child(_client)
	_client.list_completed.connect(_on_list)
	_client.download_completed.connect(_on_download)

	_load_list()

func _load_list() -> void:
	_status.text = "Loading…"
	for child in _list_container.get_children():
		child.queue_free()
	_client.fetch_list()

func _on_list(assets: Array, err: String) -> void:
	if err != "":
		_status.text = "Couldn't reach FanRealms. Try Refresh."
		return
	if assets.is_empty():
		_status.text = "No free Godot assets yet."
		return
	_status.text = "%d asset(s)" % assets.size()
	for a in assets:
		_list_container.add_child(_make_card(a))

func _make_card(a: Dictionary) -> Control:
	var box := PanelContainer.new()
	var v := VBoxContainer.new()
	box.add_child(v)

	var title := Label.new()
	title.text = String(a.get("title", "Untitled"))
	v.add_child(title)

	var by := Label.new()
	by.text = "by " + String(a.get("creator_name", "Unknown"))
	v.add_child(by)

	var import_btn := Button.new()
	import_btn.text = "Import"
	import_btn.pressed.connect(func():
		import_btn.disabled = true
		import_btn.text = "Importing…"
		_pending_title = String(a.get("title", "asset"))
		_client.fetch_download(String(a.get("id", "")))
	)
	v.add_child(import_btn)
	return box

var _pending_title := "asset"

func _on_download(url: String, file_name: String, err: String) -> void:
	if err != "" or url == "":
		_status.text = "Download failed."
		return
	_download_and_install(url, file_name)

func _download_and_install(url: String, file_name: String) -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, code, _h, body):
		http.queue_free()
		if code < 200 or code >= 300:
			_status.text = "Download failed (HTTP %d)." % code
			return
		_install_bytes(body, file_name)
	)
	var e := http.request(url)
	if e != OK:
		http.queue_free()
		_status.text = "Download failed."

func _install_bytes(bytes: PackedByteArray, file_name: String) -> void:
	var slug := Lib.slugify(_pending_title)
	var dir := Lib.target_dir(slug)
	DirAccess.make_dir_recursive_absolute(dir)

	if Lib.is_zip(file_name):
		var tmp := "user://_fanrealms_tmp.zip"
		var f := FileAccess.open(tmp, FileAccess.WRITE)
		f.store_buffer(bytes)
		f.close()
		var reader := ZIPReader.new()
		if reader.open(tmp) != OK:
			_status.text = "Could not read zip."
			return
		for entry in reader.get_files():
			if entry.ends_with("/"):
				continue
			var out_path := "%s/%s" % [dir, entry]
			DirAccess.make_dir_recursive_absolute(out_path.get_base_dir())
			var of := FileAccess.open(out_path, FileAccess.WRITE)
			of.store_buffer(reader.read_file(entry))
			of.close()
		reader.close()
	else:
		var out_path := "%s/%s" % [dir, file_name]
		var of := FileAccess.open(out_path, FileAccess.WRITE)
		of.store_buffer(bytes)
		of.close()

	if _fs_rescan.is_valid():
		_fs_rescan.call()
	_status.text = "Imported to %s" % dir
	_load_list()
```

- [ ] **Step 2: Wire the dock into the plugin (replace the placeholder)**

`godot-addon/addons/fanrealms/plugin.gd`:
```gdscript
@tool
extends EditorPlugin

const Dock = preload("res://addons/fanrealms/fanrealms_dock.gd")

var _dock: FanRealmsDock

func _enter_tree() -> void:
	_dock = Dock.new()
	_dock.setup(func(): get_editor_interface().get_resource_filesystem().scan())
	add_control_to_dock(DOCK_SLOT_LEFT_UR, _dock)

func _exit_tree() -> void:
	if _dock:
		remove_control_from_docks(_dock)
		_dock.free()
		_dock = null
```

- [ ] **Step 3: Verify the project still loads headless**

Run: `godot --headless --path godot-addon --editor --quit`
Expected: exits 0, no `SCRIPT ERROR` / `Parse Error`.

- [ ] **Step 4: Manual end-to-end check (requires the editor + seeded content from Task 6)**

Open the project in the Godot editor: `godot --path godot-addon -e`. Confirm:
1. A "FanRealms" dock appears (left).
2. It lists seeded free Godot assets (after Task 6). Pre-seeding it shows "No free Godot assets yet."
3. Clicking **Import** on an asset downloads it and the files appear under `res://fanrealms/<slug>/` in the FileSystem panel, imported (no errors).

Document the result (pass/fail + notes) in the task's review. This step's full pass depends on Task 6 seeding.

- [ ] **Step 5: Commit**

```bash
git add godot-addon/addons/fanrealms/fanrealms_dock.gd godot-addon/addons/fanrealms/plugin.gd
git commit -m "feat(godot): dock UI with one-click import flow"
```

---

## Task 6: Seed CC0 content (manual / operational)

This task has no code. It is required so the addon and the Quaternius demo are not empty.

- [ ] **Step 1: Pick ~10-15 CC0, Godot-ready assets**

Sources (confirm each is CC0 before use):
- Quaternius models (glTF) — CC0.
- Kenney packs — CC0.
Prefer single small packs (a few models each) so imports are fast.

- [ ] **Step 2: Upload each through the FanRealms dashboard as a FREE asset**

For each asset, in `/dashboard/assets`:
- Price: `0` (free).
- Engine: **Godot**.
- Category: **3D Assets** (or appropriate).
- Upload the asset file (zip preferred so multiple files import as a folder).
- In the description, add visible credit + link back to the creator's page. **Hard rule: CC0 only.**

- [ ] **Step 3: Verify they are visible to the endpoint**

Run via `execute_sql` (project `eaeqyctjljbtcatlohky`):
```sql
select count(*) as free_godot_downloadable
from public.digital_products
where status='published' and engine='Godot' and (price is null or price=0)
  and (asset_file_path is not null or asset_url is not null);
```
Expected: count ≥ 1 (ideally 10+).

- [ ] **Step 4: Re-run the addon list smoke check**

`curl ... {"action":"list"}` (command from Task 3 Step 5) now returns the seeded assets in `assets`.

- [ ] **Step 5: Complete the Task 5 Step 4 manual end-to-end check**

With content present, confirm a real Import lands files under `res://fanrealms/<slug>/` and Godot imports them cleanly.

---

## Task 7: Package the addon for testers (Quaternius)

**Files:**
- Create: `godot-addon/README.md`

- [ ] **Step 1: Write the README**

`godot-addon/README.md`:
```markdown
# FanRealms — Godot Asset Browser (early preview)

Browse and import free FanRealms Godot assets without leaving the editor.

## Requirements
- Godot 4.x

## Install
1. Copy the `addons/fanrealms/` folder into your Godot project's `addons/` directory.
2. In Godot: **Project → Project Settings → Plugins**, enable **FanRealms**.
3. A **FanRealms** dock appears on the left. Click an asset's **Import** to add it
   under `res://fanrealms/<asset>/`.

This is an early preview: free assets only, no account needed. Feedback welcome.
```

- [ ] **Step 2: Produce a distributable zip of just the addon**

```bash
cd godot-addon && zip -r ../fanrealms-godot-addon.zip addons/fanrealms README.md && cd ..
```
Expected: `fanrealms-godot-addon.zip` created at repo root, containing `addons/fanrealms/*` and `README.md`.

- [ ] **Step 3: Manual — install the zip into a clean test project**

Unzip into a fresh Godot 4 project's folder, enable the plugin, and confirm browse + import works exactly as in Task 5 Step 4. This simulates Quaternius's first-run experience.

- [ ] **Step 4: Commit (README only; do not commit the zip)**

```bash
echo "fanrealms-godot-addon.zip" >> .gitignore
git add godot-addon/README.md .gitignore
git commit -m "docs(godot): addon README and packaging"
```

---

## Final verification (after all tasks)

- [ ] Headless unit tests pass: `godot --headless --path godot-addon --script res://test/run_tests.gd` → `ALL TESTS PASSED`.
- [ ] Endpoint `list` returns seeded free Godot assets; `download` returns a signed URL for a free asset and `403` for a paid one.
- [ ] Fresh-project install: enable plugin → browse → Import → files land under `res://fanrealms/<slug>/` and import cleanly.
- [ ] Push to `main` so the endpoint deploys via Lovable, then hand the zip/repo to Quaternius.

---

## Notes for the implementer

- **GDScript signal lambdas** that reference `http.queue_free()` rely on `http` being captured; keep the node local as shown.
- **Engine version:** developed against Godot 4.6.1. Avoid 4.3+-only APIs where a 4.0 equivalent exists, so testers on older 4.x still work; the code above sticks to long-stable APIs (`ZIPReader`, `HTTPRequest`, `DirAccess`, `FileAccess`, `add_control_to_dock`).
- **Security invariant (do not weaken):** the endpoint must filter `status='published' AND engine='Godot' AND price 0/null` on BOTH `list` and `download`. The paid-rejection curl test (Task 3 Step 5) guards this.
- **Anon key is public** by design (it is the publishable key already shipped in the web client); embedding it in the addon is fine. Never embed the service-role key.
