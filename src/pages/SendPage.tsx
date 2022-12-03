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

import { DropzoneArea } from "material-ui-dropzone";
import { useState, React } from "react";
import { Button } from "@mui/material";

// 2. create an offer
const createOffer = async (pc: RTCPeerConnection, db: Firestore) => {
  const testCallName = Math.floor(Math.random() * 10000).toString();
  const callDoc = doc(db, "calls", testCallName);
  const offerCandidatesRef = collection(callDoc, "offerCandidates");
  const answerCandidatesRef = collection(callDoc, "answerCandidates");

  pc.onicecandidate = (event) => {
    event.candidate && addDoc(offerCandidatesRef, event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  console.log("created offer:", offer);

  setDoc(callDoc, { offer });

  // Listen for remote answer
  onSnapshot(callDoc, (doc) => {
    const data = doc.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  onSnapshot(answerCandidatesRef, (doc) => {
    doc.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
};

// const answerTranfer = async (
//   pc: RTCPeerConnection,
//   db: Firestore,
//   callId: string
// ) => {
//   const callDoc = doc(db, "calls", callId);
//   const offerCandidatesRef = collection(callDoc, "offerCandidates");
//   const answerCandidatesRef = collection(callDoc, "answerCandidates");

//   pc.onicecandidate = (event) => {
//     event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON());
//   };

//   const callData = (await getDoc(callDoc)).data();

//   const offerDescription = callData.offer;
//   await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

//   const answerDescription = await pc.createAnswer();
//   await pc.setLocalDescription(answerDescription);

//   const answer = {
//     type: answerDescription.type,
//     sdp: answerDescription.sdp,
//   };

//   await updateDoc(callDoc, { answer });

//   onSnapshot(offerCandidatesRef, (doc) => {
//     doc.docChanges().forEach((change) => {
//       console.log(change);
//       if (change.type === "added") {
//         const data = change.doc.data();
//         pc.addIceCandidate(new RTCIceCandidate(data));
//       }
//     });
//   });
// };

function SendPage() {
  const [toBeUploadedFiles, setToBeUploadedFiles] = useState([]);

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
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(configuration);

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Cloud Firestore and get a reference to the service
  const db = getFirestore(app);

  return (
    <>
      <DropzoneArea
        sx={{ position: "fixed" }}
        showPreviews={true}
        showPreviewsInDropzone={false}
        useChipsForPreview
        filesLimit={7}
        previewText="Selected files"
        onChange={setToBeUploadedFiles}
        maxFileSize={2147483648}
      />
      <Button
        onClick={() => {
          console.log("sdfs");
          createOffer(pc, db);
        }}
      >
        create an offer
      </Button>
      {/* 
      <Button
        onClick={() => {
          answerTranfer(pc, db, "447.5083397859405");
        }}
      >
        answer the call with unique id
      </Button> */}
    </>
  );
}

export default SendPage;
