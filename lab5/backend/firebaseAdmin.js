const admin = require("firebase-admin");

let serviceAccount;

try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
    console.error('❌ Firebase key parsing error:', err);
    process.exit(1);
}


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
