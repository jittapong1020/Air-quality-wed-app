import { useState } from 'react'
import axios from 'axios'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

function App() {
  const [files, setFiles] = useState([])
  const [predictDays, setPredictDays] = useState(7)
  const [data, setData] = useState([])
  const [status, setStatus] = useState('')
  const [color, setColor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('1h');
  const [dragActive, setDragActive] = useState(false);

  const getFilteredData = () => {
    if (viewMode === '1h') return data.slice(0, 24);
    if (viewMode === '6h') return data.filter((_, i) => i % 6 === 0);
    return data;
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleUpload = async () => {
    if (files.length === 0) return alert('กรุณาเลือกไฟล์ประวัติข้อมูล (CSV หรือ ไฟล์ดิบ) ก่อนครับ!')
    if (predictDays < 1 || predictDays > 30) return alert('กรุณาระบุวันทำนายระหว่าง 1 - 30 วันครับ!')

    setIsLoading(true)
    setData([])

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('days', predictDays)

    try {
      const response = await axios.post('https://air-quality-backend-lwg0.onrender.com/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.error) {
        alert("ระบบหลังบ้านแจ้ง Error: " + response.data.error)
        setIsLoading(false)
        return
      }

      const preds = response.data.predictions

      const chartData = preds.map((val, index) => ({
        name: `วันที่ ${index + 1}`,
        PM25: parseFloat(val.toFixed(2))
      }))
      setData(chartData)

      // คำนวณสถานะภาพรวม
      const maxPM25 = Math.max(...preds)
      const avgPM25 = preds.reduce((a, b) => a + b, 0) / preds.length
      
      if (maxPM25 > 75) {
        setStatus({
          text: '🚨 อันตราย! มีบางวันค่าฝุ่นเกินมาตรฐาน ควรงดกิจกรรมกลางแจ้ง',
          color: '#ff4d4f',
          bgColor: '#fff2f0',
          icon: '🔴'
        })
      } else if (maxPM25 > 37.5) {
        setStatus({
          text: '⚠️ เริ่มมีผลกระทบ! ควรเตรียมหน้ากากอนามัยสำหรับบางวัน',
          color: '#fa8c16',
          bgColor: '#fff7e6',
          icon: '🟠'
        })
      } else {
        setStatus({
          text: '✅ คุณภาพอากาศดีตลอดช่วงพยากรณ์! ทำกิจกรรมได้ตามปกติ',
          color: '#52c41a',
          bgColor: '#f6ffed',
          icon: '🟢'
        })
      }

    } catch (error) {
      console.error("Error:", error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับ API')
    } finally {
      setIsLoading(false)
    }
  }

  const getCardStyle = (pmValue) => {
    if (pmValue > 75) {
      return { 
        bg: '#fff2f0', 
        border: '#ffccc7', 
        text: '#cf1322', 
        label: 'อันตราย',
        icon: '🚨',
        gradient: 'linear-gradient(135deg, #fff2f0 0%, #ffffff 100%)'
      }
    } else if (pmValue > 37.5) {
      return { 
        bg: '#fff7e6', 
        border: '#ffd591', 
        text: '#d46b00', 
        label: 'ปานกลาง',
        icon: '⚠️',
        gradient: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)'
      }
    } else {
      return { 
        bg: '#f6ffed', 
        border: '#b7eb8f', 
        text: '#389e0d', 
        label: 'ดี',
        icon: '✅',
        gradient: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)'
      }
    }
  }

  const getStats = () => {
    if (data.length === 0) return null;
    const values = data.map(d => d.PM25);
    return {
      max: Math.max(...values).toFixed(2),
      min: Math.min(...values).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
    };
  }

  const stats = getStats();

  return (
    <div className="app">
      {/* Particles Background */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
          }} />
        ))}
      </div>

      <div className="container">
        {/* Header Section */}
        <header className="header">
          <div className="header-icon">🌍</div>
          <h1 className="header-title">
            Air Quality Predictor
            <span className="header-badge">AI-Prediction</span>
          </h1>
          <p className="header-subtitle">
            วิเคราะห์และพยากรณ์คุณภาพอากาศล่วงหน้าด้วยเทคโนโลยี Machine Learning
          </p>
        </header>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-card">
            <div className="input-card-header">
              <h2>📤 อัปโหลดข้อมูล</h2>
              <p>รองรับไฟล์ CSV หรือ ไฟล์ดิบจากเซ็นเซอร์</p>
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label className="input-label">
                  <span className="label-number">1</span>
                  เลือกไฟล์ข้อมูล
                </label>
                <div 
                  className={`file-upload ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="file-input"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-label">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      {files.length > 0 ? (
                        <span className="file-count">
                          ✓ เลือกแล้ว {files.length} ไฟล์
                        </span>
                      ) : (
                        <>
                          <span className="upload-title">คลิกเพื่อเลือกไฟล์</span>
                          <span className="upload-subtitle">หรือลากไฟล์มาวางที่นี่</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-icon">📄</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span className="label-number">2</span>
                  ระยะเวลาทำนาย
                </label>
                <div className="days-selector">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={predictDays}
                    onChange={(e) => setPredictDays(parseInt(e.target.value))}
                    className="days-slider"
                  />
                  <div className="days-input-wrapper">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={predictDays}
                      onChange={(e) => setPredictDays(e.target.value)}
                      className="days-input"
                    />
                    <span className="days-unit">วัน</span>
                  </div>
                </div>
                <div className="days-hint">
                  <span>📅 {predictDays} วันข้างหน้า</span>
                  <span className="hint-badge">แนะนำ 1-30 วัน</span>
                </div>
              </div>
            </div>

            <button
              className={`predict-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  กำลังประมวลผล...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  เริ่มพยากรณ์ {predictDays} วันข้างหน้า
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {data.length > 0 && (
          <div className="results-section">
            {/* Status Banner */}
            <div className="status-banner" style={{ backgroundColor: status.bgColor }}>
              <div className="status-icon">{status.icon}</div>
              <div className="status-content">
                <div className="status-title" style={{ color: status.color }}>
                  {status.text}
                </div>
                {stats && (
                  <div className="status-stats">
                    <div className="stat-item">
                      <span className="stat-label">ค่าสูงสุด</span>
                      <span className="stat-value" style={{ color: '#cf1322' }}>{stats.max} µg/m³</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ค่าเฉลี่ย</span>
                      <span className="stat-value" style={{ color: '#fa8c16' }}>{stats.avg} µg/m³</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">ค่าต่ำสุด</span>
                      <span className="stat-value" style={{ color: '#389e0d' }}>{stats.min} µg/m³</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Cards */}
            <div className="cards-section">
              <h3 className="section-title">
                <span className="title-icon">📊</span>
                ผลการพยากรณ์รายวัน
              </h3>
              <div className="cards-grid">
                {data.map((day, index) => {
                  const style = getCardStyle(day.PM25);
                  return (
                    <div
                      key={index}
                      className="daily-card"
                      style={{ background: style.gradient, borderColor: style.border }}
                    >
                      <div className="card-header">
                        <span className="card-day">{day.name}</span>
                        <span className="card-icon">{style.icon}</span>
                      </div>
                      <div className="card-value" style={{ color: style.text }}>
                        {day.PM25}
                        <span className="card-unit">µg/m³</span>
                      </div>
                      <div className="card-footer" style={{ color: style.text }}>
                        {style.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section">
              <div className="chart-header">
                <h3 className="section-title">
                  <span className="title-icon">📈</span>
                  กราฟแสดงแนวโน้ม
                </h3>
                <div className="chart-tabs">
                  {['1h', '6h', '12h', '24h'].map(mode => (
                    <button
                      key={mode}
                      className={`tab-btn ${viewMode === mode ? 'active' : ''}`}
                      onClick={() => setViewMode(mode)}
                    >
                      ทุก {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={getFilteredData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#8c8c8c', fontSize: 12 }}
                      axisLine={{ stroke: '#d9d9d9' }}
                    />
                    <YAxis 
                      tick={{ fill: '#8c8c8c', fontSize: 12 }}
                      axisLine={{ stroke: '#d9d9d9' }}
                      label={{ 
                        value: 'PM2.5 (µg/m³)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: '#8c8c8c', fontSize: 12 }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="PM25"
                      stroke="#1890ff"
                      strokeWidth={3}
                      fill="url(#pmGradient)"
                      dot={{ r: 4, fill: '#1890ff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#1890ff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-icon">🌡️</div>
                  <div className="summary-content">
                    <div className="summary-label">ค่า PM2.5 สูงสุด</div>
                    <div className="summary-value" style={{ color: '#cf1322' }}>{stats.max} µg/m³</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">📊</div>
                  <div className="summary-content">
                    <div className="summary-label">ค่า PM2.5 เฉลี่ย</div>
                    <div className="summary-value" style={{ color: '#fa8c16' }}>{stats.avg} µg/m³</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">📉</div>
                  <div className="summary-content">
                    <div className="summary-label">ค่า PM2.5 ต่ำสุด</div>
                    <div className="summary-value" style={{ color: '#389e0d' }}>{stats.min} µg/m³</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App