import { defineConfig, loadEnv } from 'vite';
import { createBrowserViteConfig } from '../build/vite.js';
import { localProviderPlugins } from '../server/providers/local.js';
import { keySetupEndpoint } from '../server/standalone/key-setup.js';
import { standaloneVoiceTools } from '../server/standalone/voiceTools.js';
import { localMcpPlugin } from '../server/mcp/plugin.js';
import { apiNotFoundPlugin } from '../server/standalone/api-not-found.js';
import { resolveAllowedHosts } from '../build/allowedHosts.js';

export default defineConfig(({ command, mode }) => {
  const configDir = process.env.GEV_CONFIG_DIR || '/config';
  const loaded = loadEnv(mode, configDir, '');
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  const settings = keySetupEndpoint({ sourceRoot: configDir });
  const installSettings = (server) =>
    settings.configureServer({
      ...server,
      restart: () => globalThis.__gevDockerRestart(),
    });
  const config = createBrowserViteConfig({
    plugins: [
      ...localProviderPlugins({
        realtime: { tools: standaloneVoiceTools() },
      }).filter((plugin) => plugin.name !== 'gev-key-setup'),
      {
        name: 'docker-settings',
        configureServer: installSettings,
        configurePreviewServer: installSettings,
      },
      localMcpPlugin({
        expectedHostPort: Number(process.env.GEV_PUBLIC_PORT || 4173),
      }),
      apiNotFoundPlugin(),
      {
        name: 'docker-reload',
        transformIndexHtml: () => [
          {
            tag: 'script',
            attrs: { type: 'module', src: '/docker-reload.js' },
            injectTo: 'body',
          },
        ],
      },
    ],
    googleApiKey: process.env.GOOGLE_MAPS_API_KEY,
    cesiumToken: process.env.CESIUM_ION_TOKEN,
    mapillaryToken: process.env.MAPILLARY_CLIENT_TOKEN,
    host: '127.0.0.1',
    port: 4174,
    allowedHosts: resolveAllowedHosts(),
    command,
  });
  config.server.strictPort = true;
  config.server.watch = { usePolling: true, interval: 500 };
  config.server.hmr = {
    clientPort: Number(process.env.GEV_PUBLIC_PORT || 4173),
  };
  config.preview = {
    ...config.preview,
    host: '127.0.0.1',
    port: 4174,
    strictPort: true,
  };
  return config;
});
