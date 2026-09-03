import React from 'react';
import './DeviceList.css';

function DeviceList({ devices }) {
  if (devices.length === 0) {
    return (
      <div className="device-list-container">
        <div className="empty-state">
          <p>📭 Tidak ada perangkat ditemukan</p>
          <p className="empty-state-info">Mulai scan untuk menemukan perangkat Bluetooth</p>
        </div>
      </div>
    );
  }

  return (
    <div className="device-list-container">
      <h2>📋 Daftar Perangkat Terhubung</h2>
      <div className="devices-grid">
        {devices.map((device, index) => (
          <div key={device.address || index} className="device-card">
            <div className="device-header">
              <h3>{device.name || 'Unknown Device'}</h3>
              <span className={`status-badge ${device.connected ? 'connected' : 'disconnected'}`}>
                {device.connected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>

            <div className="device-info">
              <div className="info-row">
                <span className="label">MAC Address:</span>
                <span className="value">{device.address}</span>
              </div>

              <div className="info-row">
                <span className="label">Connection Time:</span>
                <span className="value">
                  {device.connectedTime 
                    ? new Date(device.connectedTime).toLocaleString('id-ID')
                    : 'N/A'}
                </span>
              </div>

              <div className="info-row">
                <span className="label">RSSI (Signal Strength):</span>
                <span className="value">
                  {device.rssi ? `${device.rssi} dBm` : 'N/A'}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Coordinates (based on RSSI):</span>
                <span className="value">
                  {device.coordinates 
                    ? `${device.coordinates.x.toFixed(2)}, ${device.coordinates.y.toFixed(2)}`
                    : 'Calculating...'}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Distance:</span>
                <span className="value">
                  {device.distance ? `${device.distance.toFixed(2)} m` : 'Calculating...'}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Device Type:</span>
                <span className="value">{device.deviceType || 'Unknown'}</span>
              </div>
            </div>

            <div className="device-chart">
              <div className="signal-strength-bar">
                <div 
                  className="signal-fill" 
                  style={{
                    width: `${device.rssi ? Math.min(Math.max((device.rssi + 100) * 2, 0), 100) : 0}%`
                  }}
                ></div>
              </div>
              <span className="signal-label">Signal Strength</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeviceList;
