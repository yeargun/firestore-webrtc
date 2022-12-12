import React from "react";
import {
  Box,
  Container,
  Row,
  Column,
  FooterLink,
  Heading,
} from "./FooterStyles";

const Footer = () => {
  return (
    <Box>
      <h1 style={{ color: "white", textAlign: "center", marginTop: "-50px" }}>
        Send Secure - Peer to peer secure file transfer app
      </h1>
      <Container>
        <Row>
          <Column>
            <Heading>About Us</Heading>
            <FooterLink href="">Aim</FooterLink>
          </Column>
          <Column>
            <Heading>Services</Heading>
            <FooterLink href="">webrtc 👍🏻</FooterLink>
          </Column>
          <Column>
            <Heading>Contact Us</Heading>
            <FooterLink href="">hacettepe cs</FooterLink>
          </Column>
          <Column>
            <Heading>source</Heading>
            <FooterLink href="">
              <i className="fab fa-youtube">
                <span style={{ marginLeft: "10px" }}>Github</span>
              </i>
            </FooterLink>
          </Column>
        </Row>
      </Container>
    </Box>
  );
};
export default Footer;
