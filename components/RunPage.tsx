"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ControlsModal from "@/components/ControlsModal";
import Emulator from "@/components/Emulator";
import Footer from "@/components/Footer";
import RomLibrary from "@/lib/romLibrary";
import { loadBinary } from "@/lib/utils";
import "@/styles/RunPage.css";

interface RunPageProps {
  slug?: string;
}

type Orientation = "portrait" | "landscape";

const RunPage: React.FC<RunPageProps> = (props) => {
  const { slug } = props;
  const router = useRouter();
  const [orientation, setOrientation] = useState<Orientation>(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight
      ? "landscape"
      : "portrait",
  );

  const [romName, setRomName] = useState<string | null>(null);
  const [romData, setRomData] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [controlsModalOpen, setControlsModalOpen] = useState(false);
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedPercent, setLoadedPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const navbarRef = useRef<HTMLDivElement | null>(null);
  const screenContainerRef = useRef<HTMLDivElement | null>(null);
  const emulatorRef = useRef<any>(null);
  const currentRequestRef = useRef<any>(null);

  /* ---------- orientation ---------- */
  useEffect(() => {
    const onResize = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      );
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  /* ---------- layout ---------- */
  const layout = useCallback(() => {
    const ua = navigator.userAgent;
    const mobile =
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (/iPad|Macintosh/i.test(ua) && "ontouchend" in document);

    setIsMobile(mobile);

    if (!screenContainerRef.current) return;

    if (!mobile) {
      screenContainerRef.current.style.height = `${window.innerHeight - 200}px`;
    } else if (orientation === "landscape") {
      screenContainerRef.current.style.height = `${window.innerHeight}px`;
    }

    emulatorRef.current?.fitInParent?.();
  }, [orientation]);

  useEffect(() => {
    layout();
  }, [layout]);

  /* ---------- load ROM ---------- */
  useEffect(() => {
    if (!slug) return;

    const isLocalROM = slug.startsWith("local-");
    const romHash = slug.split("-")[1];
    const romInfo = isLocalROM ? RomLibrary.getRomInfoByHash(romHash) : slug;

    document.title = `Family Computer Games - ${slug.replaceAll("_", " ")}`;

    if (!romInfo) {
      setError(`ROM Not Exist: ${slug}`);
      return;
    }

    if (isLocalROM) {
      setRomName(romInfo.name);
      const localData = localStorage.getItem("blob-" + romHash);
      setRomData(localData);
      setRunning(true);
      setLoading(false);
    } else {
      setRomName(romInfo);
      currentRequestRef.current = loadBinary(
        `${romInfo}.nes`,
        (err, data) => {
          if (err) {
            setError(`ROM Load failed: ${err.message}`);
          } else {
            setRomData(data as any);
            setRunning(true);
            setLoading(false);
          }
        },
        (e: ProgressEvent) => {
          if (e.lengthComputable) {
            setLoadedPercent((e.loaded / e.total) * 100);
          }
        },
      );
    }

    return () => {
      currentRequestRef.current?.abort?.();
    };
  }, [slug]);

  /* ---------- fullscreen ---------- */
  const toggleFullscreen = async () => {
    const el = screenContainerRef.current;
    if (!document.fullscreenElement) {
      await el?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  /* ---------- render ---------- */
  const isLandscape = orientation === "landscape";

  return (
    <>
      <div className="run-page">
        <div className="play-container" ref={navbarRef}>
          <div className="game-launcher">
            {!isMobile && (
              <div className="game-header">
                <div className="col">
                  <h2 className="game-title">
                    {decodeURI(String(romName)).replaceAll("_", " ")}
                  </h2>
                </div>
              </div>
            )}

            {error ? (
              <p className="status-value">{error}</p>
            ) : (
              <div className="screen-container" ref={screenContainerRef}>
                {loading ? (
                  <div className="progress-container">
                    <span>{loadedPercent.toFixed()}%</span>
                  </div>
                ) : (
                  romData && (
                    <Emulator
                      ref={emulatorRef}
                      romData={romData}
                      paused={paused}
                      isMobile={isMobile}
                      isLandscape={isLandscape}
                      onError={setError}
                    />
                  )
                )}

                {controlsModalOpen && (
                  <ControlsModal
                    isOpen
                    toggle={() => setControlsModalOpen((v) => !v)}
                    keys={emulatorRef.current?.keyboardController?.keys}
                    setKeys={emulatorRef.current?.keyboardController?.setKeys}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-gear" onClick={() => setSettingModalOpen(true)}>
        ⚙️
      </div>

      <div className="back" onClick={() => router.push("/")}>
        ←
      </div>

      <div className={`settings-panel ${settingModalOpen ? "active" : ""}`}>
        <button onClick={() => setPaused((p) => !p)}>
          {paused ? "Continue" : "Pause"}
        </button>
        <button onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </button>
      </div>

      {!isMobile && <Footer />}
    </>
  );
};

export default RunPage;
