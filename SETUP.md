# Bluetooth Device Monitor - Setup Guide

## 🚀 Panduan Setup Lengkap

### 1. Prerequisites
- **Node.js v14+** - Download dari https://nodejs.org/
- **npm v6+** - Biasanya bundled dengan Node.js
- **Windows 10/11**
- **Git** - Optional, untuk clone repository

### 2. Installation Steps

#### Step 1: Clone atau Download Repository
```bash
git clone https://github.com/dvaa-arch/bluetooth-device-monitor.git
cd bluetooth-device-monitor
```

#### Step 2: Install Dependencies
```bash
npm install
```

Proses ini akan install semua package yang diperlukan:
- React 18.2.0
- Electron 25.0.0
- Electron Builder
- React Scripts
- Dan dependencies lainnya

#### Step 3: Run dalam Development Mode
```bash
npm run dev
```

Ini akan:
1. Start React development server di http://localhost:3000
2. Launch Electron window setelah React server siap
3. Open DevTools untuk debugging

#### Step 4: Build untuk Production
```bash
npm run electron-build
```

Ini akan create installer di folder `dist/`:
- `BluetoothDeviceMonitor-Setup-1.0.0.exe` - Installer untuk end users
- `Bluetooth Device Monitor 1.0.0.exe` - Portable executable

## 🔧 Available Commands

### Development
```bash
npm run dev              # Run Electron + React development mode
npm start              # Run hanya React dev server
npm run electron       # Run Electron without React dev server
```

### Building
```bash
npm run build           # Build React app untuk production
npm run electron-build  # Build Electron app dengan installer
npm run dist           # Alias untuk electron-build
```

### Testing
```bash
npm test               # Run React tests
```

## 📝 Project Structure Explained

```
bluetooth-device-monitor/
│
├── public/                          # Static assets & Electron main process
│   ├── electron.js                 # Main Electron process entry point
│   ├── preload.js                  # Secure IPC bridge
│   ├── index.html                  # HTML template
│   └── services/                   # Backend services
│       ├── bluetoothService.js     # Bluetooth scanning logic
│       └── logService.js           # File logging logic
│
├── src/                            # React source code
│   ├── App.js                      # Main App component
│   ├── App.css                     # App styling
│   ├── index.js                    # React entry point
│   ├── index.css                   # Global styles
│   └── components/                 # React components
│       ├── BluetoothScanner.js     # Scanner UI
│       ├── BluetoothScanner.css
│       ├── DeviceList.js           # Device listing UI
│       ├── DeviceList.css
│       ├── LogViewer.js            # Log viewer UI
│       └── LogViewer.css
│
├── build/                          # Built React app (auto-generated)
├── dist/                           # Built Electron app (auto-generated)
├── node_modules/                   # Dependencies (auto-generated)
│
├── package.json                    # Project configuration
├── .gitignore                      # Git ignore rules
└── README.md                       # Project documentation
```

## 🔌 Bluetooth API Integration

Saat ini aplikasi menggunakan simulated data. Untuk mengintegrasikan dengan real Bluetooth API:

### Opsi 1: node-bluetooth-serial-port (Recommended untuk Windows)
```bash
npm install bluetooth-serial-port
```

```javascript
// Di bluetoothService.js
const BluetoothSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;

const btSerial = new BluetoothSerialPort();

btSerial.on('found', (address, name) => {
  const device = {
    name: name,
    address: address,
    rssi: calculateRSSI(), // Calculate or get from API
    connected: true,
    connectedTime: new Date(),
    deviceType: 'Phone'
  };
  
  this.updateDevice(address, device);
});

btSerial.inquire();
```

### Opsi 2: bleat (Cross-platform)
```bash
npm install bleat
```

```javascript
const noble = require('bleat').webbluetooth;

noble.requestDevice({
  filters: [{ services: [] }] // Scan all services
}).then(device => {
  console.log('Found device:', device.name);
}).catch(err => {
  console.error('Error:', err);
});
```

### Opsi 3: Windows Native Bluetooth API (Advanced)
Gunakan FFI untuk direct Windows API:
```bash
npm install ffi node-ffi
```

## 📊 Data Structures

### Device Object
```javascript
{
  name: "iPhone 12",                    // Device name
  address: "AA:BB:CC:DD:EE:FF",        // MAC address
  rssi: -60,                            // Signal strength (dBm)
  distance: 5.32,                       // Calculated distance (meters)
  coordinates: {                        // Calculated coordinates
    x: 5.32,
    y: 3.21
  },
  connected: true,                      // Connection status
  connectedTime: "2024-01-20T10:30:00Z", // Connection timestamp
  deviceType: "Phone"                   // Device type
}
```

### Log Entry
```javascript
{
  timestamp: "2024-01-20T10:30:45.123Z",
  name: "iPhone 12",
  address: "AA:BB:CC:DD:EE:FF",
  rssi: -60,
  coordinates: { x: 5.32, y: 3.21 },
  distance: 5.32,
  deviceType: "Phone",
  connected: true
}
```

## 🛠️ Troubleshooting

### Issue: npm install fails
**Solution**: 
```bash
npm cache clean --force
npm install
```

### Issue: Electron window tidak muncul
**Solution**:
- Pastikan React dev server sudah started (http://localhost:3000)
- Check console untuk error messages
- Coba restart dengan `npm run dev`

### Issue: DevTools tidak muncul
**Solution**:
- DevTools hanya muncul di development mode
- Cek `isDev` check di `electron.js`

### Issue: Logs tidak disave
**Solution**:
- Check folder permissions di `%APPDATA%\Local\BluetoothDeviceMonitor\`
- Pastikan folder sudah dibuat (auto-created pada first run)

## 📦 Deployment

### Create Installer
```bash
npm run electron-build
```

Hasilnya:
- `dist/BluetoothDeviceMonitor-Setup-1.0.0.exe` - Installer
- `dist/Bluetooth Device Monitor 1.0.0.exe` - Portable app

### Version Updates
Edit `package.json`:
```json
{
  "version": "1.0.1"  // Update version number
}
```

Rebuild:
```bash
npm run electron-build
```

## 🔐 Security Best Practices

1. **Context Isolation** ✅ - Enabled di preload.js
2. **Sandbox** - Consider enabling in electron.js
3. **Node Integration** ✅ - Disabled
4. **Remote Module** ✅ - Disabled
5. **Content Security Policy** - Add for production

## 📈 Performance Tips

1. **Lazy load components** - Use React.lazy() untuk components berat
2. **Memoize callbacks** - Gunakan useCallback untuk frequent updates
3. **Optimize re-renders** - Gunakan React.memo()
4. **Limit log size** - Keep last 1000 entries saja
5. **Debounce scan events** - Avoid too frequent updates

## 🎯 Next Steps

1. Integrate real Bluetooth API
2. Add multiple access points untuk better geolocation
3. Implement database untuk log storage (SQLite)
4. Add data visualization (charts, heatmaps)
5. Implement device tracking/filtering
6. Add export to CSV/Excel

---

**Need Help?** Buka issue di GitHub repository!
