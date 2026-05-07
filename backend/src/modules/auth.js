const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { firestore } = require("../config/firebase");
const { env } = require("../config/env");

const USERS_COLLECTION = "users";
const PASSWORD_SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const userRef = firestore.collection(USERS_COLLECTION).doc(normalizedEmail);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function signToken({ userId, role }) {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

module.exports = {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  getUserByEmail,
  signToken,
  USERS_COLLECTION,
};
