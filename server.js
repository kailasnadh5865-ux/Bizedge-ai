require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());

// simple health check for Render
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// ✅ Retell route (temporary response)
app.post("/retell-book", async (req, res) => {
  res.json({ success: true });
});

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

// ✅ New availability check route
app.post("/check-availability", async (req, res) => {
  try {
    const { start_time } = req.body;

    const response = await axios.get(
      "https://api.calendly.com/event_type_available_times",
      {
        params: {
          event_type: process.env.CALENDLY_EVENT_TYPE_URI,
          start_time: start_time,
          end_time: start_time
        },
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`
        }
      }
    );

    if (response.data.collection.length > 0) {
      return res.json({
        available: true
      });
    }

    // If not available, get next 3 slots
    const fallback = await axios.get(
      "https://api.calendly.com/event_type_available_times",
      {
        params: {
          event_type: process.env.CALENDLY_EVENT_TYPE_URI,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`
        }
      }
    );

    const nextSlots = fallback.data.collection
      .slice(0, 3)
      .map(slot => slot.start_time);

    res.json({
      available: false,
      suggestions: nextSlots
    });

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
