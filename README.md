<div align="center">
  <h1>🚀 MERN-CHAT-REALTIME (Backend API)</h1>
  <p>Backend API สำหรับแอปพลิเคชันแชทแบบ Real-time สร้างด้วย Node.js, Express, MongoDB และ Socket.IO</p>
</div>

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Node.js & Express.js**: สร้าง RESTful API และ Server
- **MongoDB & Mongoose**: ฐานข้อมูล NoSQL และไลบรารีจัดการ Schema
- **Socket.IO**: จัดการระบบแชทแบบ Real-time (WebSockets)
- **JSON Web Token (JWT)**: ระบบยืนยันตัวตน (Authentication) อิงตาม HttpOnly Cookie เพื่อความปลอดภัยสูงสุด
- **Bcrypt**: สำหรับสับ (Hash) รหัสผ่านก่อนเก็บลงฐานข้อมูล
- **Cloudinary**: อัปโหลดและจัดการไฟล์รูปภาพ (โปรไฟล์, รูปที่ส่งในแชท)

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

1. **Clone โปรเจกต์**
   ```bash
   git clone https://github.com/eyejangg/MERN-CHAT-REALTIME.git
   cd MERN-CHAT-REALTIME
   ```

2. **ติดตั้งไลบรารีทั้งหมด**
   ```bash
   npm install
   ```

3. **ตั้งค่าตัวแปรระดับระบบ (Environment Variables)**
   สร้างไฟล์ `.env` ไว้ที่ Root ของโปรเจกต์ และใส่ข้อมูลตามนี้:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mernchat
   SECRET=your_super_secret_jwt_key
   BASE_URL=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   node_mode=development
   ```

4. **รันเซิร์ฟเวอร์**
   ```bash
   # สำหรับโหมด Development (มี Nodemon)
   npm run dev
   
   # สำหรับรันปกติ
   npm start
   ```
   *เซิร์ฟเวอร์จะรันที่ `http://localhost:5000`*

---

## 🧪 การทดสอบ API ด้วย Postman

เนื่องจากระบบนี้ใช้ **HttpOnly Cookie** ในการเก็บ JWT Token แทนการส่งผ่าน Header `Authorization` การทดสอบด้วย Postman จำเป็นต้องทำตามขั้นตอนนี้:

### ขั้นตอนตั้งค่า Postman ให้จำ Cookie
1. เคลียร์เคลียร์ Cache หรือ Session เก่าทิ้ง
2. ยิง API **Login** ก่อน (ระบบจะแนบ Cookie กลับมาที่เบราว์เซอร์/Postman โดยอัตโนมัติ)
3. ยิง API เส้นอื่นๆ ที่มีการป้องกันด้วย (`protectedRoute`) ได้เลยทันที โดยตราบใดที่ Cookie ยังไม่หมดอายุ

### 📌 เส้นทาง API ทั้งหมด (API Endpoints)

#### 🧑‍💻 สมัครสมาชิกและเข้าสู่ระบบ (Auth: `/api/v1/user`)
| Method | Endpoint | หน้าที่ | Body / Data |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/user/register` | สมัครสมาชิกใหม่ | `{ fullname, email, password }` |
| **POST** | `/api/v1/user/login` | เข้าสู่ระบบ | `{ email, password }` |
| **POST** | `/api/v1/user/logout` | ออกจากระบบ (ล้าง Cookie) | *ไม่มี* |
| **GET** | `/api/v1/user/check` | เช็คสถานะการล็อกอิน | *(เช็คจาก Cookie อัตโนมัติ)* |
| **PUT** | `/api/v1/user/update-profile` | เปลี่ยนรูปโปรไฟล์ | `{ profilePicture: "base64..." }` |

#### 💬 ระบบข้อความแชท (Message: `/api/v1/message`)
| Method | Endpoint | หน้าที่ | Body / Data |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/message/users` | ดึงรายชื่อผู้ใช้ที่สามารถแชทได้ | *(อ่านจาก Cookie เสมอ)* |
| **GET** | `/api/v1/message/:id` | ดึงประวัติแชทของตัวเองกับ `id` ที่เลือก | *ไม่มี* |
| **POST** | `/api/v1/message/send/:id` | ส่งข้อความไปยังเป้าหมาย | `{ text: "...", file: "base64..." }` |

---

## 📚 ตำราเจาะลึกโค้ด (Documentation)

หากต้องการศึกษาโครงสร้างการทำงานและ Flow โดยละเอียด ดูไฟล์ที่เราได้ทำสรุปไว้ให้:
* **`MERN_GUIDE.md`**: คู่มือการสร้างโปรเจกต์ตั้งแต่เริ่มต้น (From Scratch), สรุป Syntax ที่ใช้งาน
* **`FLOW_RANKING.md`**: ผ่ารหัสแชท Flow เบื้องหลังระหว่าง Frontend × Backend, Socket.IO
