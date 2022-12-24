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
import { readFile } from "../../File";
import {
  CHUNK_SIZE,
  RTCconfig,
  firebaseConfig,
  dataChannelOptions,
} from "../../Config";
import Header from "../Header/Header";
import "./SendPage.css";
import clipboardImg from "../../assets/copy.png";

const pc = new RTCPeerConnection(RTCconfig);
const sendChannel = pc.createDataChannel("sendDataChannel", dataChannelOptions);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let urlKey = "";

const createSecureKey = () => {
  // mad security
  return Math.floor(Math.random() * 800000).toString();
};

const createOffer = async (
  pc: RTCPeerConnection,
  db: Firestore,
  fileList: File[]
) => {
  urlKey = createSecureKey();
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
  const [uploadPercentage, setUploadPercentage] = useState(0);

  const onSendChannelOpen = () => {
    uploadFiles();
    sendChannel.addEventListener("bufferedamountlow", (e) => {});
  };

  const onSendChannelClosed = () => {
    pc.close();
  };

  sendChannel.addEventListener("open", onSendChannelOpen);
  sendChannel.addEventListener("close", onSendChannelClosed);

  const uploadFiles = () => {
    toBeUploadedFiles.forEach((file) => {
      readFile(file).then((fileArrayBuffer: any) => {
        const totalChunks = fileArrayBuffer.byteLength / CHUNK_SIZE;
        let CHUNK = fileArrayBuffer.slice(0, CHUNK_SIZE);
        CHUNK.type = "start";
        sendChannel.send(CHUNK);
        for (let i = 1; i < totalChunks + 1; i++) {
          CHUNK = fileArrayBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          sendChannel.send(CHUNK);
          setUploadPercentage(Math.floor((i * 100) / totalChunks + 0.05));
        }
      });
    });
    setToBeUploadedFiles([]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href + "recieve/" + urlKey);
  };

  return (
    <>
      <Header />
      <div className="container">
        <DropzoneArea
          showPreviewsInDropzone
          filesLimit={7}
          previewText="Selected files"
          onChange={setToBeUploadedFiles}
          maxFileSize={2147483648}
        />
        <button
          className="shareFileButton"
          onClick={async () => {
            createOffer(pc, db, toBeUploadedFiles).then((urlKey) => {
              setShareKey("urlKey");
            });
          }}
        >
          create a share link
        </button>

        <br />
        <br />
        <div className="FileUploadDetails">
          {urlKey && (
            <>
              <div className="linkGroup">
                <h2
                  className="shareLink"
                  onClick={() => {
                    copyToClipboard();
                  }}
                >
                  {window.location.href}recieve/{urlKey}
                </h2>
                <div className="verticalLine"></div>
                <img
                  onClick={() => {
                    copyToClipboard();
                  }}
                  draggable="false"
                  className="clipboardImg"
                  src={clipboardImg}
                  alt="copy2clipboard"
                />
              </div>
              <h3 className="uploadPercentageSend">
                Upload percentage {uploadPercentage}%
              </h3>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SendPage;
