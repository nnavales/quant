use serde::Deserialize;
use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::Manager;
use tauri::WindowEvent;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

struct SidecarChild(Mutex<Option<CommandChild>>);

#[derive(Deserialize)]
struct Config {
    port: Option<u16>,
    mode: Option<String>,
}

fn config_path() -> PathBuf {
    let is_dev = std::env::var("APP_ENV").unwrap_or_default() == "dev";

    if is_dev {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(".summit").join("config.json");
        }
        if let Ok(home) = std::env::var("USERPROFILE") {
            return PathBuf::from(home).join(".summit").join("config.json");
        }
        return PathBuf::from("./data/config.json");
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

fn read_config() -> Option<Config> {
    let path = config_path();
    let data = fs::read_to_string(&path).ok()?;
    serde_json::from_str(&data).ok()
}

fn read_api_port() -> u16 {
    read_config().and_then(|c| c.port).unwrap_or(43123)
}

fn read_mode() -> String {
    read_config().and_then(|c| c.mode).unwrap_or_else(|| "user".to_string())
}


fn wait_for_api(timeout: Duration) -> Result<u16, String> {
    let start = Instant::now();
    let mut last_port: u16 = 0;

    while start.elapsed() < timeout {
        let port = read_api_port();
        if port != last_port {
            last_port = port;
            eprintln!("[summit] detected API port: {}", port);
        }

        let addr = format!("127.0.0.1:{}", port);
        if TcpStream::connect(&addr).is_ok() {
            return Ok(port);
        }

        thread::sleep(Duration::from_millis(200));
    }

    Err(format!(
        "API did not become ready within {:?}",
        timeout
    ))
}

fn wait_for_api_port(port: u16, timeout: Duration) -> Result<(), String> {
    let addr = format!("127.0.0.1:{}", port);
    let start = Instant::now();

    while start.elapsed() < timeout {
        if TcpStream::connect(&addr).is_ok() {
            return Ok(());
        }
        thread::sleep(Duration::from_millis(200));
    }

    Err(format!("API not responding on port {} within {:?}", port, timeout))
}

fn spawn_sidecar(app: &tauri::App) -> Result<(), String> {
    let (_rx, child) = app.shell()
        .sidecar("summit-api")
        .map_err(|e| format!("sidecar command: {}", e))?
        .spawn()
        .map_err(|e| format!("spawn: {}", e))?;

    app.manage(SidecarChild(Mutex::new(Some(child))));

    match wait_for_api(Duration::from_secs(30)) {
        Ok(port) => {
            eprintln!("[summit] API ready on port {}", port);
            Ok(())
        }
        Err(e) => {
            eprintln!("[summit] warning: {}", e);
            Err(e)
        }
    }
}

fn check_service_mode(app: &tauri::App) -> Result<(), String> {
    let port = read_api_port();
    match wait_for_api_port(port, Duration::from_secs(5)) {
        Ok(()) => {
            eprintln!("[summit] API service running on port {}", port);
            Ok(())
        }
        Err(_) => {
            eprintln!("[summit] API service not running on port {}", port);
            // Emit event to frontend so it can show a toast
            let _ = app.emit("api-not-running", ());
            Err("API service not running".to_string())
        }
    }
}

#[tauri::command]
fn get_port() -> Result<u16, String> {
    let path = config_path();
    let data = fs::read_to_string(&path).map_err(|e| format!("read config: {}", e))?;
    let config: Config =
        serde_json::from_str(&data).map_err(|e| format!("parse config: {}", e))?;
    Ok(config.port.unwrap_or(43123))
}

#[tauri::command]
fn get_mode() -> String {
    read_mode()
}

#[tauri::command]
fn is_dev() -> bool {
    std::env::var("APP_ENV").unwrap_or_default() == "dev"
}

#[tauri::command]
fn set_mode(mode: String, app: tauri::AppHandle) -> Result<(), String> {
    let path = config_path();
    let data = fs::read_to_string(&path).map_err(|e| format!("read config: {}", e))?;
    let mut config: serde_json::Value =
        serde_json::from_str(&data).map_err(|e| format!("parse config: {}", e))?;

    config["mode"] = serde_json::Value::String(mode);

    let json = serde_json::to_string_pretty(&config).map_err(|e| format!("serialize: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("write config: {}", e))?;

    app.restart();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let is_dev = std::env::var("APP_ENV").unwrap_or_default() == "dev";
            let force_sidecar = std::env::var("SIDECAR").unwrap_or_default() == "1";

            if !is_dev || force_sidecar {
                let mode = read_mode();
                match mode.as_str() {
                    "service" => {
                        let _ = check_service_mode(app);
                    }
                    _ => {
                        // Default to user mode
                        let _ = spawn_sidecar(app);
                    }
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let mode = read_mode();
                if mode == "user" {
                    if let Some(state) = window.app_handle().try_state::<SidecarChild>() {
                        if let Ok(mut guard) = state.0.lock() {
                            if let Some(child) = guard.take() {
                                let _ = child.kill();
                                eprintln!("[summit] sidecar killed on window close");
                            }
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_port,
            get_mode,
            set_mode,
            is_dev
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
