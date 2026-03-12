# PM2.5 Prediction Dashboard 📊 (React)

เว็บแอปพลิเคชันสำหรับแสดงผลการพยากรณ์ค่าฝุ่น PM2.5 โดยผู้ใช้สามารถอัปโหลดไฟล์ Log จากเซนเซอร์หรือไฟล์ CSV เพื่อดูแนวโน้มล่วงหน้าผ่านกราฟที่สวยงาม

## 🛠️ Tech Stack
* **Framework:** React (Vite)
* **Styling:** CSS3 (Custom Design)
* **Charts:** Recharts (Interactive Line Chart)
* **HTTP Client:** Axios
* **Icon & UI:** Standard HTML/CSS with Responsive Design

## 📁 โครงสร้างโฟลเดอร์
```text
.
├── src/
│   ├── App.jsx          # UI หลักและ Logic การเชื่อมต่อ API
│   ├── App.css          # การตกแต่งหน้าตา (Dashboard Style)
│   └── main.jsx         # จุดเริ่มต้นของ React App
├── public/              # ไฟล์ Static ต่างๆ
├── package.json         # รายการ Library (axios, recharts, etc.)
└── README.md            # คู่มือการใช้งาน