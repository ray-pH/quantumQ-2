mod legacy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![legacy::read_legacy_save])
        .run(tauri::generate_context!())
        .expect("failed to run QuantumQ");
}
