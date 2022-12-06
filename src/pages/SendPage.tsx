import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
} from "firebase/firestore";

import { DropzoneArea } from "material-ui-dropzone";
import { useState } from "react";
import { Button } from "@mui/material";
import { readFile } from "../File";

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

const dataChannelOptions = {
  ordered: true,
  reliable: true,
};
const sendChannel = pc.createDataChannel("sendDataChannel", dataChannelOptions);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
let urlKey = "";
// 2. create an offer
const createOffer = async (
  pc: RTCPeerConnection,
  db: Firestore,
  fileList: File[]
) => {
  urlKey = Math.floor(Math.random() * 10000).toString();
  const callDoc = doc(db, "calls", urlKey);
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

  const metadata = {
    name: fileList[0].name,
    size: fileList[0].size,
    type: fileList[0].type,
  };

  setDoc(callDoc, { offer, metadata });

  // Listen for remote answer
  onSnapshot(callDoc, (doc) => {
    const data = doc.data();
    console.log("doc.data()", data);
    console.log("answered fr");
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      return urlKey;
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
  const [toBeUploadedFiles, setToBeUploadedFiles] = useState<File[]>([]);
  const [shareKey, setShareKey] = useState<string>("");

  sendChannel.addEventListener("open", onSendChannelOpen);
  sendChannel.addEventListener("close", onSendChannelClosed);

  function onSendChannelOpen() {
    console.log("Send channel is open");
    uploadFiles();
    sendChannel.addEventListener("bufferedamountlow", (e) => {
      console.log("BufferedAmountLow event:", e);
    });
  }

  function onSendChannelClosed() {
    console.log("Send channel is closed");
    pc.close();
    console.log("Closed local peer connection");
  }

  const uploadFiles = () => {
    const fileReader = new FileReader();
    console.log("tobeuploadedfiles", toBeUploadedFiles);
    toBeUploadedFiles.forEach((file) => {
      readFile(file).then((fileArrayBuffer: any) => {
        const CHUNK_SIZE = 5000;
        const totalChunks = fileArrayBuffer.byteLength / CHUNK_SIZE;
        let CHUNK = fileArrayBuffer.slice(0, CHUNK_SIZE);
        CHUNK.type = "start";
        sendChannel.send(CHUNK);
        for (let i = 1; i < totalChunks; i++) {
          CHUNK = fileArrayBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          sendChannel.send(CHUNK);
        }
        CHUNK = fileArrayBuffer.slice(
          totalChunks * CHUNK_SIZE,
          (totalChunks + 1) * CHUNK_SIZE
        );
        console.log(CHUNK.type);
        CHUNK.type = "end";
        console.log(CHUNK.type);

        sendChannel.send(CHUNK);
      });
    });
    setToBeUploadedFiles([]);
  };

  return (
    <>
      <h1>SEND SECURE</h1>
      <DropzoneArea
        // showPreviews={true}
        showPreviewsInDropzone
        // useChipsForPreview
        filesLimit={7}
        previewText="Selected files"
        onChange={setToBeUploadedFiles}
        maxFileSize={2147483648}
      />
      <Button
        onClick={async () => {
          console.log("sdfs");
          // eslint-disable-next-line @typescript-eslint/no-shadow
          createOffer(pc, db, toBeUploadedFiles).then((urlKey) => {
            setShareKey("urlKey");
          });
        }}
      >
        create a share link
      </Button>
      {/* <Button
        onClick={() => {
          uploadFiles();
        }}
      >
        uploadFiles
      </Button> */}
      <br />
      <br />
      {urlKey && (
        <h2>
          Share the link: {window.location.href}recieve/{urlKey}
        </h2>
      )}
    </>
  );
}

export default SendPage;
