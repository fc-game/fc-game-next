import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-column">
          <h3>About Us</h3>
          <p>
            FC-GAME is dedicated to providing the best online gaming
            experience, allowing players to enjoy a wide variety of games.
          </p>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li>
              <a
                href="https://html-online-game.github.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="label">Html Online Game</span>
              </a>
            </li>
            <li>
              <a
                href="https://pixel-wallpaper.github.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="label">Pixel Wallpaper</span>
              </a>
            </li>
            <li>
              <a
                href="https://chrome-tool.github.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="label">Chrome Extension</span>
              </a>
            </li>
          </ul>
        </div>

        {/* 注释掉的帮助部分 - 可以根据需要取消注释 */}
        {/* 
        <div className="footer-column">
          <h3>Help</h3>
          <ul className="footer-links">
            <li>
              <a href="#">FAQ</a>
            </li>
            <li>
              <a href="#">Contact Us</a>
            </li>
            <li>
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#">Terms of Use</a>
            </li>
          </ul>
        </div> 
        */}

        <div className="footer-column"></div>
      </div>
      <div className="copyright">
        <p>&copy; {new Date().getFullYear()} FC GAME. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;