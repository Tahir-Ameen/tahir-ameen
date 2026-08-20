require("dotenv").config();

// Fix DNS SRV resolution for some ISPs (Pakistan etc.)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// MongoDB Connection
// ---------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("[mongo] Connected to MongoDB"))
  .catch((err) => console.error("[mongo] Connection error:", err.message));

// ---------------------------------------------------------------------------
// User Schema
// ---------------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model("User", userSchema);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// ---------------------------------------------------------------------------
// JWT Auth Middleware
// ---------------------------------------------------------------------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ ok: false, message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

// ---------------------------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------------------------

// --- Signup ---
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "");

    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return res.status(422).json({ ok: false, message: "Name must be 2-100 characters." });
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return res.status(422).json({ ok: false, message: "Please enter a valid email." });
    }
    if (cleanPass.length < 6) {
      return res.status(422).json({ ok: false, message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already registered. Please login." });
    }

    const user = await User.create({ name: cleanName, email: cleanEmail, password: cleanPass });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      ok: true,
      message: "Account created successfully!",
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("[auth] Signup error:", err.message);
    return res.status(500).json({ ok: false, message: "Server error. Please try again." });
  }
});

// --- Login ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "");

    if (!cleanEmail || !cleanPass) {
      return res.status(422).json({ ok: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(cleanPass);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      ok: true,
      message: "Logged in successfully!",
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("[auth] Login error:", err.message);
    return res.status(500).json({ ok: false, message: "Server error. Please try again." });
  }
});

// --- Logout ---
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true, message: "Logged out." });
});

// --- Get Current User ---
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email createdAt");
    if (!user) return res.status(404).json({ ok: false, message: "User not found." });
    return res.json({ ok: true, user });
  } catch {
    return res.status(500).json({ ok: false, message: "Server error." });
  }
});

// ---------------------------------------------------------------------------
// Contact Form API
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH = 4000;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_SENDER_EMAIL = "hafiztahirameen786@gmail.com";

app.post("/api/contact", async (req, res) => {
  const { name = "", email = "", subject = "", message = "" } = req.body;

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();
  const cleanSubject = String(subject).trim();
  const cleanMessage = String(message).trim();

  const errors = {};
  if (!cleanName || cleanName.length > 100) errors.name = "Please enter your name.";
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.split("@")[1].includes(".") || cleanEmail.length > 200)
    errors.email = "Please enter a valid email address.";
  if (!cleanSubject || cleanSubject.length > 200) errors.subject = "Please enter a subject.";
  if (!cleanMessage || cleanMessage.length > MAX_MESSAGE_LENGTH)
    errors.message = `Please enter a message (max ${MAX_MESSAGE_LENGTH} characters).`;

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ ok: false, errors, message: "Please fix the highlighted fields." });
  }

  const record = {
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    received_at: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown",
  };

  let sent = false;
  try { sent = await sendViaBrevo(record); } catch (err) { console.error("[contact] Brevo error:", err.message); }
  if (!sent) saveToFile(record);

  return res.status(200).json({ ok: true, message: "Thanks! Your message has been sent." });
});

// ---------------------------------------------------------------------------
// Brevo API helper
// ---------------------------------------------------------------------------
async function sendViaBrevo(record) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === "your-brevo-api-key-here") {
    console.log("[contact] Brevo API key not configured, skipping email.");
    return false;
  }

  const mailTo = process.env.MAIL_TO || "your-email@example.com";

  const payload = {
    sender: { name: "Portfolio Contact Form", email: BREVO_SENDER_EMAIL },
    to: [{ email: mailTo }],
    subject: `[Portfolio] ${record.subject} — ${record.name}`,
    htmlContent: `
      <h2>New Contact Form Message</h2>
      <p><strong>Name:</strong> ${record.name}</p>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Subject:</strong> ${record.subject}</p>
      <hr>
      <p>${record.message.replace(/\n/g, "<br>")}</p>
      <hr>
      <p style="color:#888;font-size:12px;">Received at ${record.received_at} | IP: ${record.ip}</p>
    `,
    textContent: `New message from ${record.name} <${record.email}>\n\nSubject: ${record.subject}\n\n${record.message}`,
  };

  const response = await axios.post(BREVO_API_URL, payload, {
    headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
    timeout: 15000,
  });

  if (response.status === 200 || response.status === 201) {
    console.log("[contact] Brevo email sent successfully.");
    return true;
  }
  console.log(`[contact] Brevo API error ${response.status}`);
  return false;
}

// ---------------------------------------------------------------------------
// Fallback: save to file
// ---------------------------------------------------------------------------
function saveToFile(record) {
  try {
    const dir = path.join(__dirname, "messages");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "messages.log"), JSON.stringify(record) + "\n", "utf-8");
    console.log("[contact] Saved to messages/messages.log");
  } catch (err) {
    console.error("[contact] Could not save to file:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Portfolio server running at http://127.0.0.1:${PORT}`);
});
