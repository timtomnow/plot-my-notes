// ttn-backup integration. See https://timtomnow.github.io/ttn-backup/
//
// Exposes `window.TTNBackupAdapter` so the ttn-backup utility can snapshot /
// restore Plot My Notes from a hidden iframe. Also exposes a thin wrapper
// that opens the cross-app Restore picker.

import {
  exportData,
  importData,
  parseExportPayload,
  type ExportPayload,
} from '@/db/exportImport';

type TTNBackupAdapter = {
  appId: string;
  appName: string;
  version: number;
  exportData: () => Promise<ExportPayload>;
  importData: (data: unknown) => Promise<void>;
};

declare global {
  interface Window {
    TTNBackupAdapter?: TTNBackupAdapter;
    TTNBackup?: {
      openImport: (appId: string) => Promise<void>;
      listBundlesFor: (appId: string) => Promise<unknown[]>;
      __loaded?: boolean;
    };
  }
}

export function installTtnBackupAdapter(): void {
  window.TTNBackupAdapter = {
    appId: 'plot-my-notes',
    appName: 'Plot My Notes',
    version: 1,
    exportData,
    importData: async (data) => {
      const payload = parseExportPayload(data);
      await importData(payload, 'replace');
      // Pages hold derived state from live queries; a hard reload mirrors the
      // in-app 'replace' import flow and clears any stale view state.
      setTimeout(() => location.reload(), 100);
    },
  };
}

export function openTtnBackupRestore(): void {
  if (window.TTNBackup?.openImport) {
    void window.TTNBackup.openImport('plot-my-notes');
  } else {
    throw new Error('ttn-backup client not loaded. Check that /ttn-backup/client.js is reachable.');
  }
}
