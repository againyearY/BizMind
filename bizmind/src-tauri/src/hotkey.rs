use tauri::Emitter;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

pub fn register_default_hotkey(app: &tauri::AppHandle) -> Result<(), String> {
    let app_handle = app.clone();

    app.global_shortcut()
        .on_shortcut("Ctrl+Shift+A", move |_app, _shortcut, _event| {
            let _ = app_handle.emit("toggle-floating", ());
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}
