const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure IPC Bridge
 * Expose safe APIs untuk React renderer process
 * Menggunakan contextBridge untuk context isolation
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================
  // Bluetooth APIs
  // ============================================

  /**
   * Start Bluetooth scanning
   * @returns {Promise} { success: boolean, message: string }
   */
  startBluetoothScan: () => {
    console.log('[Preload] Starting Bluetooth scan');
    return ipcRenderer.invoke('bluetooth:start-scan');
  },

  /**
   * Stop Bluetooth scanning
   * @returns {Promise} { success: boolean, message: string }
   */
  stopBluetoothScan: () => {
    console.log('[Preload] Stopping Bluetooth scan');
    return ipcRenderer.invoke('bluetooth:stop-scan');
  },

  /**
   * Get list of Bluetooth devices
   * @returns {Promise} Array of device objects
   */
  getBluetoothDevices: () => {
    return ipcRenderer.invoke('bluetooth:get-devices');
  },

  /**
   * Get current scan status
   * @returns {Promise} { scanning: boolean, devicesFound: number, devices: Array }
   */
  getBluetoothStatus: () => {
    return ipcRenderer.invoke('bluetooth:get-status');
  },

  /**
   * Clear all tracked devices
   * @returns {Promise} { success: boolean }
   */
  clearBluetoothDevices: () => {
    console.log('[Preload] Clearing Bluetooth devices');
    return ipcRenderer.invoke('bluetooth:clear-devices');
  },

  /**
   * Set reference point untuk RSSI calculations
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise} { success: boolean, message: string }
   */
  setReferencePoint: (x, y) => {
    console.log(`[Preload] Setting reference point to (${x}, ${y})`);
    return ipcRenderer.invoke('bluetooth:set-reference-point', { x, y });
  },

  /**
   * Set reference RSSI untuk distance calculation
   * @param {number} rssi - RSSI value at 1 meter
   * @returns {Promise} { success: boolean, message: string }
   */
  setReferenceRSSI: (rssi) => {
    console.log(`[Preload] Setting reference RSSI to ${rssi} dBm`);
    return ipcRenderer.invoke('bluetooth:set-reference-rssi', { rssi });
  },

  /**
   * Listen untuk device found events
   * @param {Function} callback - Callback function with device object
   */
  onDeviceFound: (callback) => {
    ipcRenderer.on('bluetooth:device-found', (event, device) => {
      console.log('[Preload] Device found event received:', device.name);
      callback(device);
    });
  },

  /**
   * Remove device found listener
   */
  removeDeviceFoundListener: () => {
    ipcRenderer.removeAllListeners('bluetooth:device-found');
  },

  // ============================================
  // Logging APIs
  // ============================================

  /**
   * Get log history
   * @returns {Promise} Array of log entries
   */
  getLogHistory: () => {
    console.log('[Preload] Getting log history');
    return ipcRenderer.invoke('log:get-history');
  },

  /**
   * Clear all logs
   * @returns {Promise} { success: boolean }
   */
  clearLogs: () => {
    console.log('[Preload] Clearing logs');
    return ipcRenderer.invoke('log:clear');
  },

  /**
   * Export logs to file
   * @returns {Promise} { success: boolean, filePath: string }
   */
  exportLogs: () => {
    console.log('[Preload] Exporting logs');
    return ipcRenderer.invoke('log:export');
  },

  /**
   * Get number of logs
   * @returns {Promise} { count: number }
   */
  getLogCount: () => {
    return ipcRenderer.invoke('log:get-count');
  },

  // ============================================
  // System Information APIs
  // ============================================

  /**
   * Get platform information
   * @returns {string} Platform name (win32, darwin, linux)
   */
  getPlatform: () => {
    return process.platform;
  },

  /**
   * Get app version
   * @returns {string} App version
   */
  getAppVersion: () => {
    return require('electron').app.getVersion();
  },

  /**
   * Get user home directory
   * @returns {string} Home directory path
   */
  getHomeDir: () => {
    return require('os').homedir();
  },
});

console.log('[Preload] IPC bridge initialized');
