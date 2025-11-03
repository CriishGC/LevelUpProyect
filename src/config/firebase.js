import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
    authDomain: "tiendalevelup-ccd23.firebaseapp.com",
    projectId: "tiendalevelup-ccd23",
    storageBucket: "tiendalevelup-ccd23.appspot.com",
    messagingSenderId: "788122901795",
    appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
    measurementId: "G-QHQ3RM5FD8"
  };
  
  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);

  export const auth = getAuth(app);

  