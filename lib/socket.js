require("dotenv").config();
const app = require('express')(); 
const server = require('http').createServer(app);
const userSocketMap = {}; // {จำ Id ว่า คนนี้ใช้เลขอะไร} เช่น {userId:socketId} เลยใส่เป็น {} ไว้
const io = require('socket.io')(server, {
    cors: {
        origin: [process.env.BASE_URL],
    }
});


// return socketId
function getReceiverSocketId(userId) { // ถ้าฝั่ง Frontend ส่ง userId มาให้หาว่าใช้เลขอะไร เราต้องส่ง socketId กลับไป
    return userSocketMap[userId]; // จะ Return เลข SocketId กลับไป ตรง Function getReceiverSocketId
}

//  event-based communication.
io.on("connection",(socket)=>{  // ส่ง call back function 
    console.log("A user Connected", socket.id);
    const userId= socket.handshake.query.userId; // รับค่า userId จาก Frontend จับมือกับ Frontend ละนะ
    if(userId){ 
        userSocketMap[userId]=socket.id; // เก็บค่า userId กับ socket.id ไว้ (แก้ usersSocketMap เป็น userSocketMap)
        console.log("UserSocketMap", userSocketMap); 
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));  //  ใช้ object.keys(userSocketMap) เพื่อให้ return user.id ที่ออนไลน์ออกไปทั้งหมด

    
    socket.on("disconnect", ()=>{ // เมื่อมีคน disconnect 
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId]; // ลบ userSocketMap[userId] ออก
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // <-- เพิ่มบรรทัดนี้เพื่อยิงบอกทุกคนว่าคนนี้ออกไปแล้ว
        console.log("UsersocketMap", userSocketMap);
    });

} );

module.exports = { io, app, server, getReceiverSocketId };


