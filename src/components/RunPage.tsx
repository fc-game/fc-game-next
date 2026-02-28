import React, { Component } from "react";
import ControlsModal from "@/src/components/ControlsModal";
import Emulator from "@/src/components/Emulator";
import Footer from "@/src/components/Footer";
import RomLibrary from "@/src/utitl/RomLibrary";
import { loadBinary } from "@/src/utitl/Utils";

const withOrientation = (WrappedComponent: any) => {
  interface OrientationState {
    orientation: "landscape" | "portrait";
  }

  return class extends Component<any, OrientationState> {
    constructor(props: any) {
      super(props);
      this.state = {
        orientation:
          window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      };
    }

    componentDidMount() {
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("orientationchange", this.handleResize);
    }

    componentWillUnmount() {
      window.removeEventListener("resize", this.handleResize);
      window.removeEventListener("orientationchange", this.handleResize);
    }

    handleResize = () => {
      const orientation =
        window.innerWidth > window.innerHeight ? "landscape" : "portrait";
      this.setState({ orientation });
    };

    render() {
      return (
        <WrappedComponent
          {...this.props}
          orientation={this.state.orientation}
        />
      );
    }
  };
};

interface RunPageProps {
  orientation: "landscape" | "portrait";
  match: {
    params: {
      slug: string;
    };
  };
  location: {
    pathname: string;
    state?: {
      file?: File;
    };
  };
  history: {
    push: (path: string) => void;
  };
}

interface RunPageState {
  romName: string | null;
  romData: any;
  running: boolean;
  paused: boolean;
  controlsModalOpen: boolean;
  settingModalOpen: boolean;
  loading: boolean;
  loadedPercent: number;
  error: string | null;
  homeApplicationIdJson: any;
  postApplicationIdJson: any;
  breadcrumbListApplicationIdJson: any;
  isMobile: boolean | null;
  isFullscreen: boolean;
}

class RunPage extends Component<RunPageProps, RunPageState> {
  private navbarRef: React.RefObject<HTMLDivElement | null>;
  private screenContainerRef: React.RefObject<HTMLDivElement | null>;
  private emulatorRef: React.RefObject<any | null>;
  private currentRequestRef: React.RefObject<XMLHttpRequest | null>;

  constructor(props: any) {
    super(props);
    this.state = {
      romName: null,
      romData: null,
      running: false,
      paused: false,
      controlsModalOpen: false,
      settingModalOpen: false,
      loading: true,
      loadedPercent: 0,
      error: null,
      homeApplicationIdJson: {},
      postApplicationIdJson: {},
      breadcrumbListApplicationIdJson: {},
      isMobile: true,
      isFullscreen: false,
    };

    this.navbarRef = React.createRef();
    this.screenContainerRef = React.createRef();
    this.emulatorRef = React.createRef();
    this.currentRequestRef = React.createRef();
  }

  componentDidMount() {
    this.layout();
    this.load();
  }

