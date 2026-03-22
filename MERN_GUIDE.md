# 📖 MERN-CHAT-REALTIME — คู่มือฉบับสมบูรณ์

> สร้างจากโค้ดจริงในโปรเจกต์ของคุณ 100%

---

# 📦 ส่วนที่ 1: Library ทั้งหมดที่ใช้

## 🔧 Backend Libraries (`MERN-CHAT-REALTIME/package.json`)

| Library | Version | หน้าที่ | ใช้ในไฟล์ไหน |
| :--- | :--- | :--- | :--- |
| **express** | ^5.2.1 | เฟรมเวิร์คหลัก สร้าง API Server | `index.js` |
| **mongoose** | ^9.1.6 | ODM เชื่อมต่อ MongoDB + สร้าง Schema | `models/User.js`, `models/Message.js` |
| **socket.io** | ^4.8.3 | Real-time Server สื่อสาร 2 ทาง | `lib/socket.js` |
| **jsonwebtoken** | ^9.0.3 | สร้าง/ตรวจ JWT Token | `controllers/user.Controller.js`, `middlewares/auth.middleware.js` |
| **bcrypt** | ^6.0.0 | สับรหัสผ่าน (Hashing) | `controllers/user.Controller.js` |
| **cookie-parser** | ^1.4.7 | อ่าน Cookie จาก Request | `index.js` |
| **cors** | ^2.8.6 | อนุญาตให้ Frontend คุยกับ Backend ข้ามพอร์ต | `index.js` |
| **cloudinary** | ^2.9.0 | อัปโหลดรูปภาพไปเก็บบน Cloud | `configs/cloudinary.js`, `controllers/` |
| **dotenv** | ^17.2.4 | อ่านค่า .env (ค่าลับ) | `index.js`, `lib/socket.js` |
| **cookie** | ^1.1.1 | ช่วยจัดการ Cookie | ทั่วไป |

---

## 🎨 Frontend Libraries (`MERN-CHAT-REALTIME-FRONTEND/package.json`)

| Library | Version | หน้าที่ | ใช้ในไฟล์ไหน |
| :--- | :--- | :--- | :--- |
| **react** | ^19.2.0 | เฟรมเวิร์คหลัก สร้าง UI | ทุกไฟล์ `.jsx` |
| **react-dom** | ^19.2.0 | เชื่อม React เข้ากับ Browser | `main.jsx` |
| **react-router-dom** | ^7.13.0 | จัดการ Route/เปลี่ยนหน้า (SPA) | `App.jsx` |
| **zustand** | ^5.0.11 | State Management (คลังเก็บข้อมูลกลาง) | `store/useAuthStore.js`, `store/useChatStore.js` |
| **axios** | ^1.13.5 | ยิง API ไป Backend | `lib/axios.js` |
| **socket.io-client** | ^4.8.3 | Real-time Client เชื่อมกับ Backend Socket | `lib/socket.js` |
| **tailwindcss** | ^4.1.18 | CSS Framework (Utility-first) | ทุก Component |
| **@tailwindcss/vite** | ^4.1.18 | Plugin เชื่อม Tailwind กับ Vite | `vite.config.js` |
| **lucide-react** | ^0.564.0 | ไอคอนสวยๆ (Send, Image, Eye, ...) | Components ต่างๆ |
| **react-hot-toast** | ^2.6.0 | แจ้งเตือน Popup สวยๆ (Success/Error) | Store ต่างๆ |

### devDependencies (ใช้ตอนพัฒนาเท่านั้น):
| Library | หน้าที่ |
| :--- | :--- |
| **vite** | เครื่องมือรันโปรเจกต์ + Build (เร็วกว่า Webpack มาก) |
| **@vitejs/plugin-react** | Plugin ให้ Vite เข้าใจ JSX |
| **eslint** | ตรวจโค้ดหา Bug/ข้อผิดพลาด |

