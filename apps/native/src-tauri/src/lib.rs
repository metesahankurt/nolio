use tauri_plugin_sql::{Migration, MigrationKind};

/// Window controls are handled in Rust instead of relying on WebView window
/// methods. This keeps Windows' frameless chrome on the native event path and
/// makes closing the main window terminate secondary sticky-note windows too.
#[tauri::command]
fn minimize_main_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|error| error.to_string())
}

#[tauri::command]
fn toggle_main_window_maximized(window: tauri::WebviewWindow) -> Result<(), String> {
    let is_maximized = window.is_maximized().map_err(|error| error.to_string())?;
    let result = if is_maximized {
        window.unmaximize()
    } else {
        window.maximize()
    };

    result.map_err(|error| error.to_string())
}

#[tauri::command]
fn exit_application(app: tauri::AppHandle) {
    app.exit(0);
}

/// The notes database stores only encrypted material: the wrapped vault
/// header (JSON, itself containing ciphertext) and per-note AES-GCM
/// ciphertexts. No plaintext note data ever reaches SQLite.
fn notes_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_vault_metadata_and_encrypted_notes",
        sql: "
            CREATE TABLE IF NOT EXISTS vault_metadata (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS encrypted_notes (
                id TEXT PRIMARY KEY NOT NULL,
                version INTEGER NOT NULL,
                iv TEXT NOT NULL,
                ciphertext TEXT NOT NULL
            );
        ",
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:notes.db", notes_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            minimize_main_window,
            toggle_main_window_maximized,
            exit_application
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
