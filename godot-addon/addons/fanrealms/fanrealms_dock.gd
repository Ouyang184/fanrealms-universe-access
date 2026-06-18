@tool
class_name FanRealmsDock
extends VBoxContainer

const Lib = preload("res://addons/fanrealms/lib.gd")
const ApiClient = preload("res://addons/fanrealms/api_client.gd")

var _client: FanRealmsApiClient
var _list_container: VBoxContainer
var _status: Label
var _fs_rescan := Callable()  # set by the plugin to trigger an editor rescan
var _pending_title := "asset"

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
	if _status:
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