---

# 🏗️ ส่วนที่ 2: การสร้างไฟล์ตั้งแต่เริ่มต้น (Step-by-Step)

## Phase 1: สร้าง Backend ก่อน (เพราะ Frontend ต้องมี API ให้เรียก)

### Step 1: สร้างโปรเจกต์
```bash
mkdir MERN-CHAT-REALTIME
cd MERN-CHAT-REALTIME
npm init -y                    # สร้าง package.json
```

### Step 2: ลง Library ทั้งหมด
```bash
npm install express mongoose socket.io jsonwebtoken bcrypt cookie-parser cors cloudinary dotenv
npm install -D nodemon         # Auto-restart ตอน dev
```

### Step 3: สร้าง `.env` (ค่าลับ)
```env
PORT=5000
BASE_URL=http://localhost:5000
MONGO_URI=mongodb+srv://...
SECRET=my_secret_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
node_mode=development
```

### Step 4: สร้างโครงสร้างโฟลเดอร์
```
MERN-CHAT-REALTIME/
├── configs/
│   └── cloudinary.js          ← Config Cloudinary
├── controllers/
│   ├── user.Controller.js     ← Logic: สมัคร/ล็อกอิน/อัปเดต
│   └── message.controller.js  ← Logic: ส่งแชท/ดึงแชท + Socket.IO
├── lib/
│   └── socket.js              ← สร้าง Socket.IO Server + userSocketMap
├── middlewares/
│   └── auth.middleware.js     ← ยามตรวจ JWT
├── models/
│   ├── User.js                ← Schema: fullname, email, password, profilePicture
│   └── Message.js             ← Schema: text, file, sender, recipient
├── routers/
│   ├── user.Route.js          ← เส้นทาง: /register, /login, /logout, /check
│   └── message.router.js     ← เส้นทาง: /users, /:id, /send/:id
├── index.js                   ← Entry Point (ประตูหลัก)
└── .env                       ← ค่าลับ
```

### Step 5: สร้างไฟล์ตามลำดับนี้ (สำคัญมาก!)

**ลำดับที่ 1:** `models/` → เพราะทุกอย่างต้องรู้ว่าข้อมูลหน้าตาเป็นยังไง
```javascript
// models/User.js
const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true, min: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, require: true, min: 6 },
    profilePicture: { type: String, default: "" },
}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);
```

**ลำดับที่ 2:** `configs/cloudinary.js` → ตั้งค่าคลาวด์เก็บรูป
```javascript
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = cloudinary;
```

**ลำดับที่ 3:** `lib/socket.js` → สร้าง Socket.IO Server (ต้องทำก่อน index.js!)
```javascript
require("dotenv").config();
const app = require('express')();
const server = require('http').createServer(app);
const userSocketMap = {}; // เก็บว่า userId ไหน → มี socketId อะไร

const io = require('socket.io')(server, {
    cors: { origin: [process.env.BASE_URL] }
});

function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

module.exports = { io, app, server, getReceiverSocketId };
```

**ลำดับที่ 4:** `middlewares/auth.middleware.js` → ยามตรวจ JWT
```javascript
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;                           // ❶ ดึง JWT จาก Cookie
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        
        const decoded = jwt.verify(token, process.env.SECRET);  // ❷ ถอดรหัส
        const user = await User.findById(decoded.userId).select("-password"); // ❸ หา User
        if (!user) return res.status(404).json({ message: "User Not Found" });
        
        req.user = user;  // ❹ แปะ User ไว้ให้ Controller ใช้
        next();           // ❺ ปล่อยผ่าน!
    } catch (error) {
        res.status(500).json({ message: "Error checking token" });
    }
};
```

