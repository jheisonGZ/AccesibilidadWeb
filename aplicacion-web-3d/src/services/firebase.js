import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAX30so-oQNUbw-3agDBgNgi06cItn28w4",
  authDomain: "get-started-333d7.firebaseapp.com",
  projectId: "get-started-333d7",
  storageBucket: "get-started-333d7.firebasestorage.app",
  messagingSenderId: "222174731538",
  appId: "1:222174731538:web:c57d5ccf5e4aa3b3c2e7cb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
