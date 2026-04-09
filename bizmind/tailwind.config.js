export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Zenith 设计系统 - 现代蓝紫渐变
        primary: "#5B21B6",      // 深紫色
        "primary-light": "#7C3AED",  // 浅紫色
        "primary-dark": "#3F0F6F",   // 更深紫色
        
        secondary: "#0EA5E9",    // 天蓝色
        "secondary-light": "#38BDF8", // 浅天蓝
        
        accent: "#F59E0B",       // 琥珀色
        success: "#10B981",      // 绿色
        warning: "#F97316",      // 橙色
        danger: "#EF4444",       // 红色
        
        background: "#F8FAFC",   // 浅灰（亮色背景）
        "bg-secondary": "#EFF6FF", // 浅蓝灰
        surface: "#FFFFFF",      // 纯白
        card: "#FFFFFF",         // 卡片白
        
        border: "#E2E8F0",       // 浅灰边框
        "border-light": "#F1F5F9", // 更浅边框
        
        foreground: "#1E293B",   // 深灰文字
        "text-secondary": "#64748B", // 次级文字
        "text-muted": "#94A3B8",    // 柔和文字
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 4px 12px 0 rgba(91, 33, 182, 0.08)",
        md: "0 10px 24px 0 rgba(91, 33, 182, 0.12)",
        lg: "0 20px 40px 0 rgba(91, 33, 182, 0.15)",
        xl: "0 30px 60px 0 rgba(91, 33, 182, 0.20)",
      },
    },
  },
  plugins: [],
}