**ลำดับที่ 5:** `controllers/` → สมองที่ทำงานจริง
(ดูโค้ดเต็มใน `FLOW_RANKING.md` Flow #2 และ #3)

**ลำดับที่ 6:** `routers/` → เชื่อมเส้นทาง
```javascript
// routers/user.Route.js
const router = require("express").Router();
const userController = require("../controllers/user.Controller");
const { protectedRoute } = require("../middlewares/auth.middleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.put("/update-profile", protectedRoute, userController.updateProfile);
router.get("/check", protectedRoute, userController.checkAuth);

module.exports = router;
```

**ลำดับที่ 7:** `index.js` → ประตูหลัก (ไฟล์สุดท้าย!)
```javascript
const { app, server } = require("./lib/socket"); // ❶ ใช้ app จาก socket.js!
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(cors({ origin: [process.env.BASE_URL], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use("/api/v1/user", require("./routers/user.Route"));
app.use("/api/v1/message", require("./routers/message.router"));

mongoose.connect(process.env.MONGO_URI);

server.listen(process.env.PORT); // ❷ ใช้ server.listen ไม่ใช่ app.listen!
```

---

## Phase 2: สร้าง Frontend (React + Vite)

### Step 1: สร้างโปรเจกต์ React ด้วย Vite
```bash
npm create vite@latest MERN-CHAT-REALTIME-FRONTEND -- --template react
# ↑ Vite จะสร้างไฟล์เริ่มต้นให้: index.html, main.jsx, App.jsx, vite.config.js

cd MERN-CHAT-REALTIME-FRONTEND
npm install
```
**💡 ทำไมใช้ Vite ไม่ใช้ Create React App (CRA)?**
- Vite เร็วกว่า CRA มาก (รันได้ภายใน 1 วินาที vs 10+ วินาที)
- CRA ถูกเลิกดูแลแล้ว (deprecated)

### Step 2: ลง Library ทั้งหมด
```bash
npm install axios zustand socket.io-client react-router-dom react-hot-toast lucide-react tailwindcss @tailwindcss/vite
```

### Step 3: ตั้งค่า `vite.config.js` (สำคัญมาก!)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],  // ❶ เปิดใช้ React + Tailwind
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // ❷ Proxy: ยิง /api → ไป Backend
        changeOrigin: true,
      },
    },
  },
})
```
**💡 Proxy คืออะไร?** ปกติ Frontend (port 5173) ยิงไป Backend (port 5000) จะโดน CORS บล็อก! Proxy ทำให้ Vite "แอบส่ง" Request ไปให้ Backend แทน → ไม่โดน CORS เลย!
**💡 นี่คือเหตุผลว่าทำไม `lib/axios.js` ใช้ `baseURL: "/api/v1"` แบบไม่มี `http://localhost:5000` นำหน้า** → เพราะ Vite Proxy จะเติมให้!

### Step 4: `index.html` — จุดเริ่มต้นของทุกอย่าง
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>mern-chat-frontend</title>
  </head>
  <body>
    <div id="root"></div>  <!-- ❶ React จะวาด UI ทั้งหมดลงใน div นี้! -->
    <script type="module" src="/src/main.jsx"></script>  <!-- ❷ โหลดโค้ด React -->
  </body>
</html>
```
**💡 ทำไมมีแค่ `<div id="root">`?** เพราะ React เป็น **SPA (Single Page Application)** → Browser โหลด HTML หน้าเดียว แล้ว JavaScript จะเป็นคนวาด UI ทุกอย่างลงใน div นี้

### Step 5: `src/main.jsx` — จุดเชื่อมต่อ React กับ Browser
```javascript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";     // ❶ โหลด Tailwind CSS
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(  // ❷ จับ <div id="root"> แล้ววาด React ลงไป!
  <StrictMode>          {/* ❸ โหมดตรวจจับ Bug (เฉพาะ dev) */}
    <BrowserRouter>     {/* ❹ เปิดใช้ระบบ Route (เปลี่ยนหน้าโดยไม่ Refresh) */}
      <App />           {/* ❺ Component หลักของแอป */}
    </BrowserRouter>
  </StrictMode>
);
```
**💡 ทำไมต้องครอบด้วย `<BrowserRouter>`?** เพราะถ้าไม่ครอบ → `<Routes>`, `<Route>`, `<Navigate>`, `<Link>` ที่ใช้ใน App.jsx จะพังทันที!

### Step 6: `src/App.jsx` — ศูนย์กลางของแอป (Route Protection + Lazy Loading)
```javascript
import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";

