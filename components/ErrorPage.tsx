"use client";

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useRouter } from "next/navigation";

const ErrorPage: React.FC = () => {
  const [currentSeconds, setCurrentSeconds] = useState(3);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSeconds((prevSeconds) => {
        if (prevSeconds > 1) {
          return prevSeconds - 1;
        } else {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
      });
    }, 1000);

    // 清理函数
    return () => {
      clearInterval(interval);
    };
  }, [router]);

  return (
    <>
      <Header />
      <div className="error-container">
        <div className="error-content">
          <p className="error-message">
            Game Load Error, The System Will Go Home Page in {currentSeconds}{" "}
            Seconds
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ErrorPage;