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
import { useState, React } from "react";
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
sendChannel.addEventListener("open", onSendChannelOpen);
sendChannel.addEventListener("close", onSendChannelClosed);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
let testCallName = "";
// 2. create an offer
const createOffer = async (pc: RTCPeerConnection, db: Firestore) => {
  testCallName = Math.floor(Math.random() * 10000).toString();
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
    console.log("doc.data()", data);
    console.log("answered fr");
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

function onSendChannelOpen() {
  console.log("Send channel is open");

  sendChannel.addEventListener("bufferedamountlow", (e) => {
    console.log("BufferedAmountLow event:", e);
  });

  sendChannel.send("stfu please");
}

function onSendChannelClosed() {
  console.log("Send channel is closed");
  pc.close();
  console.log("Closed local peer connection");
}

var yourConnection,
  connectedUser,
  dataChannel,
  currentFile,
  currentFileSize,
  currentFileMeta;

function SendPage() {
  const [toBeUploadedFiles, setToBeUploadedFiles] = useState([]);
  let [messages, setMessages] = useState([]);
  console.log("pc", pc);

  const sendMessage = () => {
    sendChannel.send("sender sending this");

    setMessages(
      (messages = [...messages, { yours: true, value: "sender sending this" }])
    );
  };
  function base64ToBlob(b64Data, contentType) {
    contentType = contentType || "";

    var byteArrays = [],
      byteNumbers,
      slice;

    for (var i = 0; i < b64Data.length; i++) {
      slice = b64Data[i];

      byteNumbers = new Array(slice.length);
      for (var n = 0; n < slice.length; n++) {
        byteNumbers[n] = slice.charCodeAt(n);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  const saveFile = (meta, data) => {
    var blob = base64ToBlob(data, meta.type);
    saveAs(blob, meta.name);
  };

  const handleRecieveMessage = (e) => {
    setMessages([...messages, { yours: false, value: e.data }]);
    try {
      var message = JSON.parse(e.data);
      switch (message.type) {
        case "start":
          currentFile = [];
          currentFileSize = 0;
          currentFileMeta = message.data;
          console.log(message.data);
          console.log("Receiving file", currentFileMeta);
          break;
        case "end":
          saveFile(currentFileMeta, currentFile);
          break;
      }
    } catch (e) {
      // Assume this is file content
      currentFile.push(atob(event.data));

      currentFileSize += currentFile[currentFile.length - 1].length;

      var percentage = Math.floor(
        (currentFileSize / currentFileMeta.size) * 100
      );
    }
  };

  sendChannel.onmessage = handleRecieveMessage;

  sendChannel.addEventListener("open", (event) => {
    console.log("sended tihs messag:", JSON.stringify("HELLO IM PEER A."));
    sendChannel.send(JSON.stringify("HELLO IM PEER A."));
  });

  const uploadFiles = () => {
    const fileReader = new FileReader();
    console.log("tobeuploadedfiles", toBeUploadedFiles);
    toBeUploadedFiles.forEach((file) => {
      readFile(file).then((fileArrayBuffer) => {
        const CHUNK_SIZE = 5000;
        const totalChunks = fileArrayBuffer.byteLength / CHUNK_SIZE;
        for (let i = 0; i < totalChunks + 1; i++) {
          let CHUNK = fileArrayBuffer.slice(
            i * CHUNK_SIZE,
            (i + 1) * CHUNK_SIZE
          );
          sendChannel.send(CHUNK);
        }
      });
    });
  };

  return (
    <>
      <h1>SEND SECURE</h1>
      <DropzoneArea
        sx={{ position: "fixed" }}
        // showPreviews={true}
        showPreviewsInDropzone={true}
        // useChipsForPreview
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
          sendMessage();
        }}
      >
        sendMessage
      </Button>

      <Button
        onClick={() => {
          uploadFiles();
        }}
      >
        uploadFiles
      </Button>
      <br />
      <br />
      <h2>Share the link: http://127.0.0.1:5173/recieve/{testCallName}</h2>
    </>
  );
}

export default SendPage;
