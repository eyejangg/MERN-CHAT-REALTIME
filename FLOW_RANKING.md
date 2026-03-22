# 📊 MERN-CHAT-REALTIME — เรียงลำดับ Flow แยก Frontend / Backend พร้อมโค้ดจริง

> **Tech Stack:** MongoDB + Express + React + Node.js + Socket.IO + Zustand + Cloudinary
> **Auth:** Email/Password (bcrypt) + JWT HttpOnly Cookie
> **ไม่มี:** Google OAuth, SQL, PostgreSQL

---

# Flow #1 — ตั้งโครงสร้าง Backend (MVC + MongoDB + Socket.IO)
**⚡ เริ่มที่: Backend 100%**

> **ทำไมต้อง Backend ก่อน?** ถ้าไม่มี API + Database → Frontend จะไม่มีอะไรให้เรียก

### 🔧 Step 1: สร้าง `.env`
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

---

### 🔧 Step 2: สร้าง `models/User.js` (Mongoose Schema)
```javascript
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
    fullname: { type: String, required: true, min: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, require: true, min: 6 },
    profilePicture: { type: String, default: "" },
}, {
    timestamps: true  // ❶ สร้าง createdAt + updatedAt ให้อัตโนมัติ
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
```

### 🔧 Step 3: สร้าง `models/Message.js`
```javascript
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MessageSchema = new Schema({
    text: { type: String },
    file: { type: String },                               // ← รูปภาพจาก Cloudinary
    sender: { type: Schema.Types.ObjectId, ref: "User" },     // ← คนส่ง
    recipient: { type: Schema.Types.ObjectId, ref: "User" },  // ← คนรับ
}, {
    timestamps: true,
});

const MessageModel = model("Message", MessageSchema);
module.exports = MessageModel;
```

---

### 🔧 Step 4: สร้าง `lib/socket.js` (Socket.IO Server — แยกเป็นไฟล์ต่างหาก)
```javascript
require("dotenv").config();
const app = require('express')();
const server = require('http').createServer(app);
const userSocketMap = {}; // ❶ เก็บว่า userId ไหน → มี socketId อะไร เช่น { "abc123": "socketId_xyz" }

const io = require('socket.io')(server, {
    cors: {
        origin: [process.env.BASE_URL],  // อนุญาตให้ Frontend เชื่อมต่อ
    }
});

// ❷ ค้นหา socketId จาก userId (ใช้ตอนส่งข้อความ)
function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// ❸ เมื่อมีคนเชื่อมต่อ Socket เข้ามา
io.on("connection", (socket) => {
    console.log("A user Connected", socket.id);
    const userId = socket.handshake.query.userId;  // ← Frontend ส่ง userId มาตอนจับมือ

    if (userId) {
        userSocketMap[userId] = socket.id;  // ❹ จดลงสมุด: userId นี้ใช้ socketId นี้
    }

    // ❺ ตะโกนบอกทุกคนว่า "ตอนนี้ใครออนไลน์บ้าง!"
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // ❻ เมื่อ User ปิดเว็บ / Disconnect
    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];  // ลบออกจากสมุด
        io.emit("getOnlineUsers", Object.keys(userSocketMap));  // บอกทุกคนอีกรอบ
    });
});

module.exports = { io, app, server, getReceiverSocketId };
```
**💡 ทำไมแยก `lib/socket.js` ออกมา?** เพราะ `message.controller.js` ต้อง import `{ io, getReceiverSocketId }` ไปใช้ตอนส่งแชท ถ้ายัดอยู่ใน `index.js` จะ import ข้ามไฟล์ยาก

---

### 🔧 Step 5: สร้าง `index.js` (Entry Point)
```javascript
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { app, server } = require("./lib/socket");  // ❶ import app จาก socket.js (ไม่ใช้ express() ใหม่)
dotenv.config();

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const MONGO_URI = process.env.MONGO_URI;

// ❷ CORS
app.use(cors({
    origin: [BASE_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: true,  // ⭐ ส่ง Cookie ข้ามโดเมนได้
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ❸ ต่อ Router
const userRouter = require("./routers/user.Route");
app.use("/api/v1/user", userRouter);

const messageRouter = require("./routers/message.router");
app.use("/api/v1/message", messageRouter);

// ❹ MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((error) => console.error("MongoDB connection error:", error.message));

// ❺ เปลี่ยนจาก app.listen → server.listen (เพราะ Socket.IO ใช้ server)
server.listen(PORT, () => {
    console.log("Server is running on " + BASE_URL);
});
```
**💡 จุดสำคัญ:** `app` มาจาก `lib/socket.js` ไม่ได้สร้างใหม่! เพราะ Socket.IO ต้องแชร์ HTTP Server ตัวเดียวกัน

---

### 🔧 Step 6: สร้าง `configs/cloudinary.js`
```javascript
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = cloudinary;
```

**📌 ลำดับ Backend ที่ต้องสร้างก่อน-หลัง:**
```
.env → models/ (User, Message) → lib/socket.js → configs/cloudinary.js
  → middlewares/ → controllers/ → routers/ → index.js
```

---

