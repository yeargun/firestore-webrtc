import { MESSAGE, env } from "send-secure";
import QRCode from "qrcode.react";
import axios from "axios";
import { remToPx } from "../../utils.js";
import { DropzoneArea } from "material-ui-dropzone";
import { useRef, useState } from "react";
import { readFile } from "../../File";
import { CHUNK_SIZE, RTCconfig, dataChannelOptions } from "../../Config";
import Header from "../Header/Header";
import "./SendPage.css";
import { useHref } from "react-router-dom";
import Share from "../Share";
const pc = new RTCPeerConnection(RTCconfig);
const sendChannel = pc.createDataChannel("sendDataChannel", dataChannelOptions);

const shareButtonStyles = {
  background: "black",
  fontSize: "1.5rem",
};

function SendPage() {
  const wsConnectionRef = useRef(null);
  const [toBeUploadedFiles, setToBeUploadedFiles] = useState<File[]>([]);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [uuid, setUuid] = useState(null);
  const [receiver, setReceiver] = useState(null);
  // #
  const basename = useHref("/");

  console.log("basename this", basename);
  // # listen for remote answer
  const senderMessageHandler = async (message) => {
    const data = JSON.parse(message.data);
    console.log(data);
    switch (data.type) {
      case MESSAGE.RECEIVER.CONNECTION_REQUEST:
        console.log(
          "Connection request received. Receiver info:",
          data.receiver
        );
        setReceiver(data.receiver);
        sendOfferWhenRecieverConnected(toBeUploadedFiles);
        break;
      case MESSAGE.RECEIVER.ANSWER:
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDescription);
        console.log("Answer received");
        break;
      default:
        break;
    }
  };

  const sendOfferWhenRecieverConnected = async (fileList: File[]) => {
    console.log("dd ", wsConnectionRef.current);

    if (wsConnectionRef.current) {
      console.log("ws conn is open");
      pc.onicecandidate = (event) => {
        event.candidate &&
          wsConnectionRef.current.send(
            JSON.stringify({
              type: MESSAGE.SENDER.CANDIDATE,
              candidate: event.candidate,
            })
          );
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
      console.log("offer this", offer);

      wsConnectionRef.current.send(
        JSON.stringify({
          type: MESSAGE.SENDER.OFFER,
          offer,
          metadata,
        })
      );
    }
  };

  const getUuid = async () => {
    try {
      const res = await axios.post(`https://${env.SIGNALING_SERVER}/uuid`);
      const resUuid = res.data.uuid;
      setUuid(resUuid);
      console.log("got this uuid", resUuid);
      return resUuid;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };

  const createWebSocket = async (pc: RTCPeerConnection) => {
    const createdUuid = await getUuid();
    console.log("res uiid", createdUuid);
    let wsConnection = new WebSocket(
      `wss://${env.SIGNALING_SERVER}/send/${createdUuid}`
    );
    wsConnectionRef.current = wsConnection;

    console.log(
      `Connected to wss://${env.SIGNALING_SERVER}/send/${createdUuid}`
    );
    wsConnectionRef.current.onmessage = senderMessageHandler;
  };

  const shareLink = `https://${window.location.host}${basename}receive/${uuid}`;

  const onSendChannelOpen = () => {
    console.log("uploading files atm");
    // uploadFile2(toBeUploadedFiles[0]);
    uploadFiles();
    sendChannel.addEventListener("bufferedamountlow", (e) => {});
  };

  const onSendChannelClosed = () => {
    console.log("Send channel is closed");
    pc.close();
  };

  sendChannel.addEventListener("open", onSendChannelOpen);
  sendChannel.addEventListener("close", onSendChannelClosed);

  const uploadFile2 = async (tobeUploaded) => {
    // Set the chunk size to 64 KB (can be adjusted based on the application's needs)
    const chunkSize = 64 * 1024;

    // Calculate the total number of chunks for the file
    const numChunks = Math.ceil(tobeUploaded.size / chunkSize);

    // Send the file name and size as the first message
    sendChannel.send(
      JSON.stringify({ name: tobeUploaded.name, size: tobeUploaded.size })
    );

    // Loop through each chunk and send it over the data channel
    for (let i = 0; i < numChunks; i++) {
      // Calculate the byte offset for the current chunk
      const offset = i * chunkSize;

      // Read the chunk from the file
      const chunk = await tobeUploaded
        .slice(offset, offset + chunkSize)
        .arrayBuffer();

      // Send the chunk over the data channel
      sendChannel.send(chunk);

      // If the confirmation is not received, retransmit the chunk
      if (sendChannel.readyState !== "open") {
        i--; // retry sending the same chunk
      }
    }

    // Once all the chunks have been sent and received successfully, the file transfer is complete
    console.log("File transfer complete");
  };

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

  return (
    <div className="page">
      <Header />
      <div className="container">
        <DropzoneArea
          showPreviewsInDropzone
          filesLimit={7}
          previewText="Selected files"
          onChange={setToBeUploadedFiles}
          maxFileSize={2147483648}
        />
        <h3 className="uploadPercentageSend">
          Upload percentage {uploadPercentage}%
        </h3>
        <button
          className="shareFileButton"
          onClick={async () => {
            await createWebSocket(pc);
          }}
        >
          create a share link
        </button>
        <div className="FileUploadDetails">
          {uuid && (
            <>
              <div className="qrCodeWrapper">
                <QRCode size={remToPx(13)} value={shareLink} />
              </div>
              <Share style={shareButtonStyles} link={shareLink} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendPage;
