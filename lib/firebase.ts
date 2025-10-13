import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBjxlghIx2Cc4uhgPPTN4zuWSFumfKN-u0",
  authDomain: "gerador-livros-ia-a1e5c.firebaseapp.com",
  projectId: "gerador-livros-ia-a1e5c",
  storageBucket: "gerador-livros-ia-a1e5c.firebasestorage.app", 
  messagingSenderId: "522378738091",
  appId: "1:522378738091:web:57d3e63af006564b563aee"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
