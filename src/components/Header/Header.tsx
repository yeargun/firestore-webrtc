import "./Header.css";

function Header() {
  const homePageLink = location.protocol + "//" + location.host;
  return (
    <>
      <a className="sendSecure" href={homePageLink}>
        Send Secure
      </a>
      <hr />
    </>
  );
}

export default Header;
