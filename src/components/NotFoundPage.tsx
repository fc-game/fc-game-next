"use client";

import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import { useRouter } from "next/navigation";

const NotFoundPage = () => {
  const router = useRouter();

  const navagatePage = (pageName: string) => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      router.push(pageName);
    };
  };

  return (
    <>
      <Header />
      <div className="error-container">
        <div className="error-content">
          <div className="error-animation">
            <div className="error-number glitch-effect">
              4<span style={{ color: "var(--accent)" }}>0</span>4
            </div>
          </div>

          <h1 className="error-title">Game Over - Page Not Found</h1>
          <p className="error-message">
            The page you're looking for has been devoured by dragons, lost in
            space, or simply doesn't exist. But don't worry, there are plenty of
            other adventures waiting for you!
          </p>

          <div className="action-buttons" onClick={navagatePage("/")}>
            <a href="/#" className="btn btn-primary">
              <i className="fas fa-home"></i> Back to Home
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFoundPage;
