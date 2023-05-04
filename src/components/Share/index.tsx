import { Whatsapp, Mail, Telegram } from "react-social-sharing";
import CopyToClipboard from "./CopyToClipboard";

function Share(props) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Whatsapp {...props} />
      <Mail
        solid
        small
        subject="Send Secure | Want to share a file with you"
        {...props}
      />
      <Telegram {...props} />
      <CopyToClipboard {...props} />
    </div>
  );
}

export default Share;
