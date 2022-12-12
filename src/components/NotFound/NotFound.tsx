import { Link } from "react-router-dom";

function NotFound() {
  return (
    <>
      <h1>not found page for real / error not right link</h1>
      <Link to="/send">go home</Link>
    </>
  );
}

export default NotFound;
