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

// var yourConnection,
//   connectedUser,
//   dataChannel,
//   currentFile,
//   currentFileSize,
//   currentFileMeta;
var fileMetadata = {};
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
  fileMetadata = senderFileShareData.metadata;
  const senderFileShareOfferData = senderFileShareData.offer;

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

var buffer = [];

function RecievePage() {
  const [messages, setMessages] = useState([]);

  pc.ondatachannel = (event) => {
    const sendChannel = event.channel;
    sendChannel.onmessage = handleRecieveMessage;
  };

  function base64ToBlob(b64Data, contentType) {
    contentType = contentType || "";

    const byteArrays = [];
    let byteNumbers;
    let slice;

    for (let i = 0; i < b64Data.length; i++) {
      slice = b64Data[i];

      byteNumbers = new Array(slice.length);
      for (let n = 0; n < slice.length; n++) {
        byteNumbers[n] = slice.charCodeAt(n);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  const saveFile = (meta, data) => {
    console.log("meta.type this:", meta.type);
    const dataBlob = new Blob(data, { type: meta.type });
    const url = URL.createObjectURL(dataBlob);

    let a = document.createElement("a");
    a.href = url;
    a.download = meta.name;
    a.click();
    // saveAs(blob, meta.name);
  };

  const handleRecieveMessage = (e) => {
    buffer.push(e.data);
    console.log(e);

    // const message = JSON.parse(e.data);

    console.log("buffer length:", buffer.length);
  };

  return (
    <>
      <h1>hello recievepage</h1>
      <h2>might be creazy recieving stuff</h2>
      <h3>You are recieving "bla bla" file, "bla bla" size. Ok ?</h3>
      <h1>File download percentage ..</h1>
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
    </>
  );
}

export default RecievePage;
