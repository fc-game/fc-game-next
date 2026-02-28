import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import RomLibrary from "@/src/utitl/RomLibrary";
import config from "@/src/config";

const ListPage = (props: any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDatas, setTotalDatas] = useState([]);
  const [searchDatas, setSearchDatas] = useState([]);
  const [currentPageDatas, setCurrentPageDatas] = useState([]);
  const [searchContent, setSearchContent] = useState(null);
  const searchInputRef: any = useRef(null);

  const updatePageQuery = (page: number) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    const next = `${url.pathname}?${url.searchParams.toString()}`;
    window.history.replaceState(null, "", next);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.items
      ? e.dataTransfer.items[0].getAsFile()
      : e.dataTransfer.files[0];

    RomLibrary.save(file).then((rom) => {
      props.history.push({ pathname: "/run/local-" + rom.hash });
    });
  };

  const getParam = (name: any, url: any) => {
    if (!url) url = window.location.href;
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    let results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  const showPage = useCallback(
    (currentPage: number, searchData = searchDatas, totalData = totalDatas) => {
      const first = (currentPage - 1) * pageSize + 1;
      const last = currentPage * pageSize;
      let currentPageData: any = [];

      const dataSource = searchData.length > 0 ? searchData : totalData;

      dataSource.forEach((item: any, i: any) => {
        if (i < first - 1 || i > last - 1) return;
        currentPageData.push(item);
      });

      setCurrentPageDatas(currentPageData);
    },
    [pageSize, searchDatas, totalDatas],
  );

  const navigationGamePageHandler = (e: any) => {
    const name = e.target.dataset.name;
    props.history.push("/run/" + encodeURIComponent(name));
  };

  const changePage = (e: any) => {
    const val = e.target.dataset.value;
    let newCurrentPage: number = 1;
    try {
      if (val === "-1") {
        newCurrentPage = currentPage === 1 ? 1 : currentPage - 1;
      } else if (val === "+1") {
        newCurrentPage =
          currentPage === totalPages ? totalPages : currentPage + 1;
      } else {
        newCurrentPage = Number(val);
      }
    } catch (e) {
      newCurrentPage = 1;
    }

    sessionStorage.setItem("currentPage", String(newCurrentPage));
    setCurrentPage(newCurrentPage);
    updatePageQuery(newCurrentPage);
    showPage(newCurrentPage);
  };

  const onchangeHadler = (e: any) => {
    setSearchContent(e.target.value);
  };

  const onKeyDownHandler = (e: any) => {
    if (e.keyCode === 13) {
      searchHandler(e);
    }
  };

  const searchHandler = (e: any) => {
    const searchContentValue = searchInputRef.current.value;

    sessionStorage.setItem("searchContent", searchContentValue);
    const newSearchDatas = totalDatas.filter(
      (el: any) =>
        el.game_name
          ?.toLowerCase()
          .includes(searchContentValue.trim().toLowerCase()) ||
        el.description
          ?.toLowerCase()
          .includes(searchContentValue.trim().toLowerCase()) ||
        el.developer
          ?.toLowerCase()
          .includes(searchContentValue.trim().toLowerCase()) ||
        el.platform
          ?.toLowerCase()
          .includes(searchContentValue.trim().toLowerCase()) ||
        el.genre
          ?.toLowerCase()
          .includes(searchContentValue.trim().toLowerCase()),
    );

    const first = 1;
    const last = pageSize;
    let newTotalPages = 1;
    let newCurrentPageDatas: any = [];

    if (newSearchDatas.length > 0) {
      newSearchDatas.forEach((item: any, i: any) => {
        if (i < first - 1 || i > last - 1) return;
        newCurrentPageDatas.push(item);
      });
      newTotalPages =
        Math.ceil(newSearchDatas.length / pageSize) < 1
          ? 1
          : Math.ceil(newSearchDatas.length / pageSize);
    } else if (!searchContentValue) {
      totalDatas.forEach((item: any, i: any) => {
        if (i < first - 1 || i > last - 1) return;
        newCurrentPageDatas.push(item);
      });
      newTotalPages =
        Math.ceil(totalDatas.length / pageSize) < 1
          ? 1
          : Math.ceil(totalDatas.length / pageSize);
    }

    sessionStorage.setItem("currentPage", "1");
    updatePageQuery(1);

    setSearchContent(searchContentValue);
    setSearchDatas(newSearchDatas);
    setTotalPages(newTotalPages);
    setCurrentPage(1);
    setCurrentPageDatas(newCurrentPageDatas);
  };

  useEffect(() => {
    // google analytics
    document.title = "Family Computer Games";
    if (window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!, {
        page_path: props.location.pathname,
      });
    }

    let initialCurrentPage = sessionStorage.getItem("currentPage")
      ? Number(sessionStorage.getItem("currentPage"))
      : 1;

    const initialTotalDatas: any = [];
    Object.entries(config.ROMS).forEach((val: any, idx: any) => {
      initialTotalDatas.push({
        no: idx + 1,
        name: String(val[0]),
        game_name: String(val[0]).replaceAll("_", " "),
        description: val[1].description,
        developer: val[1].developer,
        platform: val[1].platform,
        genre: val[1].genre,
      });
    });

    const initialSearchContent: any = sessionStorage.getItem("searchContent");
    let initialSearchDatas = [];
    if (initialSearchContent) {
      initialSearchDatas = initialTotalDatas.filter(
        (el: any) =>
          el.game_name
            ?.toLowerCase()
            .includes(initialSearchContent.trim().toLowerCase()) ||
          el.description
            ?.toLowerCase()
            .includes(initialSearchContent.trim().toLowerCase()) ||
          el.developer
            ?.toLowerCase()
            .includes(initialSearchContent.trim().toLowerCase()) ||
          el.platform
            ?.toLowerCase()
            .includes(initialSearchContent.trim().toLowerCase()) ||
          el.genre
            ?.toLowerCase()
            .includes(initialSearchContent.trim().toLowerCase()),
      );
    }

    const initialTotalPages =
      initialSearchDatas.length > 0
        ? Math.ceil(initialSearchDatas.length / pageSize) < 1
          ? 1
          : Math.ceil(initialSearchDatas.length / pageSize)
        : Math.ceil(initialTotalDatas.length / pageSize) < 1
          ? 1
          : Math.ceil(initialTotalDatas.length / pageSize);

    const page = Number(getParam("page", null));
    if (page) {
      if (isNaN(page) || page < 1) {
        initialCurrentPage = 1;
      } else if (page > initialTotalPages) {
        initialCurrentPage = initialTotalPages;
      } else {
        initialCurrentPage = page;
      }
    }
    updatePageQuery(initialCurrentPage);

    const first = (initialCurrentPage - 1) * pageSize + 1;

    const last = initialCurrentPage * pageSize;

    let initialCurrentPageDatas: any = [];

    const dataSource =
      initialSearchDatas.length > 0 ? initialSearchDatas : initialTotalDatas;
    dataSource.forEach((item: any, i: any) => {
      if (i < first - 1 || i > last - 1) return;
      initialCurrentPageDatas.push(item);
    });

    setTotalDatas(initialTotalDatas);
    setSearchContent(initialSearchContent);
    setSearchDatas(initialSearchDatas);
    setCurrentPage(initialCurrentPage);
    setCurrentPageDatas(initialCurrentPageDatas);
    setTotalPages(initialTotalPages);
  }, [pageSize]);

  useEffect(() => {
    showPage(currentPage);
  }, [currentPage, searchDatas, totalDatas, showPage]);

  return (
    <>
      {/* Header */}
      <Header />
      <div
        className="drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <section className="hero">
          <div className="hero-content">
            <h1>
              Game <span>Library</span>
            </h1>
            <p>
              Browse games. Find your next favorite adventure from hundreds of
              titles.
            </p>
            <div className="search-bar">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search games..."
                value={searchContent ?? ""}
                onChange={onchangeHadler}
                onKeyDown={onKeyDownHandler}
              />
              <button onClick={searchHandler}>
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </section>

        <section className="games-section">
          <div className="games-list">
            {currentPageDatas.map((el: any, idx: any) => {
              return (
                <div className="game-item" key={el.game_name} data-no={el.no}>
                  <div className="game-image">
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(45deg, #74b9ff, #0984e3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i
                        className="fas fa-gamepad"
                        style={{ fontSize: "60px" }}
                      ></i>
                    </div>
                  </div>
                  <div className="game-content">
                    <h3 className="game-title" title={el.game_name}>
                      {el.game_name}
                    </h3>
                    <p className="game-description" title={el.description}>
                      {el.description}
                    </p>
                    <div
                      className="game-meta"
                      onClick={navigationGamePageHandler}
                    >
                      <div
                        className="game-play"
                        data-no={el.no}
                        data-name={el.name}
                        data-game-name={el.game_name}
                        data-description={el.description}
                        data-developer={el.developer}
                        data-platform={el.platform}
                        data-genre={el.genre}
                      >
                        Play Now
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="page-container">
            <button
              className="btn btn-primary"
              data-value="1"
              onClick={changePage}
            >
              &lt;&lt;
            </button>
            <button
              className="btn btn-primary"
              data-value="-1"
              onClick={changePage}
            >
              &lt;
            </button>
            <button
              className="btn btn-primary"
              data-value="+1"
              onClick={changePage}
            >
              &gt;
            </button>
            <button
              className="btn btn-primary"
              data-value={totalPages}
              onClick={changePage}
            >
              &gt;&gt;
            </button>
          </div>
          <div className="page">
            {currentPage} / {totalPages}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default ListPage;
