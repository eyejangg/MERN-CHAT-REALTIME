const User = require("../models/User")
const cloudinary = require("../configs/cloudinary")
const { getReceiverSocketId, io} = require("../lib/socket");
const Message = require("../models/Message");


// function get users for siderbar 
const getUsersForSiderbar = async (req, res) => { // ดึงข้อมูลผู้ใช้
    try {
        const loggedInUserId = req.user._id; // id ของ user ที่ล็อคอินเข้ามา
        const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");
        res.status(200).json({filteredUsers});   // $ne = not equal เอาทุกคนยกเว้นตัวเอง
    } catch (error) {
        res.status(500).json({message: "Internal Server Error While getting users info"});
    }

    };

    // function get Message
    const getMessage = async (req, res) => { // ดึงข้อความที่ส่งมา
        try {
            const myId = req.user._id; // id ของ user ที่ล็อคอินเข้ามา
            const { id: userToChat } = req.params; // id ของ user ที่เราต้องการจะคุยด้วย
            const messages = await Message.find({
                $or: [
                    { sender: myId, recipient: userToChat }, //  Sender ของ เรา กับ Recipient ของผู้อื่น
                    { sender: userToChat, recipient: myId } //   Sender ของผู้อื่นกับ Recipient ของเรา
                ]
            });
            res.status(200).json(messages); // แก้จาก res.status(message) เป็น 200 และส่ง json
        } catch (error) {
            console.log("Error in getMessage controller: ", error.message);
            res.status(500).json({ message: "Internal Server Error While getting messages" });
        }
    };

// sendMessage function
const sendMessage = async (req, res) => { // ส่งข้อความ
    try {
        const { id: recipient } = req.params; // id ของ user ที่เราต้องการจะคุยด้วย
        const senderId = req.user._id; // id ของ user ที่ล็อคอินเข้ามา
        const { text, file } = req.body; // ข้อความและไฟล์ที่ส่งมา

        if (!recipient) {
            return res.status(400).json({ message: "Recipient ID is Missing" });
        }

        let fileUrl = "";
        if (file) { // ถ้ามีไฟล์
            const uploadResponse = await cloudinary.uploader.upload(file); // อัพโหลดไฟล์
            fileUrl = uploadResponse.secure_url; // เอา url ของไฟล์
        }

        const newMessage = await new Message({
            sender: senderId, // แก้จาก senderId เป็น sender ให้ตรงกับ Model
            recipient: recipient,
            text,
            file: fileUrl,
        });

        await newMessage.save();

        // ส่วนนี้ที่อาจารย์บอกว่าสำคัญมาก ในการส่งข้อความแบบ real-time
         // ส่งข้อความแบบ real-time
        const receiverSocketId = getReceiverSocketId(recipient); // id ของ user ที่เราต้องการจะคุยด้วย
        if (receiverSocketId) { // ถ้ามี id ของ user ที่เราต้องการจะคุยด้วย
            io.to(receiverSocketId).emit("newMessage", newMessage); // ส่งข้อความไปยัง user ที่เราต้องการจะคุยด้วย
        }

        res.status(201).json(newMessage); // ส่งกลับไปหา frontend 
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error While sending message" });
    }
};

const messageController ={
    getUsersForSiderbar,
    getMessage,
    sendMessage
};

module.exports = messageController;