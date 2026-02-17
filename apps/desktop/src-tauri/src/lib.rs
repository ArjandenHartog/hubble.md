use std::{env, fs, path::PathBuf};

#[tauri::command]
fn read_file_text(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|err| format!("Failed to read file at {}: {}", path, err))
}

#[tauri::command]
fn get_launch_file_path() -> Option<String> {
    env::args_os().skip(1).find_map(|arg| {
        let path = PathBuf::from(arg);
        if path.is_file() {
            path.to_str().map(ToOwned::to_owned)
        } else {
            None
        }
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_file_text, get_launch_file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
