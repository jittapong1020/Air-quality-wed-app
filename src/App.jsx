import { useState } from 'react'
import axios from 'axios'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function App() {
  const [files, setFiles] = useState([])
  const [predictDays, setPredictDays] = useState(7)
  const [data, setData] = useState([])
  const [status, setStatus] = useState('')
  const [color, setColor] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

      // คำนวณสถานะภาพรวม (แย่ที่สุดในสัปดาห์)
      const maxPM25 = Math.max(...preds)
      if (maxPM25 > 75) {
        setStatus('🚨 อันตราย! มีบางวันค่าฝุ่นเกินมาตรฐาน ควรงดกิจกรรมกลางแจ้ง')
        setColor('#fff1f0') 
      } else if (maxPM25 > 37.5) {
        setStatus('⚠️ เริ่มมีผลกระทบ! ควรเตรียมหน้ากากอนามัยสำหรับบางวัน')
        setColor('#fffbe6') 
      } else {
        setStatus('✅ คุณภาพอากาศดีตลอดช่วงพยากรณ์! ทำกิจกรรมได้ตามปกติ')
        setColor('#f6ffed') 
      }

    } catch (error) {
      console.error("Error:", error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับ API (อย่าลืมเช็คว่ารัน FastAPI อยู่ไหม)')
    } finally {
      setIsLoading(false)
    }
  }

  // ฟังก์ชันคำนวณสีพื้นหลังของการ์ดรายวัน
  const getCardStyle = (pmValue) => {
    if (pmValue > 75) {
      return { bg: '#fff1f0', border: '#ffccc7', text: '#cf1322', label: 'อันตราย 🚨' } // แดง
    } else if (pmValue > 37.5) {
      return { bg: '#fffbe6', border: '#ffe58f', text: '#d48806', label: 'เริ่มมีผลกระทบ ⚠️' } // ส้ม
    } else {
      return { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d', label: 'อากาศดี ✅' } // เขียว
    }
  }

  return (
    <>
      <div className="app-wrapper">
        <div className="main-container">
          
          <header className="header-section">
            <h1 className="header-title">☁️ AI พยากรณ์ฝุ่น PM2.5</h1>
            <p className="header-subtitle">วิเคราะห์ประวัติข้อมูลจาก IoT Sensor เพื่อทำนายแนวโน้มคุณภาพอากาศล่วงหน้า</p>
          </header>

          <section className="input-card">
            <div className="form-layout">
              <div>
                <label className="input-label">1. อัปโหลดข้อมูลอดีต (ไฟล์ CSV หรือ ไฟล์ดิบ):</label>
                <input type="file" multiple onChange={handleFileChange} className="form-input" />
                {files.length > 0 && (
                  <div className="file-status">
                    ✓ เลือกไว้ {files.length} ไฟล์
                  </div>
                )}
              </div>
              <div>
                <label className="input-label">2. จำนวนวันที่อยากทำนาย:</label>
                <input 
                  type="number" min="1" max="30" value={predictDays} 
                  onChange={(e) => setPredictDays(e.target.value)} 
                  className="form-input" 
                />
                <span style={{ fontSize: '0.85rem', color: '#888' }}>(แนะนำ 1 - 30 วัน)</span>
              </div>
            </div>

            <button 
              className="submit-btn"
              onClick={handleUpload} 
              disabled={isLoading}
            >
              {isLoading ? '🔄 กำลังประมวลผลข้อมูลผ่าน AI...' : `🚀 เริ่มทำนายผล ${predictDays} วันข้างหน้า`}
            </button>
          </section>

          {data.length > 0 && (
            <section 
              className="result-card"
              style={{ border: `2px solid ${status.includes('🚨') ? '#ffccc7' : status.includes('⚠️') ? '#ffe58f' : '#b7eb8f'}` }}
            >
              <div 
                className="alert-box"
                style={{ backgroundColor: color }}
              >
                สรุปภาพรวม: {status}
              </div>

              {/* 🚨 ส่วนของ Daily Cards แสดงผลรายวัน 🚨 */}
              <h3 className="chart-title">ผลการพยากรณ์รายวัน</h3>
              <div className="cards-grid">
                {data.map((day, index) => {
                  const styleInfo = getCardStyle(day.PM25);
                  return (
                    <div 
                      key={index} 
                      className="daily-card" 
                      style={{ backgroundColor: styleInfo.bg, borderColor: styleInfo.border }}
                    >
                      <div className="card-day">{day.name}</div>
                      <div className="card-pm" style={{ color: styleInfo.text }}>
                        {day.PM25}
                        <span className="card-unit">µg/m³</span>
                      </div>
                      <div className="card-label" style={{ color: styleInfo.text }}>
                        {styleInfo.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ส่วนของกราฟ (เก็บไว้ด้านล่างให้ดูเทรนด์) */}
              <div className="chart-container">
                <h3 className="chart-title">กราฟแสดงแนวโน้มค่าฝุ่น PM2.5</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" tick={{fill: '#888'}} axisLine={{stroke: '#ccc'}} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{fill: '#888'}} axisLine={{stroke: '#ccc'}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Line 
                      type="monotone" 
                      dataKey="PM25" 
                      stroke="#1890ff" 
                      strokeWidth={4} 
                      dot={{ r: 6, stroke: '#1890ff', strokeWidth: 3, fill: 'white' }} 
                      activeDot={{ r: 8, fill: '#1890ff' }} 
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

export default App