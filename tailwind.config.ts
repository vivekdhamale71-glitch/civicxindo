import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: v("page"),
        card: v("card"),
        raised: v("raised"),
        ink: v("ink"),
        body: v("body"),
        muted: v("muted"),
        line: v("line"),
        primary: { DEFAULT: v("primary"), hover: v("primary-hover"), fg: v("primary-fg") },
        saffron: v("saffron"),
        green: v("green"),
        approved: v("approved"),
        review: v("review"),
        rejected: v("rejected"),
        info: { DEFAULT: v("info"), ink: v("info-ink") },
        "review-ink": v("review-ink"),
        "rejected-ink": v("rejected-ink"),
        navy: { DEFAULT: "#1B2A4A", hover: "#2E4A7D", deep: "#111C33" },
        focus: v("focus"),
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        hi: ['"Noto Sans Devanagari"', '"Noto Sans"', "sans-serif"],
      },
      borderRadius: { input: "12px", card: "16px", sheet: "24px" },
      boxShadow: {
        card: "0 1px 2px rgba(27,42,74,.04), 0 8px 24px -8px rgba(27,42,74,.12)",
        lift: "0 2px 4px rgba(27,42,74,.06), 0 16px 32px -12px rgba(27,42,74,.20)",
        sheet: "0 -8px 40px -12px rgba(27,42,74,.25)",
      },
      fontSize: {
        display: ["clamp(2.5rem, 5vw, 3.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      keyframes: {
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(-4%,3%,0) scale(1.08)" } },
        spin120: { to: { transform: "rotate(360deg)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".55" } },
        breathe: { "0%,100%": { transform: "scale(1)", opacity: ".35" }, "50%": { transform: "scale(1.8)", opacity: "0" } },
        scan: { "0%": { transform: "translateY(0)" }, "100%": { transform: "translateY(var(--scan-h, 160px))" } },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        drift: "drift 20s ease-in-out infinite",
        wheel: "spin120 120s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        breathe: "breathe 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
