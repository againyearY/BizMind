use tauri::Emitter;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

pub fn register_default_hotkey(app: &tauri::AppHandle) -> Result<(), String> {
    let app_handle = app.clone();
    
    let global_shortcut = app.global_shortcut();
    
    // 确保快捷键没有被注册
    if global_shortcut.is_registered("Ctrl+Shift+B") {
        let _ = global_shortcut.unregister("Ctrl+Shift+B");
    }

    global_shortcut
        .on_shortcut("Ctrl+Shift+B", move |_app, _shortcut, _event| {
            let _ = app_handle.emit("toggle-floating", ());
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}
