import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  onSnapshot,
  Firestore,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { useState } from "react";
import { Button } from "@mui/material";
import { humanFileSize } from "../File";
import { RTCconfig, firebaseConfig } from "../Config";

const pc = new RTCPeerConnection(RTCconfig);

const app = initializeApp(firebaseConfig);
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
        {humanFileSize(fileMetadata?.size)} Ok ?
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
