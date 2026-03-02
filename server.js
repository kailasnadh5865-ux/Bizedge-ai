require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN;
const EVENT_TYPE_URI ="https://api.calendly.com/event_types/1db3b8e8-b27e-4868-bb68-e6a5eb5f0267"

// 1️⃣ Get available time slots
app.get("/availability", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.calendly.com/event_type_available_times",
            {
                headers: {
                    Authorization: `Bearer ${CALENDLY_TOKEN}`,
                },
                params: {
                    event_type: EVENT_TYPE_URI,
                    start_time: "2026-03-01T00:00:00Z",
                    end_time: "2026-03-07T23:59:59Z",
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        res.status(500).json((error.response && error.response.data) || error.message);
    }
});


// Root Status Route for Render Health Check
app.get("/", (req, res) => {
    res.send("Bizedge AI backend is running 🚀");
});

// Serving the main HTML file (moved to /ui)
app.get("/ui", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