// ❶ Lazy Loading: โหลดหน้าเหล่านี้ "เมื่อจำเป็น" เท่านั้น (ประหยัด bandwidth!)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => { initTheme(); }, [initTheme]);      // ❷ โหลด Theme ตอนเปิดเว็บ
  useEffect(() => { checkAuth(); }, [checkAuth]);       // ❸ เช็ค JWT Cookie → Auto-Login!

  // ❹ แสดง Loading ระหว่างเช็ค Auth
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <Loader className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-base-100 text-base-content">
      <Navbar />

      {/* ❺ Suspense: โชว์ Loading ระหว่าง Lazy Component กำลังโหลด */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* ❻ Route Protection: ถ้าล็อกอินแล้ว → ไป Home, ถ้ายัง → ไป Login */}
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
      </Suspense>

      {/* ❼ Toast: Popup แจ้งเตือน (Success/Error) */}
      <Toaster position="top-center" />
    </div>
  );
};

export default App;
```

**💡 Route Protection คืออะไร?**
- `authUser ? <HomePage /> : <Navigate to="/login" />` 
  → ถ้าล็อกอินแล้ว (**authUser มีค่า**) → โชว์ HomePage
  → ถ้ายังไม่ล็อกอิน (**authUser เป็น null**) → เด้งไปหน้า Login!
- `!authUser ? <LoginPage /> : <Navigate to="/" />`
  → ถ้ายังไม่ล็อกอิน → โชว์ LoginPage
  → ถ้าล็อกอินแล้ว → เด้งกลับไป Home (ป้องกันเข้าหน้า Login ซ้ำ!)

### Step 7: สร้าง `lib/` (เครื่องมือพื้นฐาน)
```javascript
// lib/axios.js — บุรุษไปรษณีย์
import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "/api/v1",        // Vite Proxy จะส่งไปที่ http://localhost:5000/api/v1
    withCredentials: true,      // แนบ Cookie (JWT) ทุกครั้ง!
});

// lib/socket.js — สายเคเบิล Real-time
import { io } from "socket.io-client";
const BASE_URL = "http://localhost:5000";
export const socket = io(BASE_URL, {
    autoConnect: false,         // ห้ามต่ออัตโนมัติ! รอ Login ก่อน
});

