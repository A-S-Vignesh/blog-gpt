import next from "eslint-config-next";

// Next.js 16 ships eslint-config-next as a native flat-config array, so we
// spread it directly. (The old FlatCompat + `extends: ["next"]` approach throws
// a "circular structure" error under ESLint 9 / Next 16.)
const eslintConfig = [
  ...next,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      // The React Compiler rule is conservative about setState-in-effect. Our
      // remaining uses are intentional SSR-safe client-mount patterns (reading
      // navigator/localStorage, mount guards) that can't run during render
      // without hydration mismatches. Keep them visible as warnings rather than
      // silencing them or risk-refactoring working UI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
