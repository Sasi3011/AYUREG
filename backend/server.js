require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { notFoundHandler, errorHandler } = require("./src/middleware/errorHandler");
const path = require("path");
const { getUploadDir } = require("./src/services/storage");

const authRoutes = require("./src/routes/authRoutes");
const pathwayRoutes = require("./src/routes/pathwayRoutes");
const applicationRoutes = require("./src/routes/applicationRoutes");
const documentRoutes = require("./src/routes/documentRoutes");
const officerRoutes = require("./src/routes/officerRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const certificateRoutes = require("./src/routes/certificateRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const assistantRoutes = require("./src/routes/assistantRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const profileRoutes = require("./src/routes/profileRoutes");

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) or any localhost port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    cb(null, process.env.FRONTEND_URL === origin);
  },
  credentials: true,
}));
app.use(express.json());

// Serve static uploaded documents for officer viewing
app.use("/uploads", express.static(getUploadDir()));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/pathway", pathwayRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AYUREG backend listening on port ${PORT}`));