  componentWillUnmount() {
    if (this.currentRequestRef.current) {
      this.currentRequestRef.current.abort();
    }
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.orientation !== prevProps.orientation) {
      this.layout();
    }
  }

  layout = () => {
    let isMobile = true;
    if (typeof window === "undefined") {
      this.setState({ isMobile: null });
    } else {
      const ua = navigator.userAgent;
      isMobile =
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
        (/iPad|Macintosh/i.test(ua) && "ontouchend" in document);
      this.setState({ isMobile: isMobile || false });
    }

    if (!this.navbarRef.current || !this.screenContainerRef.current) return;

    const { orientation } = this.props;

    if (!isMobile) {
      this.screenContainerRef.current.style.height = `${
        window.innerHeight - 200
      }px`;
    } else if (orientation === "landscape") {
      if (this.emulatorRef.current?.screen?.current?.height) {
        this.screenContainerRef.current.style.height = `${this.emulatorRef.current.screen.current.height}px`;
      } else {
        this.screenContainerRef.current.style.height = `${window.innerHeight}px`;
      }
    }

    if (this.emulatorRef.current) {
      this.emulatorRef.current.fitInParent();
    }
  };

  handleLoaded = (data: any) => {
    this.setState({
      running: true,
      loading: false,
      romData: data,
    });
  };

  handleProgress = (e: any) => {
    if (e.lengthComputable) {
      this.setState({ loadedPercent: (e.loaded / e.total) * 100 });
    }
  };

  load = () => {
    const { match, location } = this.props;

    if (match.params.slug) {
      const rawSlug = String(match.params.slug);
      let slug = rawSlug;
      try {
        slug = decodeURIComponent(rawSlug);
      } catch {
        slug = rawSlug;
      }
      const isLocalROM = /^local-/.test(slug);
      const romHash = slug.split("-")[1];
      const romInfo = isLocalROM ? RomLibrary.getRomInfoByHash(romHash) : slug;

      // google analytics
      document.title = `Family Computer Games - ${String(slug).replaceAll(
        "_",
        " ",
      )}`;
      if (window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!, {
          page_path: location.pathname,
        });
      }

      if (!romInfo) {
        this.setState({ error: `ROM Not Exist: ${slug}` });
        return;
      }

      if (isLocalROM) {
        this.setState({ romName: romInfo.name });
        const localROMData = localStorage.getItem("blob-" + romHash);
        this.handleLoaded(localROMData);
      } else {
        this.setState({
          romName: romInfo,
          postApplicationIdJson: {
            "@context": "http://schema.org",
            "@type": "website",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://fc-game.github.io/#/run/${romInfo}`,
            },
            headline: `Family Computer Games - ${romInfo}`,
            description: `FC Game - ${romInfo}`,
            publisher: {
              "@type": "Person",
              name: "Family Computer Games",
            },
            author: {
              url: "https://github.com/MADAOU",
              "@type": "Person",
              name: "Seiriryu",
            },
          },
          homeApplicationIdJson: {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
          },
          breadcrumbListApplicationIdJson: {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  name: "home",
                  "@id": "https://fc-game.github.io",
                },
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  name: `${romInfo}`,
                  "@id": `https://fc-game.github.io/#/run/${romInfo}`,
                },
              },
            ],
          },
        });

        this.currentRequestRef.current = loadBinary(
          `${romInfo}.nes`,
          (err: any, data: any) => {
            if (err) {
              this.setState({ error: `ROM Load failed: ${err.message}` });
            } else {
              this.handleLoaded(data);
            }
          },
          this.handleProgress,
        );
      }
    } else if (location.state && location.state.file) {
      let reader = new FileReader();
      reader.readAsBinaryString(location.state.file);
      reader.onload = (e) => {
        this.currentRequestRef.current = null;
        this.handleLoaded(reader.result);
      };
    } else {
      this.setState({ error: "ROM not Provided!!!" });
    }
  };

  handleBack = () => {
    this.props.history.push("/");
  };

  handlePauseResume = () => {
    this.setState((prevState: any) => ({ paused: !prevState.paused }));
  };

  toggleControlsModal = () => {
    this.setState((prevState: any) => ({
      controlsModalOpen: !prevState.controlsModalOpen,
    }));
  };

  toggleSettingModal = () => {
    this.setState((prevState: any) => ({
      settingModalOpen: !prevState.settingModalOpen,
    }));
  };

  setupFullscreenListeners = () => {
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );
    document.addEventListener(
      "msfullscreenchange",
      this.handleFullscreenChange,
    );
  };

  removeFullscreenListeners = () => {
    document.removeEventListener(
      "fullscreenchange",
      this.handleFullscreenChange,
    );
    document.removeEventListener(
      "webkitfullscreenchange",
      this.handleFullscreenChange,
    );
    document.removeEventListener(
      "msfullscreenchange",
      this.handleFullscreenChange,
    );
  };

  handleFullscreenChange = () => {
    this.setState({
      isFullscreen: !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      ),
    });
  };

  enterFullscreen = async () => {
    const element = this.screenContainerRef.current || document.documentElement;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error("全屏请求失败:", error);
    }
  };

  exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error("退出全屏失败", error);
    }
  };

  toggleFullscreen = () => {
    if (
      !document.fullscreenElement &&
      !(document as any).webkitFullscreenElement &&
      !(document as any).msFullscreenElement
    ) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  };

  render() {
    const {
      romName,
      romData,
      running,
      paused,
      controlsModalOpen,
      settingModalOpen,
      loading,
      loadedPercent,
      error,
      homeApplicationIdJson,
      postApplicationIdJson,
      breadcrumbListApplicationIdJson,
      isMobile,
    } = this.state;

    const { orientation } = this.props;
    const isLandscape = orientation === "landscape";

    return (
      <>
        <div className="run-page">
          {/* description */}
          <meta
            name="description"
            content={`Family Computer Games - ${String(romName).replaceAll(
              "_",
              " ",
            )}`}
          />
          <meta
            property="og:description"
            content={`Family Computer Games - ${String(romName).replaceAll(
              "_",
              " ",
            )}`}
          />
          <meta
            name="twitter:description"
            content={`Family Computer Games - ${String(romName).replaceAll(
              "_",
              " ",
            )}`}
          />
          {/* Open Graph / Facebook */}
          <meta content="Family Computer Games" property="og:site_name" />
          <meta
            content={`https://fc-game.github.io/run/${romName}`}
            property="og:url"
          />
          <meta content="website" property="og:type" />
          {/* Twitter */}
          <meta content="@Seiriryu" name="twitter:site" />
          <meta content="@Seiriryu" name="twitter:creator" />
          <meta content="summary_large_image" name="twitter:card" />
          <meta content="https://fc-game.github.io" name="twitter:url" />
          <meta content="https://fc-game.github.io" name="twitter:domain" />
          <meta
            content={`Family Computer Games - ${String(romName).replaceAll(
              "_",
              " ",
            )}`}
            name="twitter:title"
          />
          <meta content="fcgames,game,FamilyComputerGames" name="keywords" />
          {/* JSON+Id */}
          <script type="application/ld+json">
            {JSON.stringify(homeApplicationIdJson)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(postApplicationIdJson)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbListApplicationIdJson)}
          </script>

          <div
            className={isMobile && isLandscape ? "" : "play-container"}
            ref={this.navbarRef}
          >
            <div className={isMobile && isLandscape ? "" : "game-launcher"}>
              {isMobile ? null : (
                <div className="game-header">
                  <div className="col">
                    <h2 className="game-title">
                      {String(romName).replaceAll("_", " ")}
                    </h2>
                  </div>
                </div>
              )}
              {error ? (
                <div className="screen-container">
                  <p className="status-value">{error}</p>
                </div>
              ) : (
                <div
                  className={isMobile && isLandscape ? "" : "screen-container"}
                  ref={this.screenContainerRef}
                >
                  {loading ? (
                    <div>
                      <div className="progress-container">
                        <div className="progress-label">
                          <span id="progress-percent">
                            {loadedPercent.toFixed()}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            id="progress-fill"
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : romData ? (
                    <Emulator
                      romData={romData}
                      paused={paused}
                      ref={this.emulatorRef}
                      isMobile={isMobile}
                      isLandscape={isLandscape}
                      onError={(msg: string) => this.setState({ error: msg })}
                    />
                  ) : null}
                  {controlsModalOpen && (
                    <ControlsModal
                      isOpen={controlsModalOpen}
                      toggle={this.toggleControlsModal}
                      keys={this.emulatorRef.current?.keyboardController?.keys}
                      setKeys={
                        this.emulatorRef.current?.keyboardController?.setKeys
                      }
                      promptButton={
                        this.emulatorRef.current?.gamepadController
                          ?.promptButton
                      }
                      gamepadConfig={
                        this.emulatorRef.current?.gamepadController
                          ?.gamepadConfig
                      }
                      setGamepadConfig={
                        this.emulatorRef.current?.gamepadController
                          ?.setGamepadConfig
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="settings-gear" onClick={this.toggleSettingModal}>
          <div className="gear-icon">
            <i className="fas fa-cog"></i>
          </div>
        </div>

        <div className="back" onClick={this.handleBack}>
          <div className="gear-icon">
            <i className="fas fa-angle-left"></i>
          </div>
        </div>
        {/* setting modal */}
        <div
          className={
            settingModalOpen ? "settings-panel active" : "settings-panel"
          }
        >
          <div className="settings-header">
            <div className="settings-title">Setting</div>
            <button
              className="close-btn"
              onClick={() => {
                this.setState({ settingModalOpen: false });
              }}
            >
              ×
            </button>
          </div>

          <div className="settings-options">
            {isMobile ? null : (
              <div
                className="setting-option"
                onClick={this.toggleControlsModal}
              >
                <div className="option-icon">⌨️</div>
                <div className="option-text">Keyboard</div>
              </div>
            )}
            <button
              className="setting-option"
              onClick={this.handlePauseResume}
              disabled={!running}
            >
              <div className="option-icon">🎮</div>
              <div className="option-text">{paused ? "Continue" : "Pause"}</div>
            </button>

            <div className="setting-option" onClick={this.toggleFullscreen}>
              <div className="option-icon">[ ]</div>
              <div className="option-text">
                {this.state.isFullscreen
                  ? "Exit Fullscreen"
                  : "Enter Fullscreen"}
              </div>
            </div>
          </div>
        </div>
        {isMobile ? null : <Footer />}
      </>
    );
  }
}

export default withOrientation(RunPage);
