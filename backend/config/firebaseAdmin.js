const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


const serviceAccountPath = './service-account.json';

const initializeFirebase = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log('📦 Attempting to parse FIREBASE_SERVICE_ACCOUNT_JSON...');
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (parseError) {
        console.error('❌ CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON.');
        console.error('Check if the secret contains extra quotes, escaped characters, or is truncated.');
        console.error('Error Details:', parseError.message);
        throw parseError; // Re-throw to prevent partial initialization
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'vita-479105',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log('✅ Firebase Admin Initialized successfully from env var');
    } else if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(require('../service-account.json')), // Adjusted path for require
        projectId: 'vita-479105',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      console.log('✅ Firebase Admin Initialized using service-account.json');
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'vita-479105',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
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
