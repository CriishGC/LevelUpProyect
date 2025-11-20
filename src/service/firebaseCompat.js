// Compat layer to support legacy code that expects `window.firebase` and the namespaced API
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
  authDomain: "tiendalevelup-ccd23.firebaseapp.com",
  projectId: "tiendalevelup-ccd23",
  storageBucket: "tiendalevelup-ccd23.appspot.com",
  messagingSenderId: "788122901795",
  appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
  measurementId: "G-QHQ3RM5FD8"
};

function initCompat() {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    // ignore
  }
  // attach to window for existing code that checks window.firebase
  try {
    if (typeof window !== 'undefined') window.firebase = firebase;
  } catch (e) {}
  const db = firebase.firestore();
  const auth = firebase.auth();
  return { firebase, db, auth };
}

const instance = initCompat();

export const firebaseCompat = instance.firebase;
export const dbCompat = instance.db;
export const authCompat = instance.auth;

export default instance;
