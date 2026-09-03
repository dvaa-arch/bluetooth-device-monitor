const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Bluetooth operations
  startBluetoothScan: () => ipcRenderer.invoke('bluetooth:start-scan'),
  stopBluetoothScan: () => ipcRenderer.invoke('bluetooth:stop-scan'),
  getBluetoothDevices: () => ipcRenderer.invoke('bluetooth:get-devices'),
  
  // Log operations
  getLogHistory: () => ipcRenderer.invoke('log:get-history'),
  clearLogs: () => ipcRenderer.invoke('log:clear'),
  exportLogs: () => ipcRenderer.invoke('log:export'),
  
  // Event listeners
  onDeviceFound: (callback) => ipcRenderer.on('bluetooth:device-found', (event, device) => callback(device)),
});
