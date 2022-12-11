export const firebaseConfig = {
  apiKey: "AIzaSyC7u3rcfvvdWkDEU4sqdVvsq9kbNtEv9vU",
  authDomain: "sendstuf-a62cc.firebaseapp.com",
  databaseURL:
    "https://sendstuf-a62cc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sendstuf-a62cc",
  storageBucket: "sendstuf-a62cc.appspot.com",
  messagingSenderId: "971673330562",
  appId: "1:971673330562:web:5b9011c1f81397fbd9a59b",
  measurementId: "G-78MB2RBS4L",
};

export const RTCconfig = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