# Flow #2 — Register + Login (Email/Password + bcrypt + JWT)
**⚡ เริ่มที่: Backend ก่อน → แล้วค่อย Frontend**

### 🔧 Backend Step 1: สร้าง `controllers/user.Controller.js` — Register
```javascript
const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;
const cloudinary = require("../configs/cloudinary");

exports.register = async (req, res) => {
    const { fullname, email, password } = req.body;  // ❶ รับข้อมูลจาก Frontend

    // ❷ Validate
    if (!fullname || !email || !password) {
        return res.status(400).send({ message: "Please provide Fullname, Email, and Password" });
    }

    // ❸ เช็คว่า Email ซ้ำไหม
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        return res.status(400).send({ message: "This Email is already existed" });
    }

    try {
        // ❹ สับรหัสผ่าน (bcrypt)
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // ❺ สร้าง User ใหม่ลง MongoDB
        const user = await UserModel.create({
            fullname,
            email,
            password: hashedPassword,  // ← เก็บรหัสที่สับแล้ว ไม่เก็บตัวจริง!
        });

        // ❻ Auto-Login! → สร้าง JWT + Cookie ทันที (ไม่ต้องไปหน้า Login อีกรอบ)
        if (user) {
            const token = jwt.sign({ userId: user._id }, secret, { expiresIn: "1d" });
            res.cookie("jwt", token, {
                httpOnly: true,    // JS ฝั่ง Browser อ่านไม่ได้ = ป้องกัน XSS
                secure: process.env.node_mode !== "development",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,  // 1 วัน
            });
        }

        res.status(201).send({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
```

### 🔧 Backend Step 2: Login
```javascript
exports.login = async (req, res) => {
    const { email, password } = req.body;  // ❶ รับ email + password
    if (!email || !password) {
        return res.status(400).send({ message: "Please Provide Email and Password" });
    }

    try {
        // ❷ หา User จาก MongoDB
        const userDoc = await UserModel.findOne({ email });
        if (!userDoc) {
            return res.status(404).send({ message: "email not found" });
        }

        // ❸ เทียบรหัสผ่าน (bcrypt)
        const isPasswordMatched = bcrypt.compareSync(password, userDoc.password);
        if (!isPasswordMatched) {
            return res.status(401).send({ message: "Invalid Password" });
        }

        // ❹ สร้าง JWT + เซ็ต Cookie
        jwt.sign({ email, userId: userDoc._id }, secret, {}, (err, token) => {
            if (err) {
                return res.status(500).send({ message: "Authentication Failed" });
            }

            res.cookie("jwt", token, {
                httpOnly: true,
                secure: process.env.node_mode !== "development",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,
            });

            res.send({
                message: "Email User Login Successfully",
                userId: userDoc._id,
                email: userDoc.email,
                accessToken: token,
            });
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
```

### 🔧 Backend Step 3: Logout + checkAuth + updateProfile
```javascript
// Logout — ลบ Cookie
exports.logout = async (req, res) => {
    res.cookie("jwt", "", { maxAge: 0 });
    res.send({ message: "Logout successfully" });
};

// Check Auth — ดึง User ปัจจุบัน (Frontend เรียกตอนเปิดเว็บ)
exports.checkAuth = (req, res) => {
    res.status(200).json(req.user);  // ← req.user มาจาก Middleware
};

// Update Profile — อัปเดตชื่อ/รูป (Cloudinary)
exports.updateProfile = async (req, res) => {
    const { fullname, profilePicture } = req.body;
    const UserId = req.user._id;

    if (profilePicture) {
        const uploadResponse = await cloudinary.uploader.upload(profilePicture);
        // ... findByIdAndUpdate ด้วย uploadResponse.secure_url
    }
    // ...
};
```

### 🔧 Backend Step 4: Middleware ตรวจ JWT
```javascript
// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;  // ❶ ดึง JWT จาก Cookie
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token provided" });
        }

        const decoded = jwt.verify(token, process.env.SECRET);  // ❷ ถอดรหัส
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        // ❸ หา User จาก DB (ไม่เอา password กลับมา)
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        req.user = user;  // ❹ แปะ User ไว้ให้ Controller ใช้
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error while Checking Token" });
    }
};
```

### 🔧 Backend Step 5: Routes
```javascript
// routers/user.Route.js
router.post("/register", userController.register);                   // ไม่ต้อง Auth
router.post("/login", userController.login);                         // ไม่ต้อง Auth
router.post("/logout", userController.logout);                       // ไม่ต้อง Auth
router.put("/update-profile", protectedRoute, userController.updateProfile); // ต้อง Auth ✅
router.get("/check", protectedRoute, userController.checkAuth);              // ต้อง Auth ✅
```

---

### 🎨 Frontend Step 6: สร้าง `lib/axios.js`
```javascript
import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,  // ⭐ ส่ง Cookie ทุกครั้ง
});
```

