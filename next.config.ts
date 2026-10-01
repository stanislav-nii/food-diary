import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Статическая сборка (out/) для Capacitor: без сервера Node
  output: "export",
  images: { unoptimized: true },
  // Для file://-совместимости внутри WebView лучше относительные пути не включаем,
  // Capacitor обслуживает контент через https://localhost — абсолютные пути работают.
  trailingSlash: true,
};

export default nextConfig;
