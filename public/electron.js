const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const BluetoothService = require('./services/bluetoothService');
const LogService = require('./services/logService');

let mainWindow;
const bluetoothService = new BluetoothService();
const logService = new LogService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================
// Bluetooth IPC Handlers
// ============================================

/**
 * Start Bluetooth scanning
 * Returns: { success: boolean, message: string }
 */
ipcMain.handle('bluetooth:start-scan', async (event) => {
  try {
    console.log('[Main] Bluetooth scan requested');
    const result = await bluetoothService.startScan(mainWindow);
    return result;
  } catch (error) {
    console.error('[Main] Error starting Bluetooth scan:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Stop Bluetooth scanning
 * Returns: { success: boolean, message: string }
 */
ipcMain.handle('bluetooth:stop-scan', async (event) => {
  try {
    console.log('[Main] Bluetooth scan stop requested');
    const result = await bluetoothService.stopScan();
    return result;
  } catch (error) {
    console.error('[Main] Error stopping Bluetooth scan:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get list of connected/found Bluetooth devices
 * Returns: Array of device objects
 */
ipcMain.handle('bluetooth:get-devices', async (event) => {
  try {
    const devices = await bluetoothService.getConnectedDevices();
    return devices;
  } catch (error) {
    console.error('[Main] Error getting Bluetooth devices:', error);
    return [];
  }
});

/**
 * Get current scan status
 * Returns: { scanning: boolean, devicesFound: number, devices: Array }
 */
ipcMain.handle('bluetooth:get-status', async (event) => {
  try {
    return bluetoothService.getScanStatus();
  } catch (error) {
    console.error('[Main] Error getting scan status:', error);
    return { scanning: false, devicesFound: 0, devices: [] };
  }
});

/**
 * Clear all tracked devices
 * Returns: { success: boolean }
 */
ipcMain.handle('bluetooth:clear-devices', async (event) => {
  try {
    bluetoothService.clearDevices();
    return { success: true };
  } catch (error) {
    console.error('[Main] Error clearing devices:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Set reference point untuk RSSI calculations
 * Args: { x: number, y: number }
 * Returns: { success: boolean }
 */
ipcMain.handle('bluetooth:set-reference-point', async (event, { x, y }) => {
  try {
    bluetoothService.setReferencePoint(x, y);
    return { success: true, message: `Reference point set to (${x}, ${y})` };
  } catch (error) {
    console.error('[Main] Error setting reference point:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Set reference RSSI untuk distance calculation
 * Args: { rssi: number }
 * Returns: { success: boolean }
 */
ipcMain.handle('bluetooth:set-reference-rssi', async (event, { rssi }) => {
  try {
    bluetoothService.setReferenceRSSI(rssi);
    return { success: true, message: `Reference RSSI set to ${rssi} dBm` };
  } catch (error) {
    console.error('[Main] Error setting reference RSSI:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Listen untuk device found events dari BluetoothService
 * Ini dipanggil oleh BluetoothService ketika device ditemukan
 */
ipcMain.on('bluetooth:device-found', (event, device) => {
  console.log('[Main] Device found event:', device.name, device.address);
  
  // Send ke renderer
  if (mainWindow) {
    mainWindow.webContents.send('bluetooth:device-found', device);
  }
  
  // Log device ke file
  try {
    logService.log(device);
  } catch (error) {
    console.error('[Main] Error logging device:', error);
  }
});

// ============================================
// Log IPC Handlers
// ============================================

/**
 * Get log history
 * Returns: Array of log entries
 */
ipcMain.handle('log:get-history', async (event) => {
  try {
    console.log('[Main] Log history requested');
    return await logService.getHistory();
  } catch (error) {
    console.error('[Main] Error getting log history:', error);
    return [];
  }
});

/**
 * Clear all logs
 * Returns: { success: boolean }
 */
ipcMain.handle('log:clear', async (event) => {
  try {
    console.log('[Main] Clear logs requested');
    await logService.clearLog();
    return { success: true };
  } catch (error) {
    console.error('[Main] Error clearing logs:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export logs to file
 * Returns: { success: boolean, filePath: string }
 */
ipcMain.handle('log:export', async (event) => {
  try {
    console.log('[Main] Export logs requested');
    const result = await logService.exportToFile();
    return result;
  } catch (error) {
    console.error('[Main] Error exporting logs:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get number of logs
 * Returns: { count: number }
 */
ipcMain.handle('log:get-count', async (event) => {
  try {
    const history = await logService.getHistory();
    return { count: history.length };
  } catch (error) {
    console.error('[Main] Error getting log count:', error);
    return { count: 0 };
  }
});

// ============================================
// Error Handling
// ============================================

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
});

ipcMain.on('error', (error) => {
  console.error('[Main] IPC Error:', error);
});

console.log('[Main] Electron main process started');
