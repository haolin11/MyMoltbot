// CasePilot Tailwind config (no 蓝紫渐变)
// Loaded BEFORE the tailwind CDN script.

/* global tailwind */
tailwind = tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Tech + credible + engineering vibe (参考 PDF 风格：冷静的蓝青/灰)
        primary: "#0F766E",       // teal-700
        secondary: "#0EA5A4",     // cyan/teal
        accent: "#F59E0B",        // amber for highlights/CTA (avoid purple)

        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#0284C7",          // blue-600 (not purple)

        "text-primary": "#0F172A",   // slate-900
        "text-secondary": "#475569", // slate-600

        "bg-primary": "#F8FAFC",     // slate-50
        "bg-secondary": "#F1F5F9",   // slate-100
        "border-light": "#E2E8F0",   // slate-200
        "card-bg": "#FFFFFF"
      },
      boxShadow: {
        card: "0 4px 14px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 10px 28px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 3px rgba(14, 165, 164, 0.15)"
      },
      backgroundImage: {
        // 避免蓝紫渐变：仅使用蓝青/青绿/中性
        "gradient-primary": "linear-gradient(135deg, #0F766E 0%, #0EA5A4 100%)",
        "gradient-secondary": "linear-gradient(135deg, #0EA5A4 0%, #0284C7 100%)",
        "gradient-card": "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)"
      }
    }
  }
};
