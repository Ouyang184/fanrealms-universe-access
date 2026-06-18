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
