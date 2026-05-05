use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

#[derive(Deserialize)]
struct Config {
    port: Option<u16>,
}

fn config_path() -> PathBuf {
    let is_dev = std::env::var("APP_ENV").unwrap_or_default() == "dev";

    if is_dev {
        let local = PathBuf::from("./data/config.json");
        if local.exists() {
            return local;
        }
        let candidates = [PathBuf::from("../data/config.json"), PathBuf::from("../../data/config.json")];
        for candidate in &candidates {
            if candidate.exists() {
                return candidate.clone();
            }
        }
        return local;
    }

    // Production: OS-specific app data directory
    if cfg!(target_os = "linux") {
        if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
            return PathBuf::from(xdg).join("summit").join("config.json");
        }
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(".local").join("share").join("summit").join("config.json");
        }
    } else if cfg!(target_os = "macos") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join("Library").join("Application Support").join("summit").join("config.json");
        }
    } else if cfg!(target_os = "windows") {
        if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
            return PathBuf::from(localappdata).join("summit").join("config.json");
        }
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join("AppData").join("Local").join("summit").join("config.json");
        }
    }

    PathBuf::from("./data/config.json")
}

#[tauri::command]
fn get_port() -> Result<u16, String> {
    let path = config_path();
    let data = fs::read_to_string(&path).map_err(|e| format!("read config: {}", e))?;
    let config: Config =
        serde_json::from_str(&data).map_err(|e| format!("parse config: {}", e))?;
    Ok(config.port.unwrap_or(43123))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