### 🎨 Frontend Step 7: สร้าง `store/useAuthStore.js` (Zustand)
```javascript
import { create } from "zustand";
import { axiosInstance as api } from "../lib/axios";
import { io } from "socket.io-client";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    socket: null,       // ← เก็บ Socket instance ไว้ใน Store!
    onlineUsers: [],

    // ❶ Login → ยิง API → เช็ค Auth → ต่อ Socket
    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            await api.post("/user/login", data);           // ยิง Login
            const userRes = await api.get("/user/check");  // ดึง User ข้อมูล
            set({ authUser: userRes.data });
            get().connectSocket();                          // ⭐ ต่อ Socket ทันที!
            toast.success("Logged in successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    // ❷ Register → สร้างบัญชี → Auto-Login → ต่อ Socket
    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await api.post("/user/register", data);
            set({ authUser: res.data.user });
            get().connectSocket();  // ⭐ ต่อ Socket ทันที!
            toast.success("Account created successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    // ❸ Check Auth → เปิดเว็บ → ส่ง Cookie ไปถาม Backend
    checkAuth: async () => {
        try {
            const res = await api.get("/user/check");
            set({ authUser: res.data });
            get().connectSocket();  // ⭐ ถ้ายังล็อกอินอยู่ → ต่อ Socket
        } catch {
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    // ❹ Logout → ลบ Cookie → ตัด Socket
    logout: async () => {
        await api.post("/user/logout");
        set({ authUser: null });
        get().disconnectSocket();  // ⭐ ตัดสาย Socket
    },

    // ❺ เชื่อมต่อ Socket (เรียกทุกครั้งที่ Login/Register สำเร็จ)
    connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser || socket?.connected) return;  // ป้องกันต่อซ้ำ

        const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
            query: { userId: authUser._id },  // ❻ ส่ง userId ไปให้ Backend จับมือ
        });

        newSocket.connect();
        set({ socket: newSocket });

        // ❼ รับรายชื่อคนออนไลน์จาก Backend
        newSocket.on("getOnlineUsers", (userId) => {
            set({ onlineUsers: userId });
        });
    },

    // ❽ ตัดสาย Socket
    disconnectSocket: () => {
        const { socket } = get();
        if (socket?.connected) socket.disconnect();
        set({ socket: null, onlineUsers: [] });
    },
}));
```

---

### 🎨 Frontend Step 8: สร้าง `pages/LoginPage.jsx`
```jsx
const LoginPage = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { login, isLoggingIn } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();     // ❶ ป้องกัน Refresh
        login(formData);        // ❷ ส่ง { email, password } ไป Store → Store ยิงไป Backend
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="password" placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <button type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "Sign in"}
            </button>
        </form>
    );
};
```

### 🎨 Frontend Step 9: สร้าง `pages/SignUpPage.jsx`
```jsx
const SignUpPage = () => {
    const [formData, setFormData] = useState({ fullname: "", email: "", password: "" });
    const { signup, isSigningUp } = useAuthStore();

    const handleSubmit = (e) => {
        e.preventDefault();
        signup(formData);  // ❶ ส่ง { fullname, email, password } ไป Backend
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="John Doe" /* fullname */ />
            <input type="email" placeholder="you@example.com" /* email */ />
            <input type="password" placeholder="••••••••" /* password */ />
            <button type="submit">{isSigningUp ? <Loader2 /> : "Create Account"}</button>
        </form>
    );
};
```

### 🎨 Frontend Step 10: สร้าง `App.jsx` (ประกอบร่าง + Route Protection)
```jsx
const App = () => {
    const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

    useEffect(() => { checkAuth(); }, [checkAuth]); // ❶ เปิดเว็บ → เช็ค Cookie

    if (isCheckingAuth && !authUser) return <Loader />;

    return (
        <div>
            <Navbar />
            <Routes>
                {/* ❷ มี authUser → HomePage / ไม่มี → เด้งไป Login */}
                <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
                <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </div>
    );
};
```

**📌 Login Data Flow ทั้งหมด:**
```
User กรอก email/password → กด "Sign in"
  → LoginPage: login(formData) → useAuthStore
    → api.post("/user/login", { email, password })
      → Backend: findOne({ email }) → bcrypt.compareSync()
        → jwt.sign() → res.cookie("jwt", token, { httpOnly: true })
          → Frontend: api.get("/user/check") → ได้ User data
            → set({ authUser }) → connectSocket()
              → Socket.IO เชื่อมต่อ → Backend จด userId:socketId
                → io.emit("getOnlineUsers") → ทุกคนเห็นจุดเขียว
```

---

# Flow #3 — Message Controller + Routes (แชท)
**⚡ เริ่มที่: Backend ก่อน → แล้วค่อยต่อ Frontend**

