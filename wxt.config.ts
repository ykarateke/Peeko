import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Peeko',
    description:
      'Local-first design inspection & asset extraction. Zero backend, zero telemetry.',
    action: {},
    permissions: ['downloads', 'activeTab', 'scripting', 'sidePanel', 'storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-inspect': {
        suggested_key: { default: 'Alt+Shift+I' },
        description: 'Toggle Peeko element inspector',
      },
    },
  },
});
