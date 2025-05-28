import React from "react";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer className="footer-bar">
      <Container>
        <div className="footer-content">
          <p className="footer-text">
            © {new Date().getFullYear()} Hawaiian Community Assets
          </p>
          <p className="footer-text small">
            Developed by
            <a href="https://nakamurawebservices.com" target="_blank"> Nakamura Web Services</a>
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