### 🔧 Backend Step 1: สร้าง `controllers/message.controller.js`
```javascript
const User = require("../models/User");
const cloudinary = require("../configs/cloudinary");
const { getReceiverSocketId, io } = require("../lib/socket");  // ❶ import จาก socket.js
const Message = require("../models/Message");

// ดึงรายชื่อ User ทั้งหมด (ยกเว้นตัวเอง) → แสดงใน Sidebar
const getUsersForSiderbar = async (req, res) => {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    // $ne = Not Equal → ไม่เอาตัวเอง
    res.status(200).json({ filteredUsers });
};

// ดึงแชทระหว่าง 2 คน
const getMessage = async (req, res) => {
    const myId = req.user._id;
    const { id: userToChat } = req.params;
    const messages = await Message.find({
        $or: [
            { sender: myId, recipient: userToChat },  // ❷ ข้อความที่เราส่งไปหาเขา
            { sender: userToChat, recipient: myId },   // ❸ ข้อความที่เขาส่งมาหาเรา
        ]
    });
    res.status(200).json(messages);
};

// ส่งข้อความ + Socket.IO Real-time
const sendMessage = async (req, res) => {
    const { id: recipient } = req.params;
    const senderId = req.user._id;
    const { text, file } = req.body;

    // ❹ อัปโหลดรูปไป Cloudinary (ถ้ามี)
    let fileUrl = "";
    if (file) {
        const uploadResponse = await cloudinary.uploader.upload(file);
        fileUrl = uploadResponse.secure_url;
    }

    // ❺ บันทึกข้อความลง MongoDB
    const newMessage = await new Message({
        sender: senderId,
        recipient: recipient,
        text,
        file: fileUrl,
    });
    await newMessage.save();

    // ❻ Real-time! → หาว่าคนรับออนไลน์ไหม
    const receiverSocketId = getReceiverSocketId(recipient);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        // ↑ ส่งไปหาคนรับคนเดียว (ไม่ใช่ทุกคน!)
    }

    // ❼ ส่ง Response กลับให้คนส่ง
    res.status(201).json(newMessage);
};

module.exports = { getUsersForSiderbar, getMessage, sendMessage };
```

### 🔧 Backend Step 2: สร้าง `routers/message.router.js`
```javascript
router.get("/users", protectedRoute, getUsersForSiderbar);   // ดึงรายชื่อ User (Sidebar)
router.get("/:id", protectedRoute, getMessage);               // ดึงแชทเก่า
router.post("/send/:id", protectedRoute, sendMessage);        // ส่งข้อความ
```

---

### 🎨 Frontend Step 3: สร้าง `store/useChatStore.js`
```javascript
import { create } from "zustand";
import { axiosInstance as api } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,

    // ❶ ดึงรายชื่อ User (แสดงใน Sidebar)
    getUsers: async () => {
        set({ isUsersLoading: true });
        const response = await api.get("/message/users");
        set({ users: response.data.filteredUsers });
        set({ isUsersLoading: false });
    },

    // ❷ ดึงแชทเก่าระหว่าง 2 คน
    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        const response = await api.get(`/message/${userId}`);
        set({ messages: response.data });
        set({ isMessagesLoading: false });
    },

    // ❸ ส่งข้อความ (HTTP POST → Backend บันทึก + ส่ง Socket)
    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        const response = await api.post("/message/send/" + selectedUser._id, messageData);
        set({ messages: [...messages, response.data] });  // ต่อท้ายทันที
    },

    // ❹ เปิดท่อ Socket รอรับข้อความใหม่
    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;  // ❺ ดึง socket จาก AuthStore
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // ❻ Closure! เช็คว่าข้อความมาจากคนที่เปิดแชทด้วยอยู่ไหม
            const isMessageSentFromSelectedUser = newMessage.sender === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;  // ไม่ใช่ → ไม่โชว์
            set({ messages: [...get().messages, newMessage] });  // ใช่ → เด้งทันที!
        });
    },

    // ❼ ถอดหูฟัง Socket (ป้องกัน listener ซ้อน)
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
```

### 🎨 Frontend Step 4: สร้าง `components/ChatContainer.jsx`
```jsx
const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser,
        subscribeToMessages, unsubscribeFromMessages } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    // ❶ เปิดแชท → ดึงแชทเก่า + เปิดท่อ Socket
    useEffect(() => {
        if (selectedUser?._id) {
            getMessages(selectedUser._id);
            subscribeToMessages();
        }
        return () => unsubscribeFromMessages();  // ❷ Cleanup ตอนเปลี่ยนคนคุย
    }, [selectedUser?._id]);

    // ❸ Auto-scroll ลงล่างสุดเมื่อมีแชทใหม่
    useEffect(() => {
        if (messageEndRef.current && messages.length > 0) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col">
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => {
                    const isSent = message.sender === authUser?._id;
                    return (
                        <div key={message._id}
                            className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                            {/* รูปคนส่ง/คนรับ + Bubble ข้อความ + เวลา */}
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
    );
};
```

### 🎨 Frontend Step 5: สร้าง `components/MessageInput.jsx`
```jsx
const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const { sendMessage } = useChatStore();

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;  // ❶ ไม่มีข้อความ + ไม่มีรูป → ไม่ส่ง

        await sendMessage({
            text: text.trim(),
            image: imagePreview,  // ❷ ส่งเป็น Base64 → Backend อัปไป Cloudinary
        });

        setText("");
        setImagePreview(null);
    };

    // ❸ เลือกรูป → แปลงเป็น Base64 → Preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };
};
```

