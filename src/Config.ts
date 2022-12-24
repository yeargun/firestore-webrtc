// YOUR FIRESTORE CREDENTIALS
export const firebaseConfig = {
  apiKey: "x",
  authDomain: "x.firebaseapp.com",
  databaseURL: "https://x.europe-west1.firebasedatabase.app",
  projectId: "x",
  storageBucket: "x",
  messagingSenderId: "x",
  appId: "x",
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

export const CHUNK_SIZE = 5000;

export const dataChannelOptions = {
  ordered: true,
  reliable: true,
};
