import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000';

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
  const scrollRef = useRef(null);

  // Poll hardware stats every 3 seconds
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
    pollStats(); // Initial call
    
    return () => clearInterval(interval);
  }, []);

  // Scroll to top when new messages arrive
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
    <div className="holo-call-container">
      {/* SCANLINES OVERLAY */}
      <div className="scanlines"></div>

      {/* UPPER FIELD - HOLO-CHAMBER */}
      <div className="upper-field">
        {/* AVATAR */}
        <div className="avatar-chamber">
          <SpriteAvatar />
        </div>

        {/* HARDWARE STAT OVERLAYS */}
        <div className="stat-overlay stat-tl">
          <div className="stat-label">CPU</div>
          <div className="stat-value flicker">{stats.cpu_percent.toFixed(1)}%</div>
        </div>

        <div className="stat-overlay stat-tr">
          <div className="stat-label">TEMP</div>
          <div className="stat-value flicker">{stats.cpu_temp}°C</div>
        </div>

        <div className="stat-overlay stat-bl">
          <div className="stat-label">RAM</div>
          <div className="stat-value flicker">{stats.ram_percent.toFixed(1)}%</div>
        </div>

        <div className="stat-overlay stat-br">
          <div className="stat-label">DISK</div>
          <div className="stat-value flicker">{stats.disk_percent.toFixed(1)}%</div>
        </div>
      </div>

      {/* HORIZON LINE */}
      <div className="horizon-line"></div>

      {/* LOWER FIELD - DATA LINK */}
      <div className="lower-field">
        {/* INPUT SECTION AT TOP */}
        <div className="input-section">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ENTER COMMAND..."
            className="command-input"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading} className="send-btn">
            {loading ? '◉ PROCESSING' : '▶ SEND'}
          </button>
          <button 
            onClick={() => setVoice(!voice)} 
            className={`voice-btn ${voice ? 'active' : ''}`}
            title="Toggle voice output"
          >
            {voice ? '🔊' : '🔇'}
          </button>
        </div>

        {/* CHAT LOG - REVERSE ORDER */}
        <div className="chat-log" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              [AWAITING INPUT]
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}> 
                <span className="role">{msg.role === 'user' ? 'YOU' : 'SAGE'}:</span>
                <span className="content">{msg.content}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SpriteAvatar() {
  const canvasRef = useRef(null);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.src = '/sprite-sheet.png'; // Make sure this exists in public/

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % 20); // 20 frames total (5x4 grid)
    }, 50); // ~20 FPS

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Assuming sprite sheet is 5 columns x 4 rows
      const frameWidth = img.width / 5;
      const frameHeight = img.height / 4;

      const col = frameIndex % 5;
      const row = Math.floor(frameIndex / 5);

      // Clear and draw current frame
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        img,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
    img.src = '/sprite-sheet.png';
  }, [frameIndex]);

  return <canvas ref={canvasRef} width={200} height={200} className="sprite-canvas" />;
}

export default App;