### 🎨 Frontend Step 6: สร้าง `components/Sidebar.jsx` (แสดงรายชื่อ + จุดเขียว)
```jsx
const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();  // ❶ รายชื่อคนออนไลน์จาก Socket

    useEffect(() => { getUsers(); }, [getUsers]);  // ❷ ดึงรายชื่อตอนเปิดหน้า

    return (
        <aside>
            {users.map((user) => (
                <button key={user._id} onClick={() => setSelectedUser(user)}>
                    <img src={user.profilePicture || "/avatar.webp"} />
                    {/* ❸ จุดเขียว → เช็คจาก onlineUsers */}
                    {onlineUsers.includes(user._id) && (
                        <span className="bg-green-500 rounded-full" />
                    )}
                    <span>{user.fullname}</span>
                    <span>{onlineUsers.includes(user._id) ? "Online" : "Offline"}</span>
                </button>
            ))}
        </aside>
    );
};
```

---

# 📌 สรุป Data Flow: ส่งข้อความ Real-time ทั้งหมด

```
User A พิมพ์ "สวัสดี" กด Send
│
├─ 🎨 Frontend A: api.post("/message/send/B_id", { text: "สวัสดี" })
│   └─ 🔧 Backend: Message.save({ sender: A, recipient: B, text: "สวัสดี" })
│       ├─ บันทึกลง MongoDB ✅
│       ├─ receiverSocketId = getReceiverSocketId("B_id") → "socketId_456"
│       ├─ io.to("socketId_456").emit("newMessage", msg) → 🎯 ส่งถึง User B เท่านั้น!
│       └─ res.json(msg) → กลับให้ Frontend A
│
├─ 🎨 Frontend A: set({ messages: [...เก่า, msg] }) → หน้าจอ A เห็นแชทตัวเอง ✅
│
└─ 🎨 Frontend B: socket.on("newMessage") ได้ยิน!
    ├─ Closure: newMessage.sender === selectedUser._id? → ✅ ใช่
    └─ set({ messages: [...เก่า, msg] }) → "สวัสดี" เด้งขึ้นจอ B ทันที! 🎉
```

---

# 📋 สรุปไฟล์ทั้งหมด: ใคร (Frontend/Backend) ทำอะไร

## 🔧 Backend Files

| ไฟล์ | หน้าที่ |
|------|---------|
| `lib/socket.js` | สร้าง Socket.IO Server + เก็บ Map `userId:socketId` + `getReceiverSocketId()` |
| `index.js` | Entry Point — CORS, MongoDB, import `{ app, server }` จาก socket.js |
| `models/User.js` | Schema: fullname, email, password, profilePicture |
| `models/Message.js` | Schema: text, file, sender, recipient |
| `controllers/user.Controller.js` | register (bcrypt), login (JWT), logout, checkAuth, updateProfile |
| `controllers/message.controller.js` | getUsersForSiderbar, getMessage, sendMessage + `io.to().emit()` |
| `middlewares/auth.middleware.js` | ตรวจ JWT → `req.user = user` → `next()` |
| `routers/user.Route.js` | `/register`, `/login`, `/logout`, `/update-profile`, `/check` |
| `routers/message.router.js` | `/users`, `/:id`, `/send/:id` |
| `configs/cloudinary.js` | Config Cloudinary สำหรับอัปโหลดรูป |

## 🎨 Frontend Files

| ไฟล์ | หน้าที่ |
|------|---------|
| `lib/axios.js` | axios instance + `withCredentials: true` |
| `lib/socket.js` | Socket.IO client (ไม่ได้ใช้ตรง — ใช้ผ่าน `useAuthStore` แทน) |
| `store/useAuthStore.js` | Login, Register, Logout, checkAuth, **connectSocket**, **disconnectSocket**, onlineUsers |
| `store/useChatStore.js` | getUsers, getMessages, sendMessage, **subscribeToMessages**, **unsubscribeFromMessages** |
| `pages/LoginPage.jsx` | Form กรอก email/password → เรียก `login()` |
| `pages/SignUpPage.jsx` | Form กรอก fullname/email/password → เรียก `signup()` |
| `components/ChatContainer.jsx` | แสดงแชท + useEffect เปิด/ปิด Socket + Auto-scroll |
| `components/MessageInput.jsx` | Input ข้อความ + แนบรูป (FileReader → Base64) |
| `components/Sidebar.jsx` | แสดงรายชื่อ User + จุดเขียว Online |
| `App.jsx` | Route Protection + checkAuth ตอนเปิดเว็บ |

---

## 📊 สรุป Socket.IO: Frontend ↔ Backend

| Phase | 🎨 Frontend ทำอะไร | 🔧 Backend ทำอะไร |
|-------|--------------------|-------------------|
| **Setup** | `io(VITE_SOCKET_URL, { query: { userId } })` | `require('socket.io')(server)` + `userSocketMap` |
| **Connect** | `socket.connect()` + `query.userId` | `io.on("connection")` → เก็บ `userSocketMap[userId] = socket.id` |
| **Online** | `socket.on("getOnlineUsers")` → โชว์จุดเขียว | `io.emit("getOnlineUsers", Object.keys(userSocketMap))` |
| **ส่งแชท** | `api.post("/message/send/:id")` (**HTTP!**) | บันทึก MongoDB → `io.to(socketId).emit("newMessage")` |
| **รับแชท** | `socket.on("newMessage")` → อัปเดต Zustand → เด้ง | (ส่ง emit ไปแล้ว) |
| **เปลี่ยนคนคุย** | `socket.off("newMessage")` → ป้องกัน listener ซ้อน | — |
| **Logout** | `socket.disconnect()` | `socket.on("disconnect")` → ลบ Map → บอกทุกคน |

