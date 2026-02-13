const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

const serviceAccountPath = './service-account.json';

const initializeFirebase = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'vita-479105'
      });
      console.log('✅ Firebase Admin Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env var');
    } else if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(require('../service-account.json')), // Adjusted path for require
        projectId: 'vita-479105'
      });
      console.log('✅ Firebase Admin Initialized using service-account.json');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'vita-479105'
      });
      console.log('✅ Firebase Admin Initialized using GCloud CLI (ADC)');
    }
  } catch (error) {
    console.error('❌ Firebase Admin Init Error:', error.message);
    throw error;
  }
  
  return admin;
};

module.exports = { admin, initializeFirebase };