// lib/utils.js — แปลงเวลา
export const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
};
```

### Step 8: สร้าง `store/` (คลังเก็บข้อมูล — Zustand)
(ดูโค้ดเต็มใน `FLOW_RANKING.md` — Flow useChatStore.js + useAuthStore.js)

### Step 9: สร้าง `pages/` + `components/`
(ดูโค้ดเต็มใน `FLOW_RANKING.md` — Flow #2 Step 8-10)

### 📊 สรุปลำดับการสร้าง Frontend:

```
1. npm create vite (สร้างโปรเจกต์)
2. npm install (ลง Library)
3. vite.config.js (ตั้ง Proxy + Tailwind)
4. index.html (จุดเริ่มต้น HTML)
5. main.jsx (จุดเชื่อมต่อ React + BrowserRouter)
6. index.css (Tailwind CSS)
7. lib/axios.js → lib/socket.js → lib/utils.js (เครื่องมือพื้นฐาน)
8. store/useAuthStore.js → store/useChatStore.js (คลังข้อมูล)
9. pages/LoginPage.jsx → SignUpPage.jsx → HomePage.jsx (หน้าจอ)
10. components/Sidebar.jsx → ChatContainer.jsx → MessageInput.jsx (ชิ้นส่วน UI)
11. App.jsx (ประกอบร่าง + Route Protection)
```

---

# 🔤 ส่วนที่ 3: ไวยากรณ์ (Syntax) สำคัญที่ใช้ในโปรเจกต์

## 📌 3.1 Arrow Function `() => {}`
```javascript
// แบบเก่า
function sayHello() { return "Hello"; }
// แบบ Arrow (ที่คุณใช้)
const sayHello = () => "Hello";
```
**ใช้ทำอะไร:** ประกาศฟังก์ชัน Component, Callback, Event handler ทุกตัวในโปรเจกต์

---

## 📌 3.2 Async/Await
```javascript
const login = async (data) => {         // async = ฟังก์ชันนี้มีงานรอเน็ต
    const res = await api.post("/login"); // await = หยุดรอ! จนกว่าจะได้คำตอบ
};
```
**ใช้ทำอะไร:** ทุกครั้งที่ยิง API (login, register, getMessages, sendMessage)

---

## 📌 3.3 Object Destructuring `{}`
```javascript
// แทนที่จะเขียน
const messages = useChatStore().messages;
const users = useChatStore().users;

// เขียนแค่ (แกะกล่อง)
const { messages, users } = useChatStore();
```
**ใช้ทำอะไร:** ดึงข้อมูลจาก Store, Props, Response ทุกที่ในโปรเจกต์

---

## 📌 3.4 Array Destructuring `[]`
```javascript
const [text, setText] = useState("");
//      ↑ ตัวเก็บค่า   ↑ ตัวเซ็ตค่า
```
**ใช้ทำอะไร:** ทุกครั้งที่ใช้ `useState` ใน Component

---

## 📌 3.5 Spread Operator `...`
```javascript
// เอาแชทเก่า + ต่อท้ายแชทใหม่ = Array ใหม่!
set({ messages: [...messages, newMessage] });

