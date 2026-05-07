const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/env");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN || true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
  });
});

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
