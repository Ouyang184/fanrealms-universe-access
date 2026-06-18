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
