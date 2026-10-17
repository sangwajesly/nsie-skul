import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standard App Router Configuration */

  // Allow HMR WebSocket to work when accessing dev server from LAN IP (e.g. 192.168.x.x)
  // This prevents the repeated WebSocket failed warnings in the browser console.
  devIndicators: false,
};

export default nextConfig;
