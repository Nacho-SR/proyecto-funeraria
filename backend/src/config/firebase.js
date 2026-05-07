const admin = require("firebase-admin");
const { env } = require("./env");

const serviceAccountFromEnv = env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

if (!admin.apps.length) {
  if (serviceAccountFromEnv) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFromEnv),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

const firestore = admin.firestore();

module.exports = {
  admin,
  firestore,
};