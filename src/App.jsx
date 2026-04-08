import React, { useState, useEffect } from 'react';
import './index.css';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
//const API_BASE = import.meta.env.VITE_API_URL || 'https://bellcorpbackend.onrender.com/api';

function App() {
  const [availability, setAvailability] = useState(null);
  const [parkedVehicles, setParkedVehicles] = useState([]);

  const [parkForm, setParkForm] = useState({ vehicle_number: '', vehicle_type: 'Bike' });
  const [parkResult, setParkResult] = useState(null);
  const [parkError, setParkError] = useState(null);

  const [exitForm, setExitForm] = useState({ identifier: '' });
  const [exitResult, setExitResult] = useState(null);
  const [exitError, setExitError] = useState(null);

  const fetchData = async () => {
    try {
      const availRes = await fetch(`${API_BASE}/availability`);
      const availData = await availRes.json();
      setAvailability(availData);

      const listRes = await fetch(`${API_BASE}/parked`);
      const listData = await listRes.json();
      setParkedVehicles(listData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePark = async (e) => {
    e.preventDefault();
    setParkResult(null);
    setParkError(null);
    try {
      const res = await fetch(`${API_BASE}/park`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parkForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to park');
      setParkResult(data);
      setParkForm({ vehicle_number: '', vehicle_type: 'Bike' });
      fetchData();
    } catch (err) {
      setParkError(err.message);
    }
  };

  const handleExit = async (e) => {
    e.preventDefault();
    setExitResult(null);
    setExitError(null);
    const isId = !isNaN(exitForm.identifier) && exitForm.identifier.trim() !== '';
    const payload = isId ? { ticket_id: parseInt(exitForm.identifier) } : { vehicle_number: exitForm.identifier };

    try {
      const res = await fetch(`${API_BASE}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to exit');
      setExitResult(data);
      setExitForm({ identifier: '' });
      fetchData();
    } catch (err) {
      setExitError(err.message);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#10b981', fontSize: '2rem' }}>
          ParkEase
        </h1>
        <div className="stats-grid">
          {['bikes', 'cars', 'trucks'].map((type) => {
            const stat = availability?.[type];
            const isFull = stat?.available === 0;
            return (
              <div key={type} className="stat-item">
                <div className={`stat-value ${isFull ? 'full' : ''}`}>
                  {stat ? `${stat.count} / ${stat.limit}` : '-'}
                </div>
                <div className="stat-label">
                  {type.toUpperCase()} Parked
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Park a Vehicle</h2>
        <form onSubmit={handlePark}>
          <div className="form-group">
            <label>Vehicle Number</label>
            <input
              type="text"
              required
              placeholder="e.g. MH-12-AB-1234"
              value={parkForm.vehicle_number}
              onChange={(e) => setParkForm({ ...parkForm, vehicle_number: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Vehicle Type</label>
            <select
              value={parkForm.vehicle_type}
              onChange={(e) => setParkForm({ ...parkForm, vehicle_type: e.target.value })}
            >
              <option value="Bike">Bike</option>
              <option value="Car">Car</option>
              <option value="Truck">Truck</option>
            </select>
          </div>
          <button type="submit" className="btn">Generate Ticket & Park</button>
        </form>

        {parkResult && (
          <div className="ticket-result">
            <strong>Success!</strong><br />
            Ticket ID: {parkResult.ticket.id}<br />
            Entry: {new Date(parkResult.ticket.entry_time + 'Z').toLocaleString()}
          </div>
        )}
        {parkError && <div className="error-message">{parkError}</div>}
      </div>

      <div className="card">
        <h2>Exit Vehicle</h2>
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ margin: '0 0 0.5rem', color: '#9ca3af' }}>💰 Pricing</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#d1d5db', fontSize: '0.9rem' }}>
            <li>Up to 3 hours → ₹30</li>
            <li>3 to 6 hours → ₹85</li>
            <li>More than 6 hours → ₹120</li>
          </ul>
        </div>
        <form onSubmit={handleExit}>
          <div className="form-group">
            <label>Ticket ID or Vehicle Number</label>
            <input
              type="text"
              required
              placeholder="e.g. 1 or MH-12-AB-1234"
              value={exitForm.identifier}
              onChange={(e) => setExitForm({ ...exitForm, identifier: e.target.value })}
            />
          </div>
          <button type="submit" className="btn danger">Calculate Fee & Exit</button>
        </form>

        {exitResult && (
          <div className="ticket-result" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
            <strong>Exit Processed!</strong><br />
            Vehicle: {exitResult.vehicle_number}<br />
            Duration: {exitResult.duration_hours} hrs<br />
            <strong>Fee to Pay: ₹{exitResult.fee}</strong>
          </div>
        )}
        {exitError && <div className="error-message">{exitError}</div>}
      </div>

      <div className="card parked-list">
        <h2>Currently Parked Vehicles</h2>
        {parkedVehicles.length === 0 ? (
          <p>No vehicles parked currently.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Vehicle#</th>
                  <th>Type</th>
                  <th>Entry Time</th>
                </tr>
              </thead>
              <tbody>
                {parkedVehicles.map(v => (
                  <tr key={v.id}>
                    <td>#{v.id}</td>
                    <td>{v.vehicle_number}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{new Date(v.entry_time + 'Z').toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
