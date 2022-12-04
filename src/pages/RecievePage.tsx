import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { useState, React } from "react";
import { Button } from "@mui/material";

const firebaseConfig = {
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

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(configuration);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const currUrlPath = window.location.href.substring(
  window.location.href.lastIndexOf("/") + 1
);

const answerTranfer = async (
  pc: RTCPeerConnection,
  db: Firestore,
  callId: string
) => {
  const callDoc = doc(db, "calls", callId);
  const offerCandidatesRef = collection(callDoc, "offerCandidates");
  const answerCandidatesRef = collection(callDoc, "answerCandidates");

  console.log("answerCandidatesRef", answerCandidatesRef);
  console.log("offercandidateref", offerCandidatesRef);
  pc.onicecandidate = (event) => {
    event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON());
  };

  const callData = (await getDoc(callDoc)).data();
  console.log("calldata ->", callData);
  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(callDoc, { answer });

  onSnapshot(offerCandidatesRef, (doc) => {
    doc.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === "added") {
        const data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

// recieveDataChannel.onmessage = (event) => {
//   console.log("Got Data Channel Message:", event.data);
// };

function RecievePage() {
  const [messages, setMessages] = useState([]);

  const handleRecieveMessage = (e) => {
    console.log("e:", e);
    setMessages([...messages, { yours: false, value: e.data }]);
    console.log(messages);
  };

  pc.ondatachannel = (event) => {
    const sendChannel = event.channel;
    sendChannel.onmessage = handleRecieveMessage;
  };

  return (
    <>
      <h1>hello recievepage</h1>
      <h2>might be creazy recieving stuff</h2>

      <Button
        onClick={() => {
          answerTranfer(pc, db, currUrlPath);
        }}
      >
        answer the call with unique id
      </Button>
      <Button
        onClick={() => {
          console.log("lclikecd");
          console.log(recieveDataChannel);
        }}
      >
        refrsh
      </Button>
    </>
  );
}

export default RecievePage;
