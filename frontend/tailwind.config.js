/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      "colors": {
        "error-container": "#93000a",
        "on-primary": "#00363a",
        "inverse-primary": "#006970",
        "primary": "#dbfcff",
        "on-primary-container": "#006970",
        "on-surface-variant": "#b9cacb",
        "tertiary-fixed": "#ffe170",
        "outline": "#849495",
        "on-tertiary-fixed-variant": "#544600",
        "inverse-on-surface": "#2f3133",
        "on-surface": "#e2e2e5",
        "surface-container-low": "#1a1c1e",
        "secondary": "#ffb77f",
        "secondary-fixed": "#ffdcc4",
        "on-secondary-fixed-variant": "#6f3900",
        "secondary-fixed-dim": "#ffb77f",
        "surface-tint": "#00dbe9",
        "secondary-container": "#ff8a00",
        "surface-container-highest": "#333537",
        "primary-fixed": "#7df4ff",
        "on-secondary-fixed": "#2f1500",
        "surface-dim": "#121416",
        "on-tertiary": "#3a3000",
        "on-error": "#690005",
        "on-tertiary-container": "#705d00",
        "error": "#ffb4ab",
        "primary-container": "#00f0ff",
        "background": "#121416",
        "surface-container-lowest": "#0c0e10",
        "on-tertiary-fixed": "#221b00",
        "on-background": "#e2e2e5",
        "on-primary-fixed-variant": "#004f54",
        "surface-variant": "#333537",
        "on-secondary": "#4e2600",
        "on-primary-fixed": "#002022",
        "tertiary-fixed-dim": "#e9c400",
        "inverse-surface": "#e2e2e5",
        "tertiary": "#fff5dc",
        "surface": "#121416",
        "surface-container": "#1e2022",
        "outline-variant": "#3b494b",
        "surface-container-high": "#282a2c",
        "tertiary-container": "#ffd602",
        "on-error-container": "#ffdad6",
        "surface-bright": "#38393c",
        "on-secondary-container": "#613100",
        "primary-fixed-dim": "#00dbe9"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "container-padding": "24px",
        "margin-desktop": "40px",
        "gutter": "24px",
        "margin-mobile": "16px",
        "base": "8px",
        "touch-target": "48px"
      },
      "fontFamily": {
        "label-md": ["JetBrains Mono"],
        "headline-lg": ["Geist"],
        "headline-lg-mobile": ["Geist"],
        "headline-md": ["Geist"],
        "label-sm": ["JetBrains Mono"],
        "headline-xl": ["Geist"],
        "body-md": ["Inter"],
        "body-lg": ["Inter"]
      },
      "fontSize": {
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.08em", "fontWeight": "500"}],
        "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
