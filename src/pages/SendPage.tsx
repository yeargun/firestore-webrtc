import React from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

import { DropzoneArea } from "material-ui-dropzone";
import { useState } from "react";
import { Button } from "@mui/material";

// 2. create an offer
const createOffer = async (pc: RTCPeerConnection, db) => {
  const testCallName = (Math.random() * 1000).toString();
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

  setDoc(callDoc, offer);

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

  //   // Send any ice candidates to the other peer.
  //   pc.onicecandidate = ({ candidate }) => signaling.send({ candidate });

  //   // Let the "negotiationneeded" event trigger offer generation.
  //   pc.onnegotiationneeded = async () => {
  //     try {
  //       await pc.setLocalDescription(await pc.createOffer());
  //       // Send the offer to the other peer.
  //       signaling.send({ desc: pc.localDescription });
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   // Once remote track media arrives, show it in remote video element.
  //   pc.ontrack = (event) => {
  //     // Don't set srcObject again if it is already set.
  //     if (remoteView.srcObject) return;
  //     remoteView.srcObject = event.streams[0];
  //   };

  //   //   pc.onicecandidate({candidate}) => firestore.send({candiate})

  //   dataChannel.addEventListener("open", (event) => {
  //     console.log("open");
  //   });

  //   dataChannel.addEventListener("close", (event) => {
  //     console.log("close");
  //   });
  //   pc.addEventListener("datachannel", (event) => {
  //     console.log("asdas");
  //     const dataChannel2 = event.channel;
  //   });

  // dataChannel.send("asdasdas");
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

      <Button
        onClick={() => {
          alert("clicked");
        }}
      >
        answer the call with unique id
      </Button>
    </>
  );
}

export default SendPage;
