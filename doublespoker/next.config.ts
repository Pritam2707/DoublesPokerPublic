const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable SW in dev mode
});


const nextConfig = withPWA({
  reactStrictMode: true,
});


export default nextConfig;
