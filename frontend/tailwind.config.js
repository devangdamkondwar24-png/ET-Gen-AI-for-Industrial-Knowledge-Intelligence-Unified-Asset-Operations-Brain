/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "alert-critical": "#D32F2F", // Red
        "background-deep": "#FFFFFF", // White
        "primary": "#004D40", // Deep Teal
        "surface": "#F5F5F5", // Faint Gray
        "outline": "#E0E0E0", 
        "text-muted": "#757575",
        "surface-slate": "#FAFAFA",
        "surface-container": "#F5F5F5",
        "on-surface": "#212121", // Dark charcoal
        "on-surface-variant": "#424242",
        "primary-container": "#E0F2F1", // Subtle teal
        "on-primary": "#FFFFFF",
        "secondary": "#FFB300", // Warning Amber
        "on-secondary": "#212121",
        "border-muted": "#E0E0E0"
      },
      fontFamily: {
        "headline-lg": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "citation": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-mono": ["JetBrains Mono", "monospace"],
        "headline-sm": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
        "body-lg": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "citation": ["12px", {"lineHeight": "1.2", "fontWeight": "500"}],
        "body-md": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "label-mono": ["13px", {"lineHeight": "1.4", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "headline-sm": ["18px", {"lineHeight": "1.4", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}]
      }
    },
  },
  plugins: [],
}
