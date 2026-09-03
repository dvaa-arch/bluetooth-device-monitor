# 📱 Bluetooth Device Monitor

Electron app untuk monitoring perangkat Bluetooth yang terhubung ke laptop Windows dengan fitur real-time tracking dan history logging.

## ✨ Fitur

- 🔍 **Bluetooth Scanning** - Scan perangkat Bluetooth yang tersedia
- 📊 **Real-time Monitoring** - Monitor perangkat yang terhubung secara real-time
- 📍 **RSSI-based Geolocation** - Hitung koordinat perangkat berdasarkan RSSI (signal strength)
- 📝 **Automatic Logging** - Logging otomatis dalam format text dan JSON
- 📋 **Device Information** - Tampilkan detail lengkap perangkat:
  - Nama Perangkat
  - MAC Address
  - Waktu Koneksi
  - Signal Strength (RSSI)
  - Koordinat (berdasarkan RSSI)
  - Jarak (Distance)
  - Tipe Perangkat
- 💾 **Export Logs** - Export log history ke file

## 🛠️ Tech Stack

- **Frontend**: React 18.2.0
- **Desktop Framework**: Electron 25.0.0
- **Backend**: Node.js
- **Styling**: CSS3
- **Build Tool**: Electron Builder

## 📦 Instalasi

### Prerequisites
- Node.js v14+ dan npm
- Windows 10/11

### Setup

1. Clone repository
```bash
git clone https://github.com/dvaa-arch/bluetooth-device-monitor.git
cd bluetooth-device-monitor
```

2. Install dependencies
```bash
npm install
```

3. Run development mode
```bash
npm run dev
```

4. Build aplikasi
```bash
npm run electron-build
```

## 🚀 Penggunaan

### Mode Development
```bash
npm run dev
```
Aplikasi akan terbuka dalam window Electron dengan React dev server

### Mode Production
```bash
npm run electron-build
```
Akan menghasilkan executable installer di folder `dist/`

### npm Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm start` | Start React dev server |
| `npm run electron` | Run Electron app |
| `npm run dev` | Run Electron + React dev server concurrently |
| `npm run build` | Build React app untuk production |
| `npm run electron-build` | Build Electron app dengan installer |

## 📂 Struktur Proyek

```
bluetooth-device-monitor/
├── public/
│   ├── electron.js              # Electron main process
│   ├── preload.js               # Preload script untuk IPC
│   ├── index.html               # HTML template
│   └── services/
│       ├── bluetoothService.js  # Bluetooth scanning & RSSI geolocation
│       └── logService.js        # File logging service
├── src/
│   ├── App.js                   # Main React component
│   ├── App.css                  # App styling
│   ├── index.js                 # React entry point
│   ├── index.css                # Global styles
│   └── components/
│       ├── BluetoothScanner.js   # Scanner UI component
│       ├── BluetoothScanner.css
│       ├── DeviceList.js        # Device list display component
│       ├── DeviceList.css
│       ├── LogViewer.js         # Log viewer component
│       └── LogViewer.css
├── package.json                 # Project dependencies
└── .gitignore
```

## 🔧 Fitur Teknis

### RSSI-based Geolocation
Aplikasi menggunakan RSSI (Received Signal Strength Indicator) untuk menghitung:
- **Distance**: Jarak perangkat dari access point
- **Coordinates**: Estimasi koordinat perangkat dalam 2D space

Formula yang digunakan:
```
Distance = 10^((referenceRSSI - rssi) / (10 * pathLossExponent))
```

### Logging
- **Text Log**: Simpan di `%APPDATA%\Local\BluetoothDeviceMonitor\logs\bluetooth-devices.log`
- **JSON Log**: Simpan di `%APPDATA%\Local\BluetoothDeviceMonitor\logs\bluetooth-devices.json`
- **Export**: Export ke Desktop dengan timestamp

### IPC Communication
Komunikasi antara Electron main process dan React frontend menggunakan:
- `contextBridge` untuk secure API exposure
- `ipcMain.handle()` untuk event handlers
- `ipcRenderer.invoke()` untuk async calls

## ⚠️ TODO / Known Issues

1. **Bluetooth API Integration**
   - Saat ini menggunakan simulated data
   - Perlu integrasi dengan Windows Bluetooth API menggunakan:
     - `node-bluetooth-serial-port`
     - `bleat`
     - atau native Windows API binding

2. **Geolocation Accuracy**
   - RSSI-based positioning memiliki akurasi terbatas (~5-10 meter)
   - Untuk akurasi lebih baik, gunakan multiple access points (trilateration)

3. **Performance**
   - Optimize log file untuk dataset besar (>10.000 entries)
   - Implement pagination untuk log viewer

4. **Security**
   - Add authentication/authorization
   - Encrypt sensitive device information

## 🔌 Windows Bluetooth API Integration

Untuk mengintegrasikan dengan Windows Bluetooth API, Anda bisa menggunakan:

### Option 1: node-bluetooth-serial-port
```javascript
const BluetoothSerialPort = require("bluetooth-serial-port").BluetoothSerialPort;
const btSerial = new BluetoothSerialPort();

btSerial.on('found', (address, name) => {
  console.log(address, name);
});

btSerial.inquire();
```

### Option 2: bleat (Cross-platform)
```javascript
const noble = require('bleat').webbluetooth;

noble.requestDevice({
  filters: [{ services: ['heart_rate'] }]
}).then(device => {
  console.log(device.name);
});
```

### Option 3: Windows Native Bluetooth API
Gunakan `ffi` atau `node-ffi` untuk direct Windows API calls

## 📊 Log Format

### Text Log Example
```
[2024-01-20T10:30:45.123Z] Device: My Phone | MAC: AA:BB:CC:DD:EE:FF | RSSI: -60 dBm | Coordinates: {"x":5.32,"y":3.21} | Distance: 5.32m
```

### JSON Log Example
```json
{
  "timestamp": "2024-01-20T10:30:45.123Z",
  "name": "My Phone",
  "address": "AA:BB:CC:DD:EE:FF",
  "rssi": -60,
  "coordinates": {
    "x": 5.32,
    "y": 3.21
  },
  "distance": 5.32,
  "deviceType": "Phone",
  "connected": true
}
```

## 📄 Lisensi

MIT License - Bebas digunakan untuk keperluan pribadi maupun komersial

## 👤 Author

**dvaa-arch**

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat issue atau pull request untuk improvement.

## 📞 Support

Jika Anda mengalami masalah atau punya pertanyaan, silakan buat issue di repository ini.
