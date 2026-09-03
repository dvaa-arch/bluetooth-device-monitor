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

// IPC Handlers untuk Bluetooth operations
ipcMain.handle('bluetooth:start-scan', async () => {
  try {
    return await bluetoothService.startScan();
  } catch (error) {
    console.error('Error starting Bluetooth scan:', error);
    throw error;
  }
});

ipcMain.handle('bluetooth:stop-scan', async () => {
  try {
    await bluetoothService.stopScan();
    return { success: true };
  } catch (error) {
    console.error('Error stopping Bluetooth scan:', error);
    throw error;
  }
});

ipcMain.handle('bluetooth:get-devices', async () => {
  try {
    return await bluetoothService.getConnectedDevices();
  } catch (error) {
    console.error('Error getting Bluetooth devices:', error);
    throw error;
  }
});

ipcMain.on('bluetooth:device-found', (event, device) => {
  // Broadcast to all renderer processes
  if (mainWindow) {
    mainWindow.webContents.send('bluetooth:device-found', device);
  }
  // Log the device
  logService.log(device);
});

// IPC Handlers untuk Log operations
ipcMain.handle('log:get-history', async () => {
  try {
    return await logService.getHistory();
  } catch (error) {
    console.error('Error getting log history:', error);
    throw error;
  }
});

ipcMain.handle('log:clear', async () => {
  try {
    await logService.clearLog();
    return { success: true };
  } catch (error) {
    console.error('Error clearing logs:', error);
    throw error;
  }
});

ipcMain.handle('log:export', async () => {
  try {
    const filePath = await logService.exportToFile();
    return { filePath, success: true };
  } catch (error) {
    console.error('Error exporting logs:', error);
    throw error;
  }
});
