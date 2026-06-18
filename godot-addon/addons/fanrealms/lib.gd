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
	var parts := out.split(" ", false)  # false = drop empty strings
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
