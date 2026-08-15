/**
 * PM2 ecosystem for self-hosted Linux VM.
 *
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Env: either put secrets in `.env` (loaded by scripts/start-prod.mjs)
 * or set them under `env` below. BETTER_AUTH_URL must match the public URL.
 */
module.exports = {
  apps: [
    {
      name: "medlearhub",
      script: "scripts/start-prod.mjs",
      interpreter: "node",
      // Must be the app root (folder with package.json + permanent public/), not .output
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "3000",
        NITRO_PRESET: "node-server",
        // Pin uploads to permanent public/ (set automatically by start-prod.mjs too)
        // PROJECT_ROOT: "/www/wwwroot/your-app",
        // Prefer a project `.env` for secrets; override here only if needed:
        // DATABASE_URL: "postgresql://...",
        // BETTER_AUTH_SECRET: "...",
        // BETTER_AUTH_URL: "http://192.168.0.113:3000",
        // BETTER_AUTH_TRUSTED_ORIGINS: "http://192.168.0.113:3000,http://192.168.0.113:8080",
      },
    },
  ],
};
