use serde::Serialize;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Serialize)]
struct GreetResponse {
    message_key: String,
    name: String,
    source: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> GreetResponse {
    GreetResponse {
        message_key: "successGreeting".to_string(),
        name: name.to_string(),
        source: "Tauri".to_string(),
    }
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
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:notes.db", notes_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
