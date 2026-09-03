# Bluetooth Device Monitor - Developer Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│              (electron.js + IPC Handlers)                    │
├──────────────┬──────────────────────────────────┬────────────┤
│              │                                  │            │
│  Services    │      IPC Communication         │  Node.js   │
│  ├─ Bluetooth│      ├─ bluetooth:start-scan    │  APIs      │
│  │   Service │      ├─ bluetooth:stop-scan     │            │
│  └─ Log      │      ├─ bluetooth:get-devices   │            │
│    Service   │      ├─ log:get-history         │            │
│              │      ├─ log:clear               │            │
│              │      └─ log:export              │            │
├──────────────┴──────────────────────────────────┴────────────┤
│                                                               │
│                  Preload Bridge (preload.js)                │
│           (contextBridge + secure IPC exposure)             │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                     React Frontend                           │
│            (React 18 + ES6 Components)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    App Component                     │   │
│  │  ├─ BluetoothScanner (scanning control)             │   │
│  │  ├─ DeviceList (device display)                     │   │
│  │  └─ LogViewer (log display)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 📋 Data Flow

### Scanning Flow
```
User clicks "Start Scan"
    ↓
BluetoothScanner → onStartScan()
    ↓
React → window.electronAPI.startBluetoothScan()
    ↓
Preload (preload.js) → ipcRenderer.invoke()
    ↓
IPC → ipcMain.handle('bluetooth:start-scan')
    ↓
Electron Main → BluetoothService.startScan()
    ↓
Scanning begins (interval-based)
    ↓
Device found → calculate RSSI, distance, coordinates
    ↓
IPC → mainWindow.webContents.send('bluetooth:device-found')
    ↓
Preload → onDeviceFound callback
    ↓
React → App.useEffect() listener → setState(devices)
    ↓
DeviceList re-renders with new device
```

### Logging Flow
```
Device found
    ↓
Emit 'bluetooth:device-found'
    ↓
IPC Handler → logService.log(device)
    ↓
Write to both:
  - Text file (.log)
  - JSON file (.json)
    ↓
User opens Logs tab
    ↓
LogViewer → loadLogs()
    ↓
window.electronAPI.getLogHistory()
    ↓
ipcRenderer.invoke('log:get-history')
    ↓
ipcMain.handle → logService.getHistory()
    ↓
Read from JSON file
    ↓
Return to React
    ↓
LogViewer displays entries
```

## 🔑 Key Concepts

### 1. Context Isolation & IPC Security
```javascript
// preload.js - Secure bridge
contextBridge.exposeInMainWorld('electronAPI', {
  startBluetoothScan: () => ipcRenderer.invoke('bluetooth:start-scan'),
  // ^ Only these methods exposed to renderer
});

// main thread cannot access window object
// renderer cannot access Node.js APIs directly
```

### 2. RSSI-based Positioning
```javascript
// Formula: distance = 10^((refRSSI - rssi) / (10 * pathLoss))
// Example:
// - Reference RSSI: -50 dBm (at 1 meter)
// - Device RSSI: -70 dBm
// - Path loss exponent: 2.0
// - Distance: 10^((-50 - (-70)) / 20) = 10^1 = 10 meters

calculateDistance(rssi) {
  const ratio = (this.referenceRSSI - rssi) / (10 * this.pathLossExponent);
  return Math.pow(10, ratio);
}
```

### 3. React State Management
```javascript
// App.js uses simple React hooks for state
const [devices, setDevices] = useState([]);
const [isScanning, setIsScanning] = useState(false);

// Updates via:
// 1. IPC events (device found)
// 2. User actions (start/stop scan)
// 3. Tab navigation (logs)
```

## 💾 File I/O Operations

### Log Directory Structure
```
C:\Users\{username}\AppData\Local\BluetoothDeviceMonitor\
├── logs/
│   ├── bluetooth-devices.log   # Text format (append-only)
│   └── bluetooth-devices.json  # JSON format (overwrite with latest 1000)
```

### Log Format Examples

**Text Log (.log)**
```
[2024-01-20T10:30:45.123Z] Device: iPhone 12 | MAC: AA:BB:CC:DD:EE:FF | RSSI: -60 dBm | Coordinates: {"x":5.32,"y":3.21} | Distance: 5.32m
[2024-01-20T10:30:47.456Z] Device: Samsung S21 | MAC: 11:22:33:44:55:66 | RSSI: -70 dBm | Coordinates: {"x":8.12,"y":2.41} | Distance: 8.12m
```