> **หลักการ:**
> - **ส่งข้อความ** → ใช้ **HTTP POST** (มี response กลับมา เชื่อถือได้)
> - **แจ้งเตือน Real-time** → ใช้ **Socket.IO** (เร็ว ไม่ต้อง refresh)
> - **ติดตามออนไลน์** → ใช้ **Socket.IO** (connect/disconnect อัตโนมัติ)

---

# 🧰 Frontend `lib/` — เครื่องมือพื้นฐาน 3 ชิ้นที่ทั้งแอปพึ่งพา

โฟลเดอร์ `lib/` คือ "กล่องเครื่องมือ" ที่เก็บของใช้ร่วมกันทั้งโปรเจกต์ ถ้าไม่มี 3 ไฟล์นี้ แอปจะทำอะไรไม่ได้เลยครับ:

---

## 🔌 1. `lib/socket.js` — สายเคเบิลเชื่อมต่อ Real-time

```javascript
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5000";

export const socket = io(BASE_URL, {
    autoConnect: false,  // ❶ ห้ามต่ออัตโนมัติ! ต้องรอ Login สำเร็จก่อน
});
```

**🔍 แต่ละบรรทัดทำอะไร:**
- **`io(BASE_URL, ...)`** — สร้าง "สายเคเบิล" เตรียมไว้เชื่อมกับ Backend ที่พอร์ต 5000
- **`autoConnect: false`** — **จุดสำคัญ!** ถ้าไม่ใส่ Socket จะพยายามต่อทันทีตั้งแต่เปิดเว็บ (ทั้งที่ยังไม่ได้ Login!) ทำให้ Backend ไม่รู้ว่า userId คือใคร
- **ใครเป็นคนสั่ง Connect?** — `useAuthStore.js` จะเป็นคนสั่ง `socket.connect()` หลัง Login สำเร็จ พร้อมแนบ `userId` ไปด้วย

**💡 ทำไมต้องแยกเป็นไฟล์?** เพราะทั้ง `useAuthStore` (ต่อ/ตัด Socket) และ `useChatStore` (รับแชท) ต้องใช้ socket ตัวเดียวกัน ถ้าสร้างใหม่ในแต่ละไฟล์ มันจะกลายเป็นคนละเส้นสาย!

---

## 📬 2. `lib/axios.js` — บุรุษไปรษณีย์ส่ง API

```javascript
import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "/api/v1",         // ❶ คำนำหน้า URL อัตโนมัติ
    withCredentials: true,      // ❷ แนบ Cookie (JWT) ไปกับทุก Request
});
```

**🔍 แต่ละบรรทัดทำอะไร:**
- **`baseURL: "/api/v1"`** — ทุกครั้งที่เรียก `api.get("/message/users")` ระบบจะต่อเป็น `/api/v1/message/users` ให้อัตโนมัติ (ไม่ต้องพิมพ์ซ้ำทุกครั้ง!)
- **`withCredentials: true`** — **หัวใจของ Auth!** บอก Browser ว่า "ทุกครั้งที่ยิง API ให้เปิดกระเป๋าเช็ค Cookie ถ้ามีตั๋ว JWT อยู่ ช่วยแนบไปด้วยนะ" ถ้าไม่ใส่ตัวนี้ Backend จะไม่รู้ว่าเราคือใคร (Error 401 ทุกครั้ง!)

**💡 ใครใช้ไฟล์นี้บ้าง?**
- `useAuthStore.js` — ยิง Login/Register/Logout/CheckAuth
- `useChatStore.js` — ยิง ดึงรายชื่อ/ดึงแชท/ส่งข้อความ

---

## ⏰ 3. `lib/utils.js` — เครื่องมือจิปาถะ (Utility Functions)

```javascript
export const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",      // ❶ แสดงชั่วโมง 2 หลัก (เช่น 09, 14)
        minute: "2-digit",    // ❷ แสดงนาที 2 หลัก (เช่น 05, 30)
        hour12: false,        // ❸ ใช้ 24 ชั่วโมง (14:30 แทน 2:30 PM)
    });
};
```

**🔍 ทำอะไร:**
- รับค่า `date` ที่ MongoDB ส่งมา (เช่น `2026-03-22T11:05:30.000Z`) แล้วแปลงให้อ่านง่าย → แสดงเป็น **`11:05`** หรือ **`14:30`**
- ใช้ใน `ChatContainer.jsx` เพื่อโชว์เวลาใต้แชทแต่ละบับเบิ้ล

**💡 ทำไมต้องแยกเป็นไฟล์?** เพราะถ้าวันหลังเราอยากเปลี่ยนรูปแบบเวลา (เช่น เพิ่มวันที่ หรือเปลี่ยนเป็นภาษาไทย) เราแก้แค่ไฟล์เดียว ทุก Component ที่ใช้จะเปลี่ยนตามทันทีครับ!

