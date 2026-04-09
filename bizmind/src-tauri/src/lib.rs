mod commands;
mod db;
mod hotkey;
mod llm;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let db_state = db::build_db_state(app.handle())?;
            db::init_db(&db_state)?;
            app.manage(db_state);
            hotkey::register_default_hotkey(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_message,
            commands::get_messages,
            commands::get_db_path,
            commands::call_llm_text,
            commands::call_llm_vision,
            commands::get_messages_by_category,
            commands::search_messages,
            commands::update_message,
            commands::delete_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
