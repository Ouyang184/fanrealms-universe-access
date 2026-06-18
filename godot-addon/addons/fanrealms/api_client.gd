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
