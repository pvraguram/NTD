import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import LiveMap from './LiveMap';
import { AlertTriangle, Battery, BatteryMedium, BatteryLow, Activity, LogOut, ShieldAlert, Send, Clock, Wifi, Radio, Bluetooth, BluetoothOff, HelpCircle, X, Info, User } from 'lucide-react';

export default function Dashboard() {
  const [usersData, setUsersData] = useState({});
  const [activeUserId, setActiveUserId] = useState(null);
  const [safeZone, setSafeZone] = useState(100); // Default 100 meters
  const [selectedPattern, setSelectedPattern] = useState('P05');
  const [isSending, setIsSending] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const navigate = useNavigate();

  const userData = activeUserId ? usersData[activeUserId] : null;

  const VIBRATION_PATTERNS = [
    { id: 'P01', name: 'Gentle' },
    { id: 'P02', name: 'Double Pulse' },
    { id: 'P03', name: 'Long Pulse' },
    { id: 'P04', name: 'Attention' },
    { id: 'P05', name: 'SOS (Default)' },
    { id: 'P06', name: 'Location Update' },
    { id: 'P07', name: 'Warning' },
    { id: 'P08', name: 'Obstacle Alert' },
    { id: 'P09', name: 'Urgent Rapid' },
    { id: 'P10', name: 'Wave Pattern' },
    { id: 'P11', name: 'Heartbeat' },
    { id: 'P12', name: 'Received' }
  ];

  const beepIntervalRef = useRef(null);

  useEffect(() => {
    // Listen to Firebase Realtime Database for all users
    if (!auth.currentUser) return;
    const usersRef = ref(db, `users`);
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsersData(data);
        setActiveUserId(prev => prev || Object.keys(data)[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let shouldBeep = false;
    Object.values(usersData).forEach(user => {
      if (user.alerts?.sos || user.alerts?.fallDetected) {
        shouldBeep = true;
      }
    });

    if (shouldBeep && !beepIntervalRef.current) {
      playAlertSound();
      beepIntervalRef.current = setInterval(playAlertSound, 1000);
    } else if (!shouldBeep && beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [usersData]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const sendSosToUser = async () => {
    if (!activeUserId) return;
    setIsSending(true);
    try {
      const selectedPatternObj = VIBRATION_PATTERNS.find(p => p.id === selectedPattern);
      const commandRef = ref(db, `users/${activeUserId}/commands`);
      await update(commandRef, {
        sosFromCaretaker: true,
        patternId: selectedPattern,
        patternName: selectedPatternObj ? selectedPatternObj.name : 'Unknown Alert',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Failed to send command:", error);
    } finally {
      setIsSending(false);
    }
  };

  const requestBluetoothOn = async () => {
    if (!activeUserId) return;
    try {
      const commandRef = ref(db, `users/${activeUserId}/commands`);
      await update(commandRef, {
        requestBluetoothOn: true
      });
    } catch (error) {
      console.error("Failed to request BT on:", error);
    }
  };

  const acknowledgeAlert = async () => {
    if (!activeUserId) return;
    try {
      const updates = {};
      updates[`users/${activeUserId}/alerts/sos`] = false;
      updates[`users/${activeUserId}/alerts/fallDetected`] = false;
      updates[`users/${activeUserId}/commands/sosFromCaretaker`] = true;
      updates[`users/${activeUserId}/commands/patternId`] = 'P12';
      updates[`users/${activeUserId}/commands/patternName`] = 'Received';
      updates[`users/${activeUserId}/commands/timestamp`] = Date.now();
      
      await update(ref(db), updates);
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const forceStopSos = async () => {
    if (!activeUserId) return;
    const confirmStop = window.confirm("Are you sure you want to forcefully stop the SOS alert without sending a confirmation to the user?");
    if (!confirmStop) return;
    
    try {
      const updates = {};
      updates[`users/${activeUserId}/alerts/sos`] = false;
      updates[`users/${activeUserId}/alerts/fallDetected`] = false;
      await update(ref(db), updates);
    } catch (error) {
      console.error("Failed to force stop alert:", error);
    }
  };

  const playAlertSound = () => {
    // Basic implementation of browser beep for demonstration
    // In production, use a dedicated audio file
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.value = 400; // Hz
    
    // Pulse pattern
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.3);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  };

  const getBatteryIcon = (level) => {
    if (!level) return <Battery className="text-muted" />;
    if (level > 60) return <Battery className="text-success" />;
    if (level > 20) return <BatteryMedium className="text-warning" />;
    return <BatteryLow className="text-danger" />;
  };

  const hasAlert = userData?.alerts?.sos || userData?.alerts?.fallDetected || userData?.commands?.sosFromCaretaker;

  return (
    <div className="app-container">
      <header style={{ padding: '1rem 2rem', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="text-accent" />
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Assistive Monitoring Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsHelpOpen(true)} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: '9999px' }}>
            <HelpCircle size={18} /> Guide
          </button>
          <button onClick={handleLogout} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '9999px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Multi-User Navigation Bar */}
      {Object.keys(usersData).length > 0 && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', padding: '0 2rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
          {Object.keys(usersData).map((uid, index) => {
            const user = usersData[uid];
            const hasUserAlert = user?.alerts?.sos || user?.alerts?.fallDetected || user?.commands?.sosFromCaretaker;
            return (
              <button
                key={uid}
                onClick={() => setActiveUserId(uid)}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeUserId === uid ? '3px solid var(--accent-color)' : '3px solid transparent',
                  color: activeUserId === uid ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: activeUserId === uid ? 'bold' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <User size={18} />
                Person {index + 1}
                {hasUserAlert && <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger-color)', borderRadius: '50%' }}></span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="dashboard-layout">
        <div className="widgets-row">
          
          {/* Alerts Panel */}
          <div className={`card ${hasAlert ? 'pulse-animation' : ''}`} style={{ borderColor: hasAlert ? 'var(--danger-color)' : 'var(--border-color)', backgroundColor: hasAlert ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)' }}>
            <h2 className="card-title">
              <ShieldAlert className={hasAlert ? "text-danger" : "text-muted"} /> 
              Emergency Alerts
            </h2>
            
            {!userData?.alerts && (
              <p className="text-muted">Waiting for data...</p>
            )}

            {userData?.alerts && !hasAlert && (
              <div className="status-badge" style={{ backgroundColor: 'var(--bg-success-subtle)', color: 'var(--success-color)' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--success-color)' }}></span>
                All Systems Normal
              </div>
            )}

            {userData?.alerts?.sos && (
              <div className="alert-box alert-danger" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <AlertTriangle size={24} />
                  <div>
                    <h3 style={{ color: 'inherit', margin: 0 }}>SOS ACTIVATED</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Immediate assistance required.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                  <button 
                    onClick={acknowledgeAlert} 
                    className="btn btn-success" 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--success-color)', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    Mark as Received
                  </button>
                  <button 
                    onClick={forceStopSos} 
                    className="btn" 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid var(--danger-color)', color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    Force Stop
                  </button>
                </div>
              </div>
            )}

            {userData?.alerts?.fallDetected && (
              <div className="alert-box alert-danger" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <Activity size={24} />
                  <div>
                    <h3 style={{ color: 'inherit', margin: 0 }}>FALL DETECTED</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>A potential fall was detected by the device.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                  <button 
                    onClick={acknowledgeAlert} 
                    className="btn btn-success" 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--success-color)', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    Mark as Received
                  </button>
                  <button 
                    onClick={forceStopSos} 
                    className="btn" 
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid var(--danger-color)', color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    Force Stop
                  </button>
                </div>
              </div>
            )}

            {userData?.commands?.sosFromCaretaker && (
              <div className="alert-box alert-warning">
                <Send size={24} />
                <div>
                  <h3 style={{ color: 'inherit', margin: 0 }}>CARETAKER SOS SENT</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Waiting for user device acknowledgment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Command Center */}
          <div className="card">
            <h2 className="card-title">Command Center</h2>
            <div className="input-group">
              <label className="input-label">Vibration Pattern</label>
              <select 
                className="input-field"
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
              >
                {VIBRATION_PATTERNS.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={sendSosToUser} 
              disabled={isSending}
              className="btn btn-warning" 
              style={{ marginTop: '1rem', fontWeight: 'bold' }}
            >
              <AlertTriangle size={18} />
              {isSending ? 'SENDING...' : 'SEND SOS TO USER'}
            </button>

            {userData?.commands && userData?.commands?.timestamp && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Last Command Sent</span>
                </div>
                <div style={{ fontSize: '0.875rem', backgroundColor: 'var(--background)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="text-muted">Pattern:</span>
                    <span style={{ fontWeight: 'bold' }}>{userData.commands.patternId || 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Time:</span>
                    <span>{new Date(userData.commands.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {userData?.device?.bluetoothState === 'Disabled' && (
              <button 
                onClick={requestBluetoothOn}
                className="btn" 
                style={{ marginTop: '1rem', fontWeight: 'bold', width: '100%', backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                <Bluetooth size={18} />
                Request Bluetooth ON
              </button>
            )}
          </div>

          {/* User Status Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="card-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Device Status</h2>
              <button 
                onClick={() => setIsBioOpen(true)}
                className="btn btn-primary" 
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
              >
                View Bio
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Network</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {userData?.device?.networkSignal?.includes('WiFi') ? <Wifi size={18} className="text-accent" /> : <Radio size={18} className="text-accent" />}
                  <span style={{ fontWeight: 600 }}>{userData?.device?.networkSignal || 'Offline'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Bluetooth</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {userData?.device?.bluetoothState === 'Enabled' ? (
                     <>
                       <Bluetooth size={18} className="text-accent" />
                       <span style={{ fontWeight: 600 }}>Enabled</span>
                     </>
                  ) : (
                     <>
                       <BluetoothOff size={18} className="text-danger" />
                       <span style={{ fontWeight: 600 }}>Disabled</span>
                     </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Battery Level</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getBatteryIcon(userData?.device?.battery)}
                  <span style={{ fontWeight: 600 }}>{userData?.device?.battery || 0}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted">Last Update</span>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  {userData?.live?.lastUpdated 
                    ? new Date(userData.live.lastUpdated).toLocaleTimeString() 
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Safe Zone Settings */}
          <div className="card">
            <h2 className="card-title">Safe Zone (Geofence)</h2>
            <div className="input-group">
              <label className="input-label">Radius (meters)</label>
              <input 
                type="number" 
                className="input-field" 
                value={safeZone}
                onChange={(e) => setSafeZone(Number(e.target.value))}
                min="10"
                max="5000"
              />
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Alerts will trigger if the user leaves this designated area around their current location.
            </p>
          </div>

        </div>

        <main className="map-section">
          <LiveMap location={userData?.live} safeZoneRadius={safeZone} />
        </main>
      </div>

      {/* Caretaker Help Modal */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info className="text-accent" size={24} />
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Caretaker User Guide</h2>
              </div>
              <button onClick={() => setIsHelpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} className="text-danger" /> Emergency Alerts
                </h3>
                <p>When the user triggers an SOS or the device detects a fall, a loud buzzer will sound on this dashboard. Click the green <strong>"Mark as Received"</strong> button inside the flashing red alert box to silence the buzzer and instantly send a vibration (Double Pulse) back to the user's device, letting them know help is on the way.</p>
              </div>

              <div>
                <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={18} className="text-warning" /> Command Center
                </h3>
                <p>You can proactively send specific vibration patterns to the user's device without an emergency. Select a pattern (e.g., "Gentle" for a check-in, "SOS" for an emergency) and click <strong>"SEND SOS TO USER"</strong>.</p>
              </div>

              <div>
                <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bluetooth size={18} className="text-accent" /> Device Status & Bluetooth
                </h3>
                <p>This panel shows real-time Battery and Network levels. If the user's Bluetooth is accidentally turned off, you can click <strong>"Request Bluetooth ON"</strong>. This forces a prompt on the user's phone asking them to re-enable Bluetooth.</p>
              </div>

              <div>
                <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} className="text-success" /> Safe Zone (Geofence)
                </h3>
                <p>Set a radius in meters around the user's current location. While not fully automated yet, this feature is designed to trigger visual warnings if the user wanders beyond the defined radius.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Patient Bio Modal */}
      {isBioOpen && (
        <div className="modal-overlay" onClick={() => setIsBioOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User className="text-accent" size={24} />
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Person Bio Data</h2>
              </div>
              <button onClick={() => setIsBioOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                <span>Disability Type</span>
                <select 
                  value={userData?.profile?.disabilityType || 'Blind and Deaf'}
                  onChange={(e) => update(ref(db, `users/${activeUserId}/profile`), { disabilityType: e.target.value })}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                >
                  <option value="Blind">Blind Only</option>
                  <option value="Deaf">Deaf Only</option>
                  <option value="Blind and Deaf">Blind and Deaf</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span>Age</span>
                <strong style={{ color: 'var(--text-primary)' }}>64</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span>Blood Group</span>
                <strong style={{ color: 'var(--text-primary)' }}>O+</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span>Medical Conditions</span>
                <strong style={{ color: 'var(--text-primary)' }}>Hypertension, Asthma</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span>Emergency Contact 1</span>
                <strong style={{ color: 'var(--text-primary)' }}>John Doe (Son) - +1 555-0198</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Emergency Contact 2</span>
                <strong style={{ color: 'var(--text-primary)' }}>Jane Smith (Doctor) - +1 555-0199</strong>
              </div>
              
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                * This profile data is currently simulated for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
