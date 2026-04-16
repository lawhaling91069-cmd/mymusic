import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArXb1xDMt-qXfNmtn7yvFkPm809pkPUpY",
  authDomain: "mymusic-33737.firebaseapp.com",
  projectId: "mymusic-33737",
  storageBucket: "mymusic-33737.firebasestorage.app",
  messagingSenderId: "262630186528",
  appId: "1:262630186528:web:d84b679943985e2e38e645",
  measurementId: "G-BL7BWW0729"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);