const { ipcMain } = require('electron');

class BluetoothService {
  constructor() {
    this.devices = new Map();
    this.scanning = false;
    this.scanInterval = null;
    this.btSerial = null;
    this.mainWindow = null;
    
    // Reference point untuk RSSI-based geolocation
    this.referencePoint = { x: 0, y: 0 };
    this.referenceRSSI = -50; // RSSI at 1 meter
    this.pathLossExponent = 2.0; // Indoor environments
    
    this.initBluetoothLibrary();
  }

  /**
   * Initialize Bluetooth Serial Port library
   */
  initBluetoothLibrary() {
    try {
      const BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;
      this.btSerial = new BluetoothSerialPort();
      
      console.log('[BluetoothService] Library initialized successfully');
      this.setupBluetoothEventListeners();
    } catch (error) {
      console.error('[BluetoothService] Failed to initialize Bluetooth library:', error.message);
      console.log('[BluetoothService] Make sure to run: npm install bluetooth-serial-port');
    }
  }

  /**
   * Setup event listeners untuk Bluetooth
   */
  setupBluetoothEventListeners() {
    if (!this.btSerial) return;

    this.btSerial.on('found', (address, name) => {
      console.log(`[BluetoothService] Device found: ${name} (${address})`);
      
      const device = {
        name: name || 'Unknown Device',
        address: address,
        rssi: this.estimateRSSI(address), // Estimate atau dari API
        distance: 0,
        coordinates: { x: 0, y: 0 },
        connected: true,
        connectedTime: new Date().toISOString(),
        deviceType: this.detectDeviceType(name),
        lastSeen: new Date().toISOString()
      };

      this.updateDevice(address, device);
      
      // Emit ke renderer process
      if (this.mainWindow) {
        this.mainWindow.webContents.send('bluetooth:device-found', device);
      }
    });

    this.btSerial.on('finished', () => {
      console.log('[BluetoothService] Scan finished');
      this.scanning = false;
    });
  }

