const express = require("express");
const { z } = require("zod");
const {
  getUserByEmail,
  verifyPassword,
  signToken,
  normalizeEmail,
} = require("../modules/auth");

const router = express.Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["cliente", "cobrador", "admin"]),
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid login payload",
        errors: parsed.error.flatten(),
      });
    }

    const { email, password, role } = parsed.data;
    const user = await getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Role mismatch for this user" });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      token,
      role: user.role,
      email: normalizeEmail(email),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
