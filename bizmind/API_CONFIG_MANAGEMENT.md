# API Configuration Management Feature

## 📋 Feature Overview

🆕 **Independent, Administrator-Friendly API Configuration System** for BizMind

This feature provides a completely separate, easy-to-manage interface for configuring LLM API credentials and settings. It can be easily toggled on/off through environment variables, making it perfect for multi-user or managed deployments.

## 🎯 Key Features

### ✅ Complete Independence
- **Separate UI Panel**: Dedicated `ApiConfigPanel.tsx` component
- **Isolated State**: Uses Zustand store (`configStore.ts`)
- **Backend Integration**: New Tauri commands (`test_llm_connection`, `load_config`, `save_config`)
- **No Dependencies**: Doesn't interfere with existing API settings

### ✅ Administrator Control
- **Feature Flag**: Disable/enable via `VITE_ENABLE_API_CONFIG` environment variable
- **Hidden by Default**: Don't show the setting button if disabled
- **Dynamic Hotkey**: Ctrl+Shift+P only works when feature is enabled
- **Easy Deployment**: One variable change to control access

### ✅ User-Friendly Interface
- **One-Click Presets**: ModelScope Qwen, OpenAI, DeepSeek
- **Visual Preview**: Real-time config display
- **Connection Testing**: Test API before saving
- **Clear Error Messages**: User-friendly error reporting
- **Secure Input**: Hide/show API key toggle

## 🚀 Usage

### For Users

#### Opening the API Config Panel
1. **Method 1**: Click the 🔧 button in the top navigation bar
2. **Method 2**: Press `Ctrl+Shift+P` keyboard shortcut
3. **Method 3**: Access through the settings menu

#### Configuring ModelScope Qwen3
1. Click "💡 Preset" > "🤖 ModelScope Qwen3"
2. Or manually enter:
   - **API Endpoint**: `https://api-inference.modelscope.cn/v1`
   - **Model**: `Qwen/Qwen3.5-35B-A3B` or select from dropdown
   - **Vision Model**: `Qwen/Qwen3.5-35B-A3B`
   - **API Key**: `ms-eee04013-7a1a-4ad3-a67a-afaf54ce805c` (your token)

#### Testing the Connection
1. Fill in all required fields (API Key, Endpoint, Model)
2. Click "🧪 Test Connection" button
3. Wait for result message
4. If successful, click "💾 Save Config"

### For Administrators

#### Disabling the Feature (Hide from Users)
```bash
# Edit .env file:
VITE_ENABLE_API_CONFIG=false

# Or leave it commented:
# VITE_ENABLE_API_CONFIG=true
```

Then rebuild and redeploy the application.

#### Enabling the Feature
```bash
# Edit .env file:
VITE_ENABLE_API_CONFIG=true
```

## 🏗️ Architecture

### Frontend Components
```
src/
├── components/
│   └── ApiConfigPanel.tsx          # Main UI panel
├── services/
│   └── apiConfigService.ts         # API test & validation logic
├── stores/
│   └── configStore.ts              # Zustand state management
├── App.tsx                         # Integration point
└── vite-env.d.ts                  # Type definitions
```

### Backend Commands (Rust)
```rust
// src-tauri/src/commands.rs

#[tauri::command]
pub async fn test_llm_connection(
    api_key: String,
    base_url: String,
    model: String,
) -> Result<serde_json::Value, String>

#[tauri::command]
pub fn load_config(db_state: State<'_, DbState>) 
    -> Result<serde_json::Value, String>

#[tauri::command]
pub fn save_config(
    db_state: State<'_, DbState>,
    config: serde_json::Value,
) -> Result<(), String>
```

## 📝 Configuration

### Environment Variables

Create or edit `.env` file in project root:

```dotenv
# Enable/Disable API Configuration Panel
# Set to 'true' to show the 🔧 button and allow Ctrl+Shift+P access
# Set to 'false' or comment out to hide the feature completely
VITE_ENABLE_API_CONFIG=true

# Optional debug mode
VITE_DEBUG=false
```

### Type Definitions

Updated `src/vite-env.d.ts` to include:
```typescript
interface ImportMetaEnv {
  readonly VITE_ENABLE_API_CONFIG: string;
  readonly VITE_DEBUG: string;
}
```

## 🔄 API Flow

### 1. Loading Configuration
```
User opens API Config Panel
         ↓
App.tsx → ApiConfigPanel.tsx
         ↓
useConfigStore.setConfig()
         ↓
Display current settings
```

### 2. Testing Connection
```
User clicks "Test Connection"
         ↓
apiConfigService.testLLMConnection()
         ↓
Tauri invoke("test_llm_connection")
         ↓
src-tauri/commands.rs::test_llm_connection()
         ↓
llm.rs::call_llm_text() [with test prompt]
         ↓
API Response → Token usage → User feedback
```

