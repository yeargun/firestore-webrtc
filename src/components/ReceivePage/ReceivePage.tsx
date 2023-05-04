import { useEffect, useState } from "react";
import { humanFileSize, saveFile, fileDownloadPercentage } from "../../File";
import { RTCconfig } from "../../Config";
import Header from "../Header/Header";
import { MESSAGE, env } from "send-secure";
import "./ReceivePage.css";
import { useParams } from "react-router-dom";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

const pc = new RTCPeerConnection(RTCconfig);

let buffer: any[] = [];

function ReceivePage() {
  const [messages, setMessages] = useState([]);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata>({
    name: "",
    size: 0,
    type: "",
  });
  const [downloadPercentage, setDownloadPercentage] = useState(0);
  const { uuid } = useParams();
  const [uuidState, setUuidState] = useState(null);
  const [messageCurrentTarget, setMessageCurrentTarget] = useState();

  useEffect(() => {
    console.log("uuid atm", uuid);
    setUuidState(uuid);
    connectToSocket();
  }, [uuid]);

  const receiverMessageHandler = async (message) => {
    console.log("msg", message);
    const data = JSON.parse(message.data);
    console.log(data);

    setMessageCurrentTarget(message?.currentTarget);
    switch (data.type) {
      case MESSAGE.SENDER.OFFER:
        console.log("Offer received", data.offer);
        setFileMetadata(data.metadata);

        pc.ondatachannel = (event) => {
          const recieveChannel = event.channel;
          recieveChannel.onmessage = handleRecieveMessage;
        };
        await pc.setRemoteDescription(data.offer);

        break;
      case MESSAGE.SENDER.CANDIDATE:
        console.log("Candidate received");
        await pc.addIceCandidate(data.candidate);
        break;
      default:
        break;
    }
  };

  const signalStartUploading = async () => {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    messageCurrentTarget?.send(
      JSON.stringify({ type: MESSAGE.RECEIVER.ANSWER, answer })
    );
  };

  const connectToSocket = () => {
    const connection = new WebSocket(
      `wss://${env.SIGNALING_SERVER}/receive/${uuid}`
    );
    console.log(`Connected to wss://${env.SIGNALING_SERVER}/receive/${uuid}`);
    connection.onmessage = receiverMessageHandler;
  };

  const handleRecieveMessage = (e: { data: any }) => {
    buffer.push(e.data);
    setDownloadPercentage(fileDownloadPercentage(fileMetadata?.size, buffer));
  };

  const transferHasStarted = downloadPercentage > 0;
  const haveProblemsWithConnectingPeer = fileMetadata.size === 0;

  return (
    <div className="page">
      <Header />
      <div className="container">
        {haveProblemsWithConnectingPeer ? (
          <p className="connectionProblemText">
            Problems connecting with the peer. Please wait...
          </p>
        ) : (
          <p className="wannaDownload">
            Wanna download the file <b>{fileMetadata?.name}</b> which is
            <b> {humanFileSize(fileMetadata?.size)}</b> in size ?
          </p>
        )}

        {transferHasStarted && (
          <>
            <h3 className="uploadPercentageRecieve">
              File download percentage {downloadPercentage}%
            </h3>
            <button
              className="saveFileButton"
              onClick={() => {
                saveFile(fileMetadata, buffer);
              }}
            >
              Save File
            </button>
          </>
        )}

        {!transferHasStarted && !haveProblemsWithConnectingPeer && (
          <button
            className="yesButton"
            onClick={() => {
              signalStartUploading();
            }}
          >
            yes
          </button>
        )}
      </div>
    </div>
  );
}

export default ReceivePage;
