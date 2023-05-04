import { useState } from "react";
import clipboardImg from "../../assets/copy.png";
import "./CopyToClipboard.css";

function CopyToClipboard({ link }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <a className="iconWrapper" onClick={handleCopyClick} href={link}>
      <img
        draggable="false"
        src={clipboardImg}
        alt="copy2clipboard"
        height={"25rem"}
      />

      {isCopied && <div className="copy-success-message">Copied!</div>}
    </a>
  );
}

export default CopyToClipboard;
