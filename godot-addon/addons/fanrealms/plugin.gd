@tool
extends EditorPlugin

var _dock: Control

func _enter_tree() -> void:
	# Dock is built in Task 5; for now register an empty placeholder so the
	# plugin loads cleanly.
	_dock = VBoxContainer.new()
	_dock.name = "FanRealms"
	add_control_to_dock(DOCK_SLOT_LEFT_UR, _dock)

func _exit_tree() -> void:
	if _dock:
		remove_control_from_docks(_dock)
		_dock.free()
		_dock = null
