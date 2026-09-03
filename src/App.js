import React, { useState, useEffect } from 'react';
import './App.css';
import BluetoothScanner from './components/BluetoothScanner';
import DeviceList from './components/DeviceList';
import LogViewer from './components/LogViewer';

function App() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('devices'); // devices, logs
  const [scanStatus, setScanStatus] = useState({
    scanning: false,
    devicesFound: 0,
    error: null
  });
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize app dan setup event listeners
   */
  useEffect(() => {
    console.log('[App] Initializing application');
    
    if (!window.electronAPI) {
      console.error('[App] Electron API not available');
      setScanStatus({ ...scanStatus, error: 'Electron API not available' });
      return;
    }

    // Setup device found event listener
    try {
      window.electronAPI.onDeviceFound((device) => {
        console.log('[App] Device found:', device.name, device.address);
        
        setDevices((prevDevices) => {
          const existingDevice = prevDevices.find(d => d.address === device.address);
          
          if (existingDevice) {
            // Update existing device dengan info terbaru
            return prevDevices.map(d =>
              d.address === device.address 
                ? { 
                    ...d, 
                    ...device,
                    lastSeen: new Date().toISOString()
                  } 
                : d
            );
          } else {
            // Add new device
            console.log('[App] New device added:', device.name);
            return [...prevDevices, device];
          }
        });

        // Update scan status
        setScanStatus(prev => ({
          ...prev,
          devicesFound: (prev.devicesFound || 0) + 1
        }));
      });
    } catch (error) {
      console.error('[App] Error setting up device listener:', error);
      setScanStatus({ ...scanStatus, error: error.message });
    }

    // Load initial devices
    loadDevices();
    loadScanStatus();
    
    setIsInitialized(true);

    // Cleanup listener on unmount
    return () => {
      if (window.electronAPI) {
        try {
          window.electronAPI.removeDeviceFoundListener();
        } catch (error) {
          console.error('[App] Error removing listener:', error);
        }
      }
    };
  }, []);

  /**
   * Load devices dari backend
   */
  const loadDevices = async () => {
    try {
      console.log('[App] Loading devices...');
      if (window.electronAPI) {
        const loadedDevices = await window.electronAPI.getBluetoothDevices();
        console.log('[App] Devices loaded:', loadedDevices?.length || 0);
        setDevices(loadedDevices || []);
      }
    } catch (error) {
      console.error('[App] Error loading devices:', error);
      setScanStatus(prev => ({
        ...prev,
        error: `Error loading devices: ${error.message}`
      }));
    }
  };

  /**
   * Load current scan status
   */
  const loadScanStatus = async () => {
    try {
      if (window.electronAPI) {
        const status = await window.electronAPI.getBluetoothStatus();
        console.log('[App] Scan status:', status);
        setScanStatus({
          scanning: status.scanning,
          devicesFound: status.devices?.length || 0,
          error: null
        });
      }
    } catch (error) {
      console.error('[App] Error loading scan status:', error);
    }
  };

  /**
   * Handle start scan
   */
  const handleStartScan = async () => {
    try {
      console.log('[App] Starting Bluetooth scan...');
      setIsScanning(true);
      setScanStatus(prev => ({ ...prev, error: null }));
      
      if (window.electronAPI) {
        const result = await window.electronAPI.startBluetoothScan();
        console.log('[App] Scan start result:', result);
        
        if (!result.success) {
          setScanStatus(prev => ({
            ...prev,
            error: result.error || 'Failed to start scan'
          }));
          setIsScanning(false);
        } else {
          setScanStatus(prev => ({
            ...prev,
            scanning: true
          }));
        }
      }
    } catch (error) {
      console.error('[App] Error starting scan:', error);
      setScanStatus(prev => ({
        ...prev,
        error: error.message
      }));
      setIsScanning(false);
    }
  };

  /**
   * Handle stop scan
   */
  const handleStopScan = async () => {
    try {
      console.log('[App] Stopping Bluetooth scan...');
      
      if (window.electronAPI) {
        const result = await window.electronAPI.stopBluetoothScan();
        console.log('[App] Scan stop result:', result);
        
        if (result.success) {
          setScanStatus(prev => ({
            ...prev,
            scanning: false
          }));
        }
      }
      
      setIsScanning(false);
    } catch (error) {
      console.error('[App] Error stopping scan:', error);
      setScanStatus(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  /**
   * Handle clear devices
   */
  const handleClearDevices = async () => {
    try {
      console.log('[App] Clearing devices...');
      if (window.electronAPI) {
        await window.electronAPI.clearBluetoothDevices();
        setDevices([]);
        setScanStatus(prev => ({
          ...prev,
          devicesFound: 0
        }));
      }
    } catch (error) {
      console.error('[App] Error clearing devices:', error);
      setScanStatus(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  /**
   * Handle refresh devices
   */
  const handleRefreshDevices = async () => {
    console.log('[App] Refreshing devices...');
    await loadDevices();
    await loadScanStatus();
  };

  if (!isInitialized) {
    return (
      <div className="App loading">
        <div className="loading-spinner">
          <h2>Initializing Bluetooth Device Monitor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>📱 Bluetooth Device Monitor</h1>
        <p>Real-time Monitoring of Connected Bluetooth Devices</p>
        <div className="header-status">
          {scanStatus.scanning && (
            <span className="status-badge scanning">🔴 Scanning...</span>
          )}
          {!scanStatus.scanning && devices.length > 0 && (
            <span className="status-badge idle">🟢 Ready • {devices.length} devices</span>
          )}
          {!scanStatus.scanning && devices.length === 0 && (
            <span className="status-badge idle">⚪ Idle</span>
          )}
        </div>
      </header>

      {scanStatus.error && (
        <div className="error-banner">
          <span>⚠️ {scanStatus.error}</span>
          <button 
            onClick={() => setScanStatus(prev => ({ ...prev, error: null }))}
            className="close-btn"
          >
            ✕
          </button>
        </div>
      )}

      <div className="app-container">
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            📱 Devices ({devices.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Logs
          </button>
          <div className="tab-spacer"></div>
          <button
            className="refresh-btn"
            onClick={handleRefreshDevices}
            title="Refresh device list"
          >
            🔄
          </button>
        </div>

        {activeTab === 'devices' && (
          <div className="tab-content">
            <BluetoothScanner
              isScanning={isScanning}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
              onClearDevices={handleClearDevices}
              devicesCount={devices.length}
            />
            <DeviceList 
              devices={devices}
              isScanning={isScanning}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="tab-content">
            <LogViewer />
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>v1.0.0 • Bluetooth Device Monitor • Built with Electron & React</p>
      </footer>
    </div>
  );
}

export default App;
