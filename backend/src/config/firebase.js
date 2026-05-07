// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCaNyH8fYrrqhrm19x06XFNOf9cPNs9QI4",
  authDomain: "funeraria-5f6bf.firebaseapp.com",
  projectId: "funeraria-5f6bf",
  storageBucket: "funeraria-5f6bf.firebasestorage.app",
  messagingSenderId: "109344490483",
  appId: "1:109344490483:web:d274a5a7896a87e4e8c886",
  measurementId: "G-ZX4ZD2W1ZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);