const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class LogService {
  constructor() {
    this.logDir = path.join(os.homedir(), 'AppData', 'Local', 'BluetoothDeviceMonitor', 'logs');
    this.logFile = path.join(this.logDir, 'bluetooth-devices.log');
    this.jsonFile = path.join(this.logDir, 'bluetooth-devices.json');
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  async log(device) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        name: device.name,
        address: device.address,
        rssi: device.rssi,
        coordinates: device.coordinates,
        distance: device.distance,
        deviceType: device.deviceType,
        connected: device.connected,
      };

      // Write to text log file
      const textLogEntry = `[${timestamp}] Device: ${device.name} | MAC: ${device.address} | RSSI: ${device.rssi} dBm | Coordinates: ${JSON.stringify(device.coordinates)} | Distance: ${device.distance}m\n`;
      await fs.appendFile(this.logFile, textLogEntry);

      // Also maintain a JSON log for easier parsing
      let jsonLogs = [];
      try {
        const content = await fs.readFile(this.jsonFile, 'utf8');
        jsonLogs = JSON.parse(content);
      } catch (e) {
        // File doesn't exist or is empty
      }

      jsonLogs.push(logEntry);
      // Keep only last 1000 entries
      if (jsonLogs.length > 1000) {
        jsonLogs = jsonLogs.slice(-1000);
      }

      await fs.writeFile(this.jsonFile, JSON.stringify(jsonLogs, null, 2));
    } catch (error) {
      console.error('Error writing log:', error);
    }
  }

  async getHistory() {
    try {
      const content = await fs.readFile(this.jsonFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading log history:', error);
      return [];
    }
  }

  async clearLog() {
    try {
      await fs.writeFile(this.logFile, '');
      await fs.writeFile(this.jsonFile, '[]');
      return { success: true };
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw error;
    }
  }

  async exportToFile() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = path.join(
        os.homedir(),
        'Desktop',
        `bluetooth-devices-${timestamp}.log`
      );

      const content = await fs.readFile(this.logFile, 'utf8');
      await fs.writeFile(exportFile, content);

      return { filePath: exportFile, success: true };
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }
}

module.exports = LogService;
