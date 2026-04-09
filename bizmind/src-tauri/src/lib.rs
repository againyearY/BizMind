pub mod commands;
pub mod db;
pub mod hotkey;
pub mod llm;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            eprintln!("[Setup] 🔧 开始初始化应用...");
            
            let db_state = match db::build_db_state(app.handle()) {
                Ok(state) => {
                    eprintln!("[Setup] ✅ 数据库状态已构建: {:?}", state.path);
                    state
                }
                Err(e) => {
                    eprintln!("[Setup] ❌ 构建数据库状态失败: {}", e);
                    return Err(e.into());
                }
            };
            
            if let Err(e) = db::init_db(&db_state) {
                eprintln!("[Setup] ❌ 初始化数据库失败: {}", e);
                return Err(e.into());
            }
            
            eprintln!("[Setup] ✅ 数据库初始化成功");
            app.manage(db_state);
            
            eprintln!("[Setup] ✅ 应用初始化完成");
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
            commands::delete_message,
            commands::save_llm_config,
            commands::test_llm_connection,
            commands::load_config,
            commands::save_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