### 3. Saving Configuration
```
User clicks "Save Config"
         ↓
apiConfigService.saveConfig()
         ↓
Tauri invoke("save_config", {config})
         ↓
src-tauri/commands.rs::save_config()
         ↓
db.rs::save_llm_config()
         ↓
SQLite update
```

## 📊 Supported LLM Providers

### Built-in Presets

| Provider | Endpoint | Model | Vision | Status |
|----------|----------|-------|--------|--------|
| ModelScope Qwen | https://api-inference.modelscope.cn/v1 | Qwen/Qwen3.5-35B-A3B | ✅ | Recommended |
| OpenAI | https://api.openai.com/v1 | gpt-4o-mini | ✅ | Supported |
| DeepSeek | https://api.deepseek.com | deepseek-chat | ❌ | Supported |
| Custom | User-defined | User-defined | Optional | Supported |

## 🔐 Security Considerations

### API Key Handling
- ✅ Keys stored in database (at `~/.bizmind/db/bizmind.sqlite`)
- ✅ Masked in UI (show first 8 + last 4 characters)
- ✅ Can be toggled hidden/visible
- ⚠️ Not encrypted in transit or storage (consider for enterprise use)

### Recommendations
1. Use environment-specific tokens (test vs production)
2. Regularly rotate API keys
3. Monitor usage through provider dashboards
4. Use strong database permissions on deployment

## 🧪 Testing

### Manual Testing Steps

1. **Test Feature Toggle**
   ```bash
   # In .env:
   VITE_ENABLE_API_CONFIG=true
   # Should show 🔧 button and respond to Ctrl+Shift+P
   
   # In .env:
   VITE_ENABLE_API_CONFIG=false
   # Should hide 🔧 button and not respond to Ctrl+Shift+P
   ```

2. **Test ModelScope Connection**
   - Open API Config Panel
   - Click ModelScope Qwen3 preset
   - Enter token: `ms-eee04013-7a1a-4ad3-a67a-afaf54ce805c`
   - Click "Test Connection"
   - Should show: `✅ Connection successful! Token used: X`

3. **Test Configuration Persistence**
   - Change configuration
   - Click "Save Config"
   - Close and reopen the app
   - Configuration should persist

4. **Test Error Handling**
   - Enter invalid endpoint URL
   - Click Test → should show error
   - Enter invalid API key
   - Click Test → should show API error
   - Show proper error messages

## 📦 Files Modified/Created

### New Files Created
- `src/components/ApiConfigPanel.tsx` - Main UI
- `src/services/apiConfigService.ts` - Service layer
- `.env` - Environment configuration

### Files Modified
- `src/App.tsx` - Added import and integration
- `src-tauri/src/commands.rs` - Added 3 new commands
- `src-tauri/src/lib.rs` - Registered commands
- `src/vite-env.d.ts` - Added type definitions
- `.env` - Added feature flag

### Backend Additions
```rust
test_llm_connection()  // Test API connectivity
load_config()          // Load saved config
save_config()          // Save config to database
```

## 🎨 UI Elements

### Main Panel
- Header with title and close button
- Quick preset buttons (3 providers)
- Manual configuration section
- Current config preview
- Test result display (success/error)
- Bottom action buttons (Test, Close, Save)

### Status Indicators
- 🟢 ✅ Success (green)
- 🔴 ❌ Error (red)
- ⏳ 🔄 Loading spinner

### Hotkey
- **Ctrl+Shift+P**: Open API Config Panel (when enabled)

## 🐛 Troubleshooting

### Feature doesn't appear
1. Check `.env` has `VITE_ENABLE_API_CONFIG=true`
2. Run `pnpm tauri dev` to rebuild with new env vars
3. Check browser console for errors

### Connection test fails
1. Verify API endpoint URL format (should be valid URL)
2. Check API key is correct
3. Verify model name matches provider's available models
4. Check internet connection
5. Review console logs: `[API Config Service]` messages

### Configuration not saving
1. Check database file exists at `~/.bizmind/db/bizmind.sqlite`
2. Check write permissions
3. Review console logs for error messages
4. Restart application

## 📚 Integration Guide

For developers integrating this into other projects:

1. **Use the presets** - Extend `MODELSCOPE_QWEN3_PRESETS` object
2. **Add providers** - Modify `LLM_PROVIDER_PRESETS` in configStore.ts
3. **Customize UI** - Edit ApiConfigPanel.tsx styling
4. **Extend validation** - Add custom validation in apiConfigService.ts

## 🔄 Version History

- **v1.0.0** (2026-04-09)
  - Initial release
  - ModelScope Qwen3, OpenAI, DeepSeek presets
  - Connection testing
  - Environment variable feature flag
  - Full documentation

## 📞 Support

For issues or questions, provide:
1. Console logs (F12 → Console)
2. `.env` configuration (hide API keys)
3. Error messages
4. Expected vs actual behavior
5. Steps to reproduce

---

**Last Updated**: 2026-04-09  
**Status**: ✅ Production Ready
