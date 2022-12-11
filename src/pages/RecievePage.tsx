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

import { useState } from "react";
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

var buffer: any[] = [];

function RecievePage() {
  const [messages, setMessages] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});

  pc.ondatachannel = (event) => {
    const sendChannel = event.channel;
    sendChannel.onmessage = handleRecieveMessage;
  };

  const saveFile = (
    meta: { type?: any; name?: any },
    data: any[] | undefined
  ) => {
    console.log("meta.type this:", meta.type);
    const dataBlob = new Blob(data, { type: meta.type });
    const url = URL.createObjectURL(dataBlob);

    let a = document.createElement("a");
    a.href = url;
    a.download = meta.name;
    a.click();
    // saveAs(blob, meta.name);
  };

  const handleRecieveMessage = (e: { data: any }) => {
    buffer.push(e.data);
    console.log(e);

    // const message = JSON.parse(e.data);

    console.log("buffer length:", buffer.length);
  };

  const answerTransfer = async (
    pc: RTCPeerConnection,
    db: Firestore,
    connectionKey: string
  ) => {
    const callDoc = doc(db, "calls", connectionKey);
    const offerCandidatesRef = collection(callDoc, "offerCandidates");
    const answerCandidatesRef = collection(callDoc, "answerCandidates");

    pc.onicecandidate = (event) => {
      event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON());
    };

    const senderFileShareData = (await getDoc(callDoc)).data();
    setFileMetadata(senderFileShareData?.metadata);
    const senderFileShareOfferData = senderFileShareData?.offer;

    console.log("senderSDP ->", senderFileShareData);
    console.log("fileMetadata ->", fileMetadata);
    await pc.setRemoteDescription(
      new RTCSessionDescription(senderFileShareOfferData)
    );

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

  return (
    <>
      <h1>SEND SECURE</h1>
      <br />
      <h2>
        Wanna download the file: "{fileMetadata?.name}", size:
        {fileMetadata?.size} Ok ?
      </h2>
      <button
        onClick={() => {
          answerTransfer(pc, db, currUrlPath);
        }}
      >
        ok
      </button>
      <Button
        onClick={() => {
          saveFile(fileMetadata, buffer);
        }}
      >
        saveFile. recieved all at buffer xD for real
      </Button>
      <h3>File download percentage ..</h3>
    </>
  );
}

export default RecievePage;
