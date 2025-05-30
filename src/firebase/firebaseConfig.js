import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxlCMOqZiD7t5sQfVYUsDCZgt-8ok4QdA",
  authDomain: "exam-system-65761.firebaseapp.com",
  projectId: "exam-system-65761",
  storageBucket: "exam-system-65761.appspot.com",
  messagingSenderId: "388201150905",
  appId: "1:388201150905:web:74c15b26c4ca5bf700de68",
  measurementId: "G-5HRTNK4X2B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();