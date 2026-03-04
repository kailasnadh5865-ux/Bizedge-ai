require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// simple health check for Render
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Retell route (temporary response)
app.post("/retell-book", async (req, res) => {
  res.json({ success: true });
});

// Serve static files from the root directory (now enabled earlier)

const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN;
const EVENT_TYPE_URI ="https://api.calendly.com/event_types/1db3b8e8-b27e-4868-bb68-e6a5eb5f0267"

// 1️⃣ Get available time slots
app.get("/availability", async (req, res) => {
  try {
    // 15 minutes in the future (guaranteed safe)
    const start = new Date(Date.now() + 15 * 60 * 1000);
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log("START:", start.toISOString());
    console.log("END:", end.toISOString());

    const response = await axios.get(
      "https://api.calendly.com/event_type_available_times",
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`,
        },
        params: {
          event_type: process.env.CALENDLY_EVENT_TYPE_URI,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || error.message);
  }
});

// ✅ New availability check route
app.post("/check-availability", async (req, res) => {
  try {
    const { start_time } = req.body;

    if (!start_time) {
      return res.status(400).json({ error: "start_time is required" });
    }

    // Create a 30-minute window around requested time
    const start = new Date(start_time);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const response = await axios.get(
      "https://api.calendly.com/event_type_available_times",
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`,
        },
        params: {
          event_type: process.env.CALENDLY_EVENT_TYPE_URI,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        },
      }
    );

    const availableSlots = response.data.collection;

    const requestedTime = new Date(start_time).getTime();

    const isAvailable = availableSlots.some(
      (slot) => new Date(slot.start_time).getTime() === requestedTime
    );

    res.json({ available: isAvailable });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Availability check failed" });
  }
});

// 🚀 Booking route
app.post("/book-slot", async (req, res) => {
  try {
    const { name, email, start_time } = req.body;

    await axios.post(
      "https://api.calendly.com/scheduled_events",
      {
        event_type: process.env.CALENDLY_EVENT_TYPE_URI,
        start_time: start_time,
        invitee: { name, email }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Booking failed" });
  }
});

// 2️⃣ Book a meeting with Retell (temporary simplified handler)
// original implementation removed for testing



// Serving the main HTML file (moved to /ui)
app.get("/ui", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
