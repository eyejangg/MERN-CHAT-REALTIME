# คู่มือการใช้งาน Backend API และรายละเอียดการแก้ไขระบบ (MERN Chat Backend)

## สรุปรายการแก้ไขและการปรับปรุงระบบ (System Update Log)

### 1. การแก้ไขปัญหาเรื่องการ Auth และ Middleware (`auth.middleware.js`)
*   **โหลด Environment Variables**: เพิ่ม `require("dotenv").config()` เพื่อให้อ่านค่า `SECRET` ได้
*   **ตั้งชื่อ Cookie ให้ตรงกัน**: แก้ไขให้ Login ส่ง Cookie ชื่อ `jwt` และ Middleware อ่านจาก `req.cookies.jwt`
*   **แก้ ReferenceError**: ลบ Code ส่วนเกินที่ประกาศซ้ำซ้อน
*   **เพิ่ม Logs**: ใส่ `console.error` เพื่อให้ Debug ง่ายขึ้น

### 2. การแก้ปัญหา Server Configuration (`index.js`)
*   **เพิ่มขนาด Request Body**: ปรับ `body-parser` เป็น **50mb** เพื่อรองรับการอัปโหลดรูปภาพ Base64
*   **ย้ายลำดับ Middleware**: ย้าย `cookie-parser` ขึ้นก่อน Routes เพื่อให้อ่าน Cookie ได้

### 3. ฟีเจอร์ Edit Profile (`controllers/user.Controller.js`)
*   **Cloudinary Upload**: เพิ่ม Logic อัปโหลดรูปภาพก่อนบันทึกลง Database
*   **แก้ไขตัวแปร Model**: เปลี่ยนจาก `User` เป็น `UserModel` ให้ถูกต้อง
*   **ปรับปรุง Logic**: แยกเคสการอัปเดต (ชื่อ+รูป / รูปอย่างเดียว / ชื่ออย่างเดียว)
*   **แก้ไข Syntax**: จัดรูปแบบ `try-catch` ให้ถูกต้อง

### 5. การแก้ไขระบบ Real-time (Socket.io)
*   **แก้ไขการพ่น Event**: ตรวจสอบการส่ง `newMessage` ผ่าน Socket ว่าส่งข้อมูล `newMessage` ไปให้ผู้รับ (Recipient) ได้ถูกต้อง
*   **การเชื่อมต่อ**: ปรับปรุงให้ Server รันผ่าน `server.listen` แทน `app.listen` เพื่อให้ Socket.io ทำงานได้สมบูรณ์

---

## 🚀 คู่มือการทดสอบ API ด้วย Postman

**Base URL**: `http://localhost:5000`

### 1. สมัครสมาชิก (Register)
*   **Method**: `POST`
*   **URL**: `{{Base_URL}}/api/v1/user/register`
*   **Body** (JSON):
    ```json
    {
      "fullname": "Test User",
      "email": "test@example.com",
      "password": "password123"
    }
    ```
*   **ผลลัพธ์**: ได้รับข้อความ "User registered successfully" และได้ Cookie `jwt` กลับมา

### 2. เข้าสู่ระบบ (Login)
*   **Method**: `POST`
*   **URL**: `{{Base_URL}}/api/v1/user/login`
*   **Body** (JSON):
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
*   **ผลลัพธ์**:
    *   ได้รับ User ID และ Token ใน Response Body
    *   **สำคัญ**: Postman จะเก็บ Cookie ชื่อ `jwt` ไว้ให้อัตโนมัติ (ดูที่แท็บ Cookies)

### 3. ตรวจสอบสถานะการล็อกอิน (Check Auth)
*   **Method**: `GET`
*   **URL**: `{{Base_URL}}/api/v1/user/check`
*   **Auth**: ไม่ต้องตั้งค่าอะไรเพิ่ม (ใช้ Cookie ที่ได้จากการ Login)
*   **ผลลัพธ์**: ควรได้รับข้อมูล JSON ของ User ปัจจุบัน (เช่น `_id`, `fullname`, `email`)

### 4. อัปเดตโปรไฟล์ (Update Profile)
*   **Method**: `PUT`
*   **URL**: `{{Base_URL}}/api/v1/user/update-profile`
*   **Body** (JSON):
    ```json
    {
      "fullname": "New Name",
      "profilePicture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // ใส่ Base64 String ของรูปภาพ
    }
    ```
    *   **Note**: คุณสามารถแปลงรูปเป็น Base64 ได้จากเว็บต่างๆ หรือใช้ Frontend ส่งมา
*   **ผลลัพธ์**: ได้รับข้อมูล User ที่อัปเดตแล้ว และรูปภาพที่อัปโหลดขึ้น Cloudinary

### 5. ออกจากระบบ (Logout)
*   **Method**: `POST`
*   **URL**: `{{Base_URL}}/api/v1/user/logout`
*   **ผลลัพธ์**: Cookie `jwt` จะถูกลบออก (Postman Cookie จะหายไปหรือหมดอายุ)

---

## ⚠️ ปัญหาที่พบบ่อย (Troubleshooting)

1.  **Unauthorized - No Token provided**:
    *   แปลว่า Browser/Postman ไม่ได้ส่ง Cookie ไปให้ Server
    *   **แก้วิธี**: ให้ลอง Login ใหม่ แล้วเช็คว่ามี Cookie ชื่อ `jwt` ถูกสร้างขึ้นหรือไม่

2.  **PayloadTooLargeError**:
    *   แปลว่ารูปภาพ Base64 ใหญ่เกินไป
    *   **แก้วิธี**: Server ปรับให้รับได้ 50mb แล้ว ถ้ายังไม่ได้ ลองลดขนาดรูปก่อนส่ง

3.  **User Not Found**:
    *   แปลว่า ID ใน Token ไม่ตรงกับ ID ใน Database
    *   **แก้วิธี**: ให้ Logout แล้ว Login ใหม่ เพื่อสร้าง Token ที่ถูกต้อง
