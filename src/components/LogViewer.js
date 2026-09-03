import React, { useState, useEffect } from 'react';
import './LogViewer.css';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const history = await window.electronAPI.getLogHistory();
        setLogs(history || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
    setLoading(false);
  };

  const handleClearLogs = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua log?')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.clearLogs();
          setLogs([]);
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
      }
    }
  };

  const handleExportLogs = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.exportLogs();
        if (result.success) {
          alert(`Log berhasil diexport ke: ${result.filePath}`);
        }
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  return (
    <div className="log-viewer-container">
      <div className="log-header">
        <h2>📝 Log History</h2>
        <div className="log-controls">
          <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
            🔄 Refresh
          </button>
          <button className="btn btn-secondary" onClick={handleExportLogs}>
            💾 Export
          </button>
          <button className="btn btn-danger" onClick={handleClearLogs}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="log-content">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>📭 Belum ada log</p>
            <p className="empty-state-info">Log akan muncul ketika perangkat Bluetooth ditemukan</p>
          </div>
        ) : (
          <div className="log-entries">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                <div className="log-timestamp">
                  {new Date(log.timestamp).toLocaleString('id-ID')}
                </div>
                <div className="log-details">
                  <div className="detail-row">
                    <span className="detail-label">Device Name:</span>
                    <span className="detail-value">{log.name || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">MAC Address:</span>
                    <span className="detail-value">{log.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">RSSI:</span>
                    <span className="detail-value">{log.rssi} dBm</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">
                      {log.coordinates 
                        ? `${log.coordinates.x.toFixed(2)}, ${log.coordinates.y.toFixed(2)}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogViewer;
