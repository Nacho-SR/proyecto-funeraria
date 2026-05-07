const { firestore, admin } = require("../config/firebase");
const { hashPassword, normalizeEmail, USERS_COLLECTION } = require("./auth");

async function ensureAdminUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const userRef = firestore.collection(USERS_COLLECTION).doc(normalizedEmail);
  const userSnapshot = await userRef.get();

  if (userSnapshot.exists) {
    return {
      created: false,
      reason: "already_exists",
    };
  }

  const passwordHash = await hashPassword(password);

  await userRef.set({
    email: normalizedEmail,
    role: "admin",
    passwordHash,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    created: true,
    email: normalizedEmail,
  };
}

module.exports = {
  ensureAdminUser,
};
