const express = require("express");
const { z } = require("zod");
const { env } = require("../config/env");
const { ensureAdminUser } = require("../modules/admin");

const router = express.Router();

const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/create", async (req, res, next) => {
  try {
    const masterKey = req.header("x-master-key");
    if (!masterKey || masterKey !== env.MASTER_ADMIN_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = CreateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid create admin payload",
        errors: parsed.error.flatten(),
      });
    }

    const result = await ensureAdminUser(parsed.data);

    if (!result.created) {
      return res.status(409).json({
        message: "Admin user already exists",
      });
    }

    return res.status(201).json({
      message: "Admin user created",
      email: result.email,
      role: "admin",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
