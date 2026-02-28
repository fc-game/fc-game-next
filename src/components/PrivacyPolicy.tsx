import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Header />
      <div className="privacy-container">
        <div className="privacy-header">
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">
            Family Computer Games - Your privacy is important to us
          </p>
          <div className="last-updated">
            <i className="fas fa-calendar-alt"></i>
            Last updated: October 11, 2025
          </div>
        </div>

        <div className="privacy-content">
          <div className="policy-section">
            <h2 className="section-title">
              <i className="fas fa-info-circle"></i> Introduction
            </h2>
            <div className="section-content">
              <p>
                If you require any more information or have any questions about
                our privacy policy, please feel free to contact us.
              </p>

              <div className="no-data-box">
                <div className="no-data-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3 className="no-data-title">We Value Your Privacy</h3>
                <p>
                  At FC-GAME, we are committed to protecting your privacy and
                  ensuring a safe gaming experience for all our users.
                </p>
              </div>
            </div>
          </div>

          <div className="policy-section">
            <h2 className="section-title">
              <i className="fas fa-database"></i> Collecting and Using Your
              Personal Data
            </h2>
            <div className="section-content">
              <h3 style={{ color: "var(--accent)", marginBottom: "1rem" }}>
                Personal Data
              </h3>
              <p>
                This website will not collect your personal information. The
                user's personal information is not used in this site and not
                provided to third parties.
              </p>

              <div className="highlight-box">
                <h4 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
                  Our Commitment
                </h4>
                <p>
                  We do not collect, store, or process any personally
                  identifiable information from our users. Your gaming
                  experience is completely anonymous.
                </p>
              </div>
            </div>
          </div>

          <div className="policy-section">
            <h2 className="section-title">
              <i className="fas fa-chart-bar"></i> Google Analytics
            </h2>
            <div className="section-content">
              <p>
                This website uses Google Analytics as an analysis tool, and
                Google Analytics has the possibility of automatically acquiring
                user information.
              </p>
              <p>
                Please refer to the privacy policy of Google Analytics for
                information acquired, the purpose of use, and the provision to
                the third party.
              </p>

              <div className="highlight-box">
                <h4 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
                  About Google Analytics
                </h4>
                <p>
                  Google Analytics collects anonymous usage data to help us
                  understand how visitors interact with our website. This
                  information is aggregated and cannot be used to identify
                  individual users.
                </p>
                <p>
                  For more information, please review the
                  <a
                    href="https://policies.google.com/privacy"
                    className="external-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Privacy Policy
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="policy-section">
            <h2 className="section-title">
              <i className="fas fa-cookie"></i> Tracking Technologies and
              Cookies
            </h2>
            <div className="section-content">
              <p>
                We do not use Cookies and similar tracking technologies on the
                website.
              </p>

              <div className="no-data-box">
                <div className="no-data-icon">
                  <i className="fas fa-cookie-bite"></i>
                </div>
                <h3 className="no-data-title">No Cookies Used</h3>
                <p>
                  Your browsing experience on FC-GAME is cookie-free. We believe
                  in providing a seamless experience without tracking your
                  activity.
                </p>
              </div>
            </div>
          </div>

          <div className="policy-section">
            <h2 className="section-title">
              <i className="fas fa-envelope"></i> Contact Us
            </h2>
            <div className="section-content">
              <p>
                If you have any questions about this Privacy Policy, you can
                contact us.
              </p>
              <p>
                *Please refer to the footer of this website for contact
                information.
              </p>

              <div className="contact-info">
                <div className="contact-card">
                  <div className="contact-icon">
                    <i className="fas fa-globe"></i>
                  </div>
                  <h3 className="contact-title">Website</h3>
                  <p>https://fc-game.github.io/</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
