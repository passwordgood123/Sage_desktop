import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

function useDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    cpu_percent: 0,
    ram_percent: 0,
    disk_percent: 0,
    battery_percent: 100,
    cpu_temp: 0
  });
  const [voice, setVoice] = useState(false);
  const [held, setHeld] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const scrollRef = useRef(null);
  const now = useDateTime();

  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  useEffect(() => {
    const pollStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };
    const interval = setInterval(pollStats, 3000);
    pollStats();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [{ role: 'user', content: userMsg }, ...prev]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, voice })
      });
      const data = await res.json();
      setMessages(prev => [{ role: 'sage', content: data.response }, ...prev]);
      setStats(data.hardware_stats);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [{ role: 'sage', content: 'Error: Could not reach API' }, ...prev]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="tac-root">
      {/* SCANLINES */}
      <div className="scanlines" />

      {/* CIRCUIT BACKGROUND DECORATIONS */}
      <div className="circuit-bg" />

      {/* ── HEADER BAR ── */}
      <header className="tac-header">
        <div className="header-left">
          <span className="header-badge">◈ SAGE//OS</span>
          <span className="header-sep">│</span>
          <span className="header-proto">COMM PROTOCOL: <span className="neon-green">ACTIVE HOLOGRAPHIC CALL</span></span>
        </div>
        <div className="header-center">
          <span className="dot-blink" />
          <span className="header-status">UPLINK SECURE</span>
        </div>
        <div className="header-right">
          <span className="header-datetime">{dateStr}</span>
          <span className="header-sep">│</span>
          <span className="header-datetime neon-cyan">{timeStr}</span>
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="tac-body">

        {/* LEFT PANEL */}
        <aside className="tac-left">
          <div className="info-panel">
            <div className="info-panel-label">PARTICIPANT</div>
            <div className="info-panel-value neon-cyan">USER//LOCAL</div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">ID</div>
            <div className="info-panel-value neon-green">SG-7734-ΩX</div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">STATUS</div>
            <div className="info-panel-value neon-green">● ONLINE</div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">CPU</div>
            <div className="info-panel-value flicker">{stats.cpu_percent.toFixed(1)}%</div>
            <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${stats.cpu_percent}%` }} /></div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">RAM</div>
            <div className="info-panel-value flicker">{stats.ram_percent.toFixed(1)}%</div>
            <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${stats.ram_percent}%` }} /></div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">DISK</div>
            <div className="info-panel-value flicker">{stats.disk_percent.toFixed(1)}%</div>
            <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${stats.disk_percent}%` }} /></div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">TEMP</div>
            <div className="info-panel-value flicker">{stats.cpu_temp}°C</div>
          </div>
          <div className="info-panel">
            <div className="info-panel-label">BATTERY</div>
            <div className="info-panel-value flicker">{stats.battery_percent}%</div>
            <div className="mini-bar"><div className="mini-bar-fill battery" style={{ width: `${stats.battery_percent}%` }} /></div>
          </div>
          {/* CIRCUIT CORNER DECORATION */}
          <div className="circuit-corner-tl" />
          <div className="circuit-corner-bl" />
        </aside>

        {/* CENTER PANEL */}
        <main className="tac-center">
          {/* AVATAR ZONE */}
          <div className="avatar-zone">
            <div className="avatar-ring outer" />
            <div className="avatar-ring inner" />
            <div className="avatar-hex">
              <SpriteAvatar />
            </div>
            <div className="avatar-label">
              {loading ? (
                <span className="neon-cyan flicker">◉ PROCESSING...</span>
              ) : (
                <span className="neon-green">▲ SAGE AI ONLINE</span>
              )}
            </div>
            <div className="avatar-subtext">HOLOGRAPHIC INTERFACE v2.7</div>
            {/* corner accents */}
            <div className="bevel-tl" />
            <div className="bevel-tr" />
            <div className="bevel-bl" />
            <div className="bevel-br" />
          </div>

          {/* CHAT LOG */}
          <div className="chat-log" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="empty-state">── [AWAITING INPUT] ──</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <span className="role">{msg.role === 'user' ? '▶ YOU' : '◈ SAGE'}:</span>
                  <span className="content">{msg.content}</span>
                </div>
              ))
            )}
          </div>

          {/* INPUT */}
          <div className="input-section">
            <div className="input-prefix">⌨</div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ENTER COMMAND..."
              className="command-input"
              disabled={loading || held}
            />
            <button onClick={sendMessage} disabled={loading || held} className="send-btn">
              {loading ? '◉' : '▶ SEND'}
            </button>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="tac-right">
          <button
            className={`tac-btn ${held ? 'active' : ''}`}
            onClick={() => setHeld(h => !h)}
          >
            {held ? '▶ RESUME' : '⏸ HOLD'}
          </button>
          <button
            className={`tac-btn ${aiMode ? 'active' : ''}`}
            onClick={() => setAiMode(a => !a)}
          >
            ◈ AI
          </button>
          <button
            className={`tac-btn ${voice ? 'active' : ''}`}
            onClick={() => setVoice(v => !v)}
            title="Toggle voice output"
          >
            {voice ? '🔊 VOX' : '🔇 VOX'}
          </button>
          <button className="tac-btn">⟳ SYNC</button>
          <button className="tac-btn">⊞ NET</button>
          <button className="tac-btn danger">⊗ END</button>

          {/* SIGNAL STRENGTH */}
          <div className="signal-block">
            <div className="signal-label">SIGNAL</div>
            <div className="signal-bars">
              <div className="sig-bar s1" />
              <div className="sig-bar s2" />
              <div className="sig-bar s3" />
              <div className="sig-bar s4" />
              <div className="sig-bar s5" />
            </div>
            <div className="signal-value neon-green">98%</div>
          </div>

          {/* CIRCUIT CORNER DECORATION */}
          <div className="circuit-corner-tr" />
          <div className="circuit-corner-br" />
        </aside>
      </div>

      {/* ── FOOTER BAR ── */}
      <footer className="tac-footer">
        <span className="footer-item">◈ ENCRYPTION: AES-256</span>
        <span className="footer-sep">····</span>
        <span className="footer-item">◈ LATENCY: 4ms</span>
        <span className="footer-sep">····</span>
        <span className="footer-item neon-cyan">◈ CHANNEL: ENCRYPTED//ALPHA</span>
        <span className="footer-sep">····</span>
        <span className="footer-item">◈ NODE: LOCAL-7</span>
      </footer>
    </div>
  );
}

function SpriteAvatar() {
  const canvasRef = useRef(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % 20);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const frameWidth = img.width / 5;
      const frameHeight = img.height / 4;
      const col = frameIndex % 5;
      const row = Math.floor(frameIndex / 5);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
    };
    img.src = '/sprite-sheet.png';
  }, [frameIndex]);

  return <canvas ref={canvasRef} width={200} height={200} className="sprite-canvas" />;
}

export default App;