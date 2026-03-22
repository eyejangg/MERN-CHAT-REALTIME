const express = require("express");
const router = express.Router();
const { protectedRoute } = require("../middlewares/auth.middleware");


const {
    getUsersForSiderbar,
    getMessage,
    sendMessage
} = require("../controllers/message.controller");

// Get users for siderbar
// http://localhost:5000/api/v1/message/users // ได้รับมา
router.get("/users", protectedRoute, getUsersForSiderbar);

// Get messages
// http://localhost:5000/api/v1/message/:id // ได้รับมา
router.get("/:id", protectedRoute, getMessage);

// Send message
// http://localhost:5000/api/v1/message/send/:id ที่ได้รับมา
router.post("/send/:id", protectedRoute, sendMessage);


module.exports = router;