---

## 📊 สรุป `lib/` ทั้ง 3 ไฟล์:

| ไฟล์ | หน้าที่ | ใครใช้ |
|------|---------|--------|
| `socket.js` | สร้างสาย Socket.IO (autoConnect: false) | `useAuthStore` (ต่อ/ตัด), `useChatStore` (รับแชท) |
| `axios.js` | สร้างบุรุษไปรษณีย์ + แนบ Cookie อัตโนมัติ | `useAuthStore`, `useChatStore` (ทุก API) |
| `utils.js` | แปลงเวลาจาก MongoDB → "14:30" | `ChatContainer.jsx` (โชว์เวลาแชท) |

---

# 🐻 Flow: useChatStore.js — ศูนย์บัญชาการแชท (เจาะลึกทีละฟังก์ชัน)

ไฟล์นี้คือ **"คลังแสงและศูนย์บัญชาการ"** ของระบบแชท ทุก Component ที่เกี่ยวกับการแสดงข้อความจะมาดึงข้อมูลจากที่นี่ทั้งหมด:

## 📌 โครงสร้าง State (ข้อมูลที่เก็บไว้)
```javascript
export const useChatStore = create((set, get) => ({
    messages: [],           // ❶ Array เก็บข้อความแชทระหว่าง 2 คน
    users: [],              // ❷ Array เก็บรายชื่อเพื่อนทั้งหมด (Sidebar)
    selectedUser: null,     // ❸ เพื่อนที่เราเลือกคุยด้วยอยู่ตอนนี้
    isUsersLoading: false,  // ❹ สถานะโหลดรายชื่อ (โชว์ Skeleton)
    isMessageLoading: false,// ❺ สถานะโหลดแชท (โชว์ Skeleton)
}));
```
**💡 `set` คืออะไร?** คือฟังก์ชันที่ Zustand ให้มาเพื่อ "อัปเดต" State → ทุกครั้งที่เรียก `set(...)` → หน้าจอจะวาดใหม่ (Re-render)
**💡 `get` คืออะไร?** คือฟังก์ชันที่ "อ่าน" State ปัจจุบัน → ใช้ตอนที่เราต้องการเอาข้อมูลเก่ามาต่อท้ายข้อมูลใหม่

---

## 📌 ฟังก์ชันที่ 1: `getUsers()` — ดึงรายชื่อเพื่อนมาโชว์ใน Sidebar

```javascript
getUsers: async () => {
    set({ isUsersLoading: true });  // ❶ เปิดไฟ Loading (Skeleton)
    try {
        const response = await api.get("/message/users");  // ❷ ยิง API ไป Backend
        const users = response.data.filteredUsers.map(user => ({
            ...user,
            name: user.fullname,           // ❸ Map ชื่อให้ตรงกับ Frontend
            profilePic: user.profilePicture // ❹ Map รูปให้ตรงกับ Frontend
        }));
        set({ users });  // ❺ เก็บรายชื่อลง State → Sidebar วาดใหม่!
    } catch (error) {
        toast.error(error.response.data.message || "Get users failed");
    } finally {
        set({ isUsersLoading: false });  // ❻ ปิดไฟ Loading ไม่ว่าจะสำเร็จหรือล้มเหลว
    }
},
```
**🔗 ที่มาของข้อมูล:** `/message/users` → `message.router.js` → `getUsersForSiderbar` → `User.find({ _id: { $ne: loggedInUserId } })`
**🔗 ใครเรียกใช้:** `Sidebar.jsx` เรียกตอน `useEffect` (เปิดหน้าเว็บครั้งแรก)

---

## 📌 ฟังก์ชันที่ 2: `getMessages(userId)` — ดึงประวัติแชทเก่า

```javascript
getMessages: async (userId) => {
    set({ isMessagesLoading: true });  // ❶ เปิดไฟ Loading
    try {
        const response = await api.get(`/message/${userId}`);  // ❷ ยิง API พร้อม ID เพื่อน
        // URL จะกลายเป็นเช่น /api/v1/message/65fa...
        set({ messages: response.data });  // ❸ เอาแชทเก่ามายัดใส่ State ทั้งก้อน
    } catch (error) {
        toast.error(error.response.data.message || "Get Message Failed");
    } finally {
        set({ isMessagesLoading: false });  // ❹ ปิดไฟ Loading
    }
},
```
**🔗 ที่มาของข้อมูล:** `/message/:id` → `getMessage` → `Message.find({ $or: [...] })`
**🔗 ใครเรียกใช้:** `ChatContainer.jsx` เรียกตอน `useEffect` (เปิดแชทกับเพื่อนคนใหม่)

---

## 📌 ฟังก์ชันที่ 3: `sendMessage(messageData)` — ส่งข้อความ

