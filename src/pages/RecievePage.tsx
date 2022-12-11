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

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { humanFileSize, saveFile, fileDownloadPercentage } from "../File";
import { RTCconfig, firebaseConfig } from "../Config";

const currUrlPath = window.location.href.substring(
  window.location.href.lastIndexOf("/") + 1
);

const pc = new RTCPeerConnection(RTCconfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  const senderFileShareOfferData = senderFileShareData?.offer;

  console.log("senderSDP ->", senderFileShareData);

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
let buffer: any[] = [];

function RecievePage() {
  const [messages, setMessages] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});
  const [downloadPercetange, setDownloadPercentage] = useState(0);

  useEffect(() => {
    const callDoc = doc(db, "calls", currUrlPath);
    getDoc(callDoc).then((res) => setFileMetadata(res.data()?.metadata));
  }, []);

  pc.ondatachannel = (event) => {
    const recieveChannel = event.channel;
    recieveChannel.onmessage = handleRecieveMessage;
    // recieveChannel.onclose = saveFile(fileMetadata, buffer);
  };

  const handleRecieveMessage = (e: { data: any }) => {
    buffer.push(e.data);
    setDownloadPercentage(fileDownloadPercentage(fileMetadata?.size, buffer));
    // console.log("buffer length:", buffer.length);
  };

  return (
    <>
      <h1>SEND SECURE</h1>
      <br />
      {Object.keys(fileMetadata).length === 0 ? (
        <br />
      ) : (
        <p>
          Wanna download the file <b>{fileMetadata?.name}</b> which has
          <b> {humanFileSize(fileMetadata?.size)}</b> size ?
        </p>
      )}
      <button
        onClick={() => {
          answerTransfer(pc, db, currUrlPath);
        }}
      >
        yes
      </button>

      <h3>File download percentage {downloadPercetange}%</h3>
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