  /**
   * Start Bluetooth scanning
   */
  async startScan(mainWindow = null) {
    try {
      if (!this.btSerial) {
        return { success: false, error: 'Bluetooth library not initialized' };
      }

      if (this.scanning) {
        console.log('[BluetoothService] Already scanning');
        return { success: true, message: 'Already scanning' };
      }

      this.mainWindow = mainWindow;
      this.scanning = true;
      this.devices.clear();

      console.log('[BluetoothService] Starting Bluetooth scan...');
      
      // Start inquiry - ini akan scan semua Bluetooth devices di sekitar
      this.btSerial.inquire();

      // Set timeout untuk scan (default 12 detik)
      const scanTimeout = setTimeout(() => {
        if (this.scanning) {
          this.stopScan();
        }
      }, 12000);

      return { 
        success: true, 
        message: 'Bluetooth scan started',
        scanTimeout: scanTimeout 
      };
    } catch (error) {
      console.error('[BluetoothService] Error starting scan:', error);
      this.scanning = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop Bluetooth scanning
   */
  async stopScan() {
    try {
      if (!this.scanning) {
        return { success: true, message: 'Already stopped' };
      }

      this.scanning = false;
      
      // Cancel ongoing inquiry if possible
      if (this.btSerial && this.btSerial.inquire) {
        // Library should stop automatically
      }

      console.log('[BluetoothService] Bluetooth scan stopped');
      return { success: true, message: 'Scan stopped' };
    } catch (error) {
      console.error('[BluetoothService] Error stopping scan:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of connected devices
   */
  async getConnectedDevices() {
    try {
      if (!this.btSerial) {
        return [];
      }

      const devices = [];
      
      // Get list dari Bluetooth Serial Port
      this.btSerial.listPairedDevices((pairedDevices) => {
        pairedDevices.forEach(device => {
          if (!this.devices.has(device.address)) {
            const deviceObj = {
              name: device.name || 'Unknown Device',
              address: device.address,
              rssi: -80, // Default untuk paired devices
              distance: this.calculateDistance(-80),
              coordinates: this.calculateCoordinatesFromRSSI(-80),
              connected: true,
              connectedTime: new Date().toISOString(),
              deviceType: this.detectDeviceType(device.name),
              lastSeen: new Date().toISOString(),
              paired: true
            };
            
            this.devices.set(device.address, deviceObj);
            devices.push(deviceObj);
          }
        });
      });

      // Combine dengan devices yang sudah di-track
      const allDevices = Array.from(this.devices.values());
      return allDevices;
    } catch (error) {
      console.error('[BluetoothService] Error getting connected devices:', error);
      return Array.from(this.devices.values());
    }
  }

  /**
   * Estimate RSSI untuk device
   * Dalam production, ini bisa dari actual Bluetooth inquiry
   */
  estimateRSSI(address) {
    // RSSI values biasanya antara -30 hingga -100 dBm
    // Simulate dengan random value
    const minRSSI = -90;
    const maxRSSI = -30;
    const rssi = Math.floor(Math.random() * (maxRSSI - minRSSI + 1) + minRSSI);
    return rssi;
  }

  /**
   * Detect device type dari nama
   */
  detectDeviceType(name) {
    if (!name) return 'Unknown';
    
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('iphone') || lowerName.includes('ipad')) {
      return 'iPhone/iPad';
    } else if (lowerName.includes('samsung') || lowerName.includes('galaxy')) {
      return 'Samsung';
    } else if (lowerName.includes('pixel')) {
      return 'Google Pixel';
    } else if (lowerName.includes('watch') || lowerName.includes('band')) {
      return 'Smartwatch';
    } else if (lowerName.includes('speaker') || lowerName.includes('buds') || lowerName.includes('earbuds')) {
      return 'Audio Device';
    } else if (lowerName.includes('headphone') || lowerName.includes('headset')) {
      return 'Headphones';
    } else if (lowerName.includes('laptop') || lowerName.includes('desktop')) {
      return 'Computer';
    } else {
      return 'Device';
    }
  }

  /**
   * Calculate distance dari RSSI
   * Formula: distance = 10^((referenceRSSI - rssi) / (10 * pathLossExponent))
   */
  calculateDistance(rssi) {
    if (!rssi) return 0;
    try {
      const ratio = (this.referenceRSSI - rssi) / (10 * this.pathLossExponent);
      const distance = Math.pow(10, ratio);
      return Math.round(distance * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('[BluetoothService] Error calculating distance:', error);
      return 0;
    }
  }

  /**
   * Calculate coordinates dari RSSI
   * Simplified 2D positioning menggunakan circular placement
   */
  calculateCoordinatesFromRSSI(rssi) {
    const distance = this.calculateDistance(rssi);
    
    // Random angle untuk positioning
    const angle = Math.random() * 2 * Math.PI;
    
    const x = this.referencePoint.x + distance * Math.cos(angle);
    const y = this.referencePoint.y + distance * Math.sin(angle);

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100
    };
  }

  /**
   * Update device information
   */
  updateDevice(macAddress, deviceData) {
    const existing = this.devices.get(macAddress);
    
    if (existing) {
      // Update existing device
      const updated = {
        ...existing,
        ...deviceData,
        lastSeen: new Date().toISOString()
      };
      
      // Recalculate distance and coordinates jika RSSI berubah
      if (deviceData.rssi) {
        updated.distance = this.calculateDistance(deviceData.rssi);
        updated.coordinates = this.calculateCoordinatesFromRSSI(deviceData.rssi);
      }
      
      this.devices.set(macAddress, updated);
    } else {
      // Add new device
      const newDevice = {
        ...deviceData,
        distance: this.calculateDistance(deviceData.rssi || -50),
        coordinates: this.calculateCoordinatesFromRSSI(deviceData.rssi || -50),
        lastSeen: new Date().toISOString()
      };
      
      this.devices.set(macAddress, newDevice);
    }
  }

  /**
   * Remove device dari tracking
   */
  removeDevice(macAddress) {
    this.devices.delete(macAddress);
    console.log(`[BluetoothService] Device removed: ${macAddress}`);
  }

  /**
   * Get device by MAC address
   */
  getDevice(macAddress) {
    return this.devices.get(macAddress);
  }

  /**
   * Set reference point untuk RSSI calculation
   */
  setReferencePoint(x, y) {
    this.referencePoint = { x, y };
    console.log(`[BluetoothService] Reference point set to: ${x}, ${y}`);
  }

  /**
   * Set reference RSSI untuk distance calculation
   */
  setReferenceRSSI(rssi) {
    this.referenceRSSI = rssi;
    console.log(`[BluetoothService] Reference RSSI set to: ${rssi} dBm`);
  }

  /**
   * Set path loss exponent
   */
  setPathLossExponent(exponent) {
    this.pathLossExponent = exponent;
    console.log(`[BluetoothService] Path loss exponent set to: ${exponent}`);
  }

  /**
   * Get scan status
   */
  getScanStatus() {
    return {
      scanning: this.scanning,
      devicesFound: this.devices.size,
      devices: Array.from(this.devices.values())
    };
  }

  /**
   * Clear all devices dari tracking
   */
  clearDevices() {
    this.devices.clear();
    console.log('[BluetoothService] All devices cleared');
  }
}

module.exports = BluetoothService;