// เอาข้อมูล User เดิม + เพิ่มฟิลด์ใหม่
const mappedUser = { ...user, name: user.fullname };
```
**ใช้ทำอะไร:** อัปเดต State แบบ Immutable (React ถึงจะรู้ว่าต้องวาดจอใหม่)

---

## 📌 3.6 Optional Chaining `?.`
```javascript
const isSent = message.sender === authUser?._id;
// ถ้า authUser เป็น null → ได้ undefined (ไม่พัง!)
// ถ้าไม่ใส่ ?. → Error: Cannot read properties of null
```
**ใช้ทำอะไร:** ป้องกันแอปพังตอนข้อมูลยังโหลดไม่เสร็จ

---

## 📌 3.7 Template Literals `` ` ` ``
```javascript
const response = await api.get(`/message/${userId}`);
// ถ้า userId = "abc123" → URL กลายเป็น "/message/abc123"
```
**ใช้ทำอะไร:** ฝังตัวแปรลงในข้อความ/URL โดยไม่ต้อง +

---

## 📌 3.8 Ternary Operator `? :`
```javascript
className={`flex ${isSent ? "justify-end" : "justify-start"}`}
// ถ้า isSent = true → "justify-end" (ชิดขวา = แชทเรา)
// ถ้า isSent = false → "justify-start" (ชิดซ้าย = แชทเพื่อน)
```
**ใช้ทำอะไร:** สลับ CSS, สลับ Component, สลับข้อความ แบบ inline

---

## 📌 3.9 `.map()` (Array Method)
```javascript
const users = response.data.filteredUsers.map(user => ({
    ...user,
    name: user.fullname,
}));
// วนลูป Array → แปลงข้อมูลทุกตัว → ได้ Array ใหม่!
```
**ใช้ทำอะไร:** วนลูปสร้าง JSX (รายชื่อเพื่อน, ข้อความแชท)

---

## 📌 3.10 `useEffect` (React Hook)
```javascript
useEffect(() => {
    getMessages(selectedUser._id);    // ❶ ทำตอนเปิดจอ (Mount)
    subscribeToMessages();
    return () => unsubscribeFromMessages(); // ❷ ทำตอนปิดจอ (Cleanup)
}, [selectedUser._id]);                    // ❸ ทำซ้ำเมื่อค่านี้เปลี่ยน
```
**ใช้ทำอะไร:** ดึงข้อมูล API, เปิด/ปิด Socket, Auto-scroll

---

## 📌 3.11 `useRef` (React Hook)
```javascript
const messageEndRef = useRef(null);
// ❶ ชี้ไปที่ <div ref={messageEndRef} /> ใน JSX
messageEndRef.current.scrollIntoView({ behavior: "smooth" });
// ❷ สั่งเลื่อนจอลงไปที่ div นั้น!
```
**ใช้ทำอะไร:** Auto-scroll แชท, เปิด File Input

---

## 📌 3.12 `useState` (React Hook)
```javascript
const [text, setText] = useState("");
// text = ค่าปัจจุบัน (เริ่มต้นเป็น "")
// setText = ฟังก์ชันเปลี่ยนค่า → เปลี่ยนแล้วจอวาดใหม่!
```
**ใช้ทำอะไร:** เก็บข้อมูลชั่วคราวใน Component (text, password, imagePreview)

---

## 📌 3.13 `e.preventDefault()`
```javascript
const handleSubmit = (e) => {
    e.preventDefault(); // ❶ ห้าม Browser refresh หน้าเว็บ!
    login(formData);    // ❷ ส่งข้อมูลผ่าน Axios แทน
};
```
**ใช้ทำอะไร:** ทุกครั้งที่กด Submit ฟอร์ม (Login, Register, Send Message)

---

## 📌 3.14 `try...catch...finally`
```javascript
try {
    const res = await api.post("/login", data); // ❶ ลองทำ
    set({ authUser: res.data });                // ❷ สำเร็จ → เก็บข้อมูล
} catch (error) {
    toast.error(error.message);                 // ❸ ล้มเหลว → แจ้ง Error
} finally {
    set({ isLoggingIn: false });                // ❹ ไม่ว่าจะสำเร็จหรือไม่ → ปิด Loading
}
```
**ใช้ทำอะไร:** ทุกครั้งที่ยิง API (ต้องเผื่อกรณีเน็ตพัง/Server ล่ม)

---

## 📌 3.15 `FileReader` + `readAsDataURL()`
```javascript
const reader = new FileReader();
reader.onloadend = () => {
    setImagePreview(reader.result); // ❶ ได้ Base64 string มา
};
reader.readAsDataURL(file); // ❷ อ่านไฟล์รูปจากคอม → แปลงเป็น Base64
```
**ใช้ทำอะไร:** Preview รูปก่อนส่ง + ส่งรูปเป็น Base64 ไป Backend → Cloudinary

---

# 📊 ส่วนที่ 4: สรุป Flow สำคัญทั้งหมด

## 🔐 Flow 1: Login
```
User กรอก email/password → กด Submit
  → e.preventDefault() (ห้าม Refresh)
    → useAuthStore.login(formData)
      → axios.post("/user/login") + withCredentials
        → Backend: findOne → bcrypt.compareSync → jwt.sign → res.cookie("jwt")
          → Frontend: api.get("/user/check") → set({ authUser })
            → connectSocket() → io(URL, { query: { userId } })
              → Backend: userSocketMap[userId] = socket.id
                → io.emit("getOnlineUsers") → ทุกคนเห็นจุดเขียว
```

## 📝 Flow 2: Register
```
User กรอก fullname/email/password → กด Submit
  → useAuthStore.signup(formData)
    → axios.post("/user/register")
      → Backend: bcrypt.hashSync → UserModel.create → jwt.sign → res.cookie
        → Frontend: set({ authUser }) → connectSocket() → Auto-Login!