**JSON Log (.json)**
```json
[
  {
    "timestamp": "2024-01-20T10:30:45.123Z",
    "name": "iPhone 12",
    "address": "AA:BB:CC:DD:EE:FF",
    "rssi": -60,
    "coordinates": {"x": 5.32, "y": 3.21},
    "distance": 5.32,
    "deviceType": "Phone",
    "connected": true
  }
]
```

## 🎨 Component Hierarchy

```
App
├── BluetoothScanner
│   ├── Status indicator
│   ├── Control buttons
│   └── Info box
│
├── DeviceList
│   ├── Empty state (when no devices)
│   └── Device cards (grid)
│       ├── Header (name + status badge)
│       ├── Info rows (MAC, time, RSSI, etc)
│       └── Signal strength bar
│
└── LogViewer
    ├── Header (title + controls)
    │   ├── Refresh button
    │   ├── Export button
    │   └── Clear button
    └── Log entries
        └── Entry (timestamp + details)
```

## 🔄 State Updates

### Device State Update Flow
```javascript
// When device found via IPC
window.electronAPI.onDeviceFound((device) => {
  setDevices((prevDevices) => {
    // Check if device already exists
    const existing = prevDevices.find(d => d.address === device.address);
    
    if (existing) {
      // Update existing device
      return prevDevices.map(d =>
        d.address === device.address ? { ...d, ...device } : d
      );
    } else {
      // Add new device
      return [...prevDevices, device];
    }
  });
});
```

## 🧪 Testing Strategies

### Unit Tests (Services)
```javascript
// Test bluetoothService.js
describe('BluetoothService', () => {
  test('calculateDistance should work correctly', () => {
    const service = new BluetoothService();
    const distance = service.calculateDistance(-70);
    expect(distance).toBeGreaterThan(0);
  });
});
```

### Component Tests (React)
```javascript
// Test BluetoothScanner.js
describe('BluetoothScanner', () => {
  test('renders start button when not scanning', () => {
    const { getByText } = render(
      <BluetoothScanner isScanning={false} />
    );
    expect(getByText(/Mulai Scan/)).toBeInTheDocument();
  });
});
```

### Integration Tests (IPC)
```javascript
// Test IPC communication
test('startBluetoothScan IPC call', async () => {
  const result = await window.electronAPI.startBluetoothScan();
  expect(result.success).toBe(true);
});
```

## 🔧 Debugging Tips

### 1. Enable DevTools
DevTools otomatis muncul di dev mode. Gunakan untuk:
- Inspect elements
- Check console errors
- Debug JavaScript
- Monitor network/IPC calls

### 2. Check Logs
```bash
# Text log
type %APPDATA%\Local\BluetoothDeviceMonitor\logs\bluetooth-devices.log

# Or tail in PowerShell
Get-Content -Path "$env:APPDATA\Local\BluetoothDeviceMonitor\logs\bluetooth-devices.log" -Tail 20 -Wait
```

### 3. Debug IPC Calls
Add logging di preload.js:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  startBluetoothScan: async () => {
    console.log('[IPC] startBluetoothScan called');
    const result = await ipcRenderer.invoke('bluetooth:start-scan');
    console.log('[IPC] Result:', result);
    return result;
  },
});
```

### 4. Performance Profiling
Use React DevTools:
- Profiler tab
- Measure render times
- Identify unnecessary re-renders

## 🚀 Performance Optimization

### 1. Memoization
```javascript
const DeviceCard = React.memo(({ device }) => {
  return <div>{device.name}</div>;
}, (prevProps, nextProps) => {
  return prevProps.device.address === nextProps.device.address;
});
```

### 2. Lazy Loading
```javascript
const LogViewer = React.lazy(() => import('./components/LogViewer'));

<Suspense fallback={<div>Loading...</div>}>
  <LogViewer />
</Suspense>
```

### 3. Debouncing
```javascript
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const debouncedScan = debounce(onStartScan, 300);
```

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [Bluetooth Basics](https://en.wikipedia.org/wiki/Bluetooth)
- [RSSI and Distance Calculation](https://en.wikipedia.org/wiki/Received_signal_strength_indication)

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
