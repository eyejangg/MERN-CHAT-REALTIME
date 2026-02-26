const User = require("../models/User")
const cloudinary = require("../configs/cloudinary")
const { getReceiverSocketId, io} = require("../lib/socket");
const Message = require("../models/Message");


// function get users for siderbar 
const getUsersForSiderbar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");
        res.status(200).json({filteredUsers});   
    } catch (error) {
        res.status(500).json({message: "Internal Server Error While getting users info"});
    }

    };

    // function get Message
    const getMessage = async (req, res) => { // ดึงข้อความที่ส่งมา
        try {
            const myId = req.user._id; 
            const { id: userToChat } = req.params; 
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
        const { id: recipient } = req.params;
        const senderId = req.user._id; // ตั้งค่าตัวแปร senderId ให้เท่ากับ req.user._id
        const { text, file } = req.body;

        if (!recipient) {
            return res.status(400).json({ message: "Recipient ID is Missing" });
        }

        let fileUrl = "";
        if (file) {
            const uploadResponse = await cloudinary.uploader.upload(file);
            fileUrl = uploadResponse.secure_url;
        }

        const newMessage = await new Message({
            sender: senderId, // แก้จาก senderId เป็น sender ให้ตรงกับ Model
            recipient: recipient,
            text,
            file: fileUrl,
        });

        await newMessage.save();

        // Real-time notification using Socket.io
        const receiverSocketId = getReceiverSocketId(recipient);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage); 
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