```

## 💬 Flow 3: ส่งข้อความ Real-time
```
User A พิมพ์ "สวัสดี" กด Send
  → MessageInput: sendMessage({ text, file })
    → useChatStore: api.post("/message/send/" + friendId)
      → Backend: Message.save() → getReceiverSocketId(friendId)
        → io.to(socketId).emit("newMessage", msg) → ส่งถึง User B เท่านั้น!
          → Frontend A: set({ messages: [...เก่า, msg] }) → เห็นแชทตัวเอง ✅
          → Frontend B: socket.on("newMessage") → เช็ค sender === selectedUser
            → set({ messages: [...เก่า, msg] }) → แชทเด้ง! ✅
```

## 🟢 Flow 4: ติดตามออนไลน์
```
User เปิดเว็บ → Login → connectSocket()
  → Backend: userSocketMap[userId] = socket.id
    → io.emit("getOnlineUsers", [userId1, userId2, ...])
      → Frontend ทุกคน: socket.on("getOnlineUsers") → set({ onlineUsers })
        → Sidebar: onlineUsers.includes(user._id) → จุดเขียว!

User ปิดเว็บ → socket.on("disconnect")
  → Backend: delete userSocketMap[userId]
    → io.emit("getOnlineUsers", [...]) → จุดเขียวหายไป!
```

## 🔄 Flow 5: เปิดเว็บซ้ำ (Auto-Login)
```
User เปิดเว็บ → App.jsx: useEffect → checkAuth()
  → axios.get("/user/check") + Cookie JWT
    → Backend: auth.middleware → jwt.verify → req.user
      → Frontend: set({ authUser }) → connectSocket()
        → ไม่ต้อง Login ใหม่!
```

---

# 📁 ส่วนที่ 5: สรุปไฟล์ทั้งหมด

## Backend (10 ไฟล์)

| ไฟล์ | หน้าที่ |
|------|---------|
| `.env` | ค่าลับ (PORT, MONGO_URI, SECRET, Cloudinary) |
| `index.js` | ประตูหลัก: CORS, Middleware, Routes, MongoDB |
| `lib/socket.js` | Socket.IO Server + userSocketMap + getReceiverSocketId |
| `configs/cloudinary.js` | Config Cloudinary |
| `models/User.js` | Schema: fullname, email, password, profilePicture |
| `models/Message.js` | Schema: text, file, sender, recipient |
| `middlewares/auth.middleware.js` | ยามตรวจ JWT → req.user |
| `controllers/user.Controller.js` | register, login, logout, checkAuth, updateProfile |
| `controllers/message.controller.js` | getUsersForSiderbar, getMessage, sendMessage + Socket |
| `routers/` (2 ไฟล์) | เส้นทาง API ทั้งหมด |

## Frontend (11+ ไฟล์)

| ไฟล์ | หน้าที่ |
|------|---------|
| `lib/axios.js` | Axios Instance + withCredentials |
| `lib/socket.js` | Socket.IO Client (autoConnect: false) |
| `lib/utils.js` | formatMessageTime() |
| `store/useAuthStore.js` | Login, Register, Logout, connectSocket, disconnectSocket |
| `store/useChatStore.js` | getUsers, getMessages, sendMessage, subscribe/unsubscribe |
| `App.jsx` | Route Protection + checkAuth |
| `pages/LoginPage.jsx` | ฟอร์ม Login |
| `pages/SignUpPage.jsx` | ฟอร์ม Register |
| `components/Sidebar.jsx` | รายชื่อเพื่อน + จุดเขียว Online |
| `components/ChatContainer.jsx` | แสดงแชท + Subscribe Socket + Auto-scroll |
| `components/MessageInput.jsx` | ช่องพิมพ์ + แนบรูป + กดส่ง |
