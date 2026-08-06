import type { Config } from "tailwindcss";
import baseConfig from "../../libs/ui/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "../../libs/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