```javascript
sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();  // ❶ ดึง ID เพื่อนที่คุยอยู่ + แชทเก่า
    try {
        const response = await api.post(
            "/message/send/" + selectedUser._id,  // ❷ ยิง POST ไป Backend พร้อม ID เพื่อน
            messageData,  // { text: "สวัสดี", image: base64... }
        );
        set({ messages: [...messages, response.data] })  // ❸ เอาแชทใหม่ต่อท้ายแชทเก่า!
        // ↑ ทำไมใช้ [...messages] ไม่ใช้ messages.push()?
        // เพราะ Zustand/React ต้องเห็น Array ใหม่ถึงจะวาดจอใหม่ (Immutability)
    } catch (error) {
        toast.error(error.response.data.message || "Sending Message Failed");
    }
},
```
**🔗 ที่มาของข้อมูล:** `/message/send/:id` → `sendMessage` → บันทึก MongoDB → `io.to().emit("newMessage")`
**🔗 ใครเรียกใช้:** `MessageInput.jsx` เรียกตอนกด "ส่ง"

---

## 📌 ฟังก์ชันที่ 4: `subscribeToMessages()` — เปิดหูฟัง Socket รอรับแชทใหม่

```javascript
subscribeToMessages: () => {
    const { selectedUser } = get();  // ❶ ดึง ID เพื่อนที่เปิดแชทอยู่
    if (!selectedUser) return;       // ❷ ถ้ายังไม่ได้เลือกเพื่อน → ไม่ทำอะไร

    const socket = useAuthStore.getState().socket;  // ❸ ดึง Socket จาก AuthStore
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {  // ❹ สวมหูฟังรอ Event "newMessage"
        // ❺ Closure! เช็คว่าข้อความมาจากเพื่อนที่เปิดจอคุยด้วยอยู่ไหม
        const isMessageSentFromSelectedUser = newMessage.sender === selectedUser._id;
        if (!isMessageSentFromSelectedUser) return;  // ❻ ไม่ใช่ → ไม่โชว์

        set({
            messages: [...get().messages, newMessage],  // ❼ ใช่ → เด้งขึ้นจอทันที!
        });
    });
},
```
**🔗 สิ่งที่เกิดขึ้นเบื้องหลัง:**
1. เพื่อนกดส่ง → Backend รับ → บันทึก DB → `io.to(socketId).emit("newMessage", msg)`
2. Socket ของเราได้ยิน → Callback ทำงาน → เช็ค sender ID
3. ตรงกับเพื่อนที่เปิดอยู่ → `set()` → หน้าจอวาดใหม่ → แชทเด้ง!

**🔗 ใครเรียกใช้:** `ChatContainer.jsx` เรียกใน `useEffect` ตอนเปิดแชท

---

## 📌 ฟังก์ชันที่ 5: `unsubscribeFromMessages()` — ถอดหูฟัง Socket

```javascript
unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");  // ❶ ถอดหูฟัง ป้องกัน Listener ซ้อน!
},
```
**💡 ทำไมต้องถอด?** ถ้าไม่ถอด... ทุกครั้งที่เปลี่ยนคนคุย → Listener จะซ้อนทับกัน → ข้อความจะเด้งซ้ำ 2 รอบ 3 รอบ! (Memory Leak)
**🔗 ใครเรียกใช้:** `ChatContainer.jsx` เรียกใน `return () =>` ของ `useEffect` (Cleanup)

---

## 📌 ฟังก์ชันที่ 6: `setSelectedUser(user)` — เลือกเพื่อนที่จะคุย

```javascript
setSelectedUser: (selectedUser) => {
    set({ selectedUser });  // ❶ แค่เซ็ตค่าเฉยๆ → จะไป Trigger useEffect อื่นต่อเอง
},
```
**🔗 ใครเรียกใช้:** `Sidebar.jsx` เรียกตอนคลิกชื่อเพื่อน

---

## 📊 สรุป Flow ทั้งหมดของ useChatStore.js:

```
User เปิดเว็บ
│
├─ Sidebar.jsx: getUsers() → ยิง API → ได้รายชื่อเพื่อน → โชว์จุดเขียว
│
├─ User คลิกชื่อเพื่อน
│   ├─ setSelectedUser(user) → เก็บข้อมูลเพื่อนที่เลือก
│   └─ ChatContainer.jsx: useEffect ทำงาน!
│       ├─ getMessages(userId) → ยิง API → ได้แชทเก่า → โชว์บนจอ
│       └─ subscribeToMessages() → เปิดหูฟัง Socket รอแชทใหม่
│
├─ User พิมพ์ "สวัสดี" กด Send
│   └─ sendMessage({ text }) → ยิง POST → Backend บันทึก + ส่ง Socket
│       ├─ Frontend A: set({ messages: [...เก่า, ใหม่] }) → แชทโชว์ฝั่งเรา ✅
│       └─ Frontend B: socket.on("newMessage") → แชทเด้งฝั่งเพื่อน ✅
│
├─ User เปลี่ยนคนคุย
│   └─ useEffect Cleanup: unsubscribeFromMessages() → ถอดหูฟัง Socket (ป้องกันซ้อน!)
│
└─ User ปิดเว็บ / Logout
    └─ disconnectSocket() → ตัดสาย Socket → Backend ลบออกจากรายชื่อออนไลน์
```
