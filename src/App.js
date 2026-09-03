import React, { useState, useEffect } from 'react';
import './App.css';
import BluetoothScanner from './components/BluetoothScanner';
import DeviceList from './components/DeviceList';
import LogViewer from './components/LogViewer';

function App() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('devices'); // devices, logs

  useEffect(() => {
    // Listen for device found events
    if (window.electronAPI) {
      window.electronAPI.onDeviceFound((device) => {
        setDevices((prevDevices) => {
          const existingDevice = prevDevices.find(d => d.address === device.address);
          if (existingDevice) {
            return prevDevices.map(d =>
              d.address === device.address ? { ...d, ...device } : d
            );
          } else {
            return [...prevDevices, device];
          }
        });
      });
    }

    // Load initial devices
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      if (window.electronAPI) {
        const loadedDevices = await window.electronAPI.getBluetoothDevices();
        setDevices(loadedDevices || []);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleStartScan = async () => {
    try {
      setIsScanning(true);
      if (window.electronAPI) {
        await window.electronAPI.startBluetoothScan();
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.stopBluetoothScan();
      }
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>📱 Bluetooth Device Monitor</h1>
        <p>Real-time Monitoring of Connected Bluetooth Devices</p>
      </header>

      <div className="app-container">
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            Devices ({devices.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>

        {activeTab === 'devices' && (
          <div className="tab-content">
            <BluetoothScanner
              isScanning={isScanning}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
            />
            <DeviceList devices={devices} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="tab-content">
            <LogViewer />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
