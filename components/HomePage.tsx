"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter,useSearchParams  } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import config from "@/lib/config";
import RomLibrary from "@/lib/romLibrary";

/* ================== 类型 ================== */


interface GameData {
  no: number;
  name: string;
  game_name: string;
  description: string;
  developer: string;
  platform: string;
  genre: string;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/* ================== 组件 ================== */
const HomePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageSize = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalDatas, setTotalDatas] = useState<GameData[]>([]);
  const [searchDatas, setSearchDatas] = useState<GameData[]>([]);
  const [currentPageDatas, setCurrentPageDatas] = useState<GameData[]>([]);

  const [searchContent, setSearchContent] = useState("");

  /* ================== 拖拽 ================== */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file =
      e.dataTransfer.items?.[0]?.getAsFile() || e.dataTransfer.files?.[0];
    if (!file) return;

    const rom = await RomLibrary.save(file);
    router.push(`/run/local-${rom.hash}`);
  };

  /* ================== 分页切片 ================== */
  const showPage = useCallback(
    (page: number, source: GameData[]) => {
      const start = (page - 1) * pageSize;
      const end = page * pageSize;
      setCurrentPageDatas(source.slice(start, end));
    },
    [pageSize],
  );

  /* ================== 初始化数据（只一次） ================== */
  useEffect(() => {
    const list: GameData[] = Object.entries(config.ROMS).map(
      ([key, value]: any, idx) => ({
        no: idx + 1,
        name: key,
        game_name: key.replaceAll("_", " "),
        description: value.description || "",
        developer: value.developer || "",
        platform: value.platform || "",
        genre: value.genre || "",
      }),
    );

    setTotalDatas(list);
    setSearchDatas(list);

    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    setTotalPages(pages);
  }, []);

  /* ================== URL page 同步 ================== */
  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  /* ================== page / 数据源变化时渲染 ================== */
  useEffect(() => {
    const source = searchContent ? searchDatas : totalDatas;
    const pages = Math.max(1, Math.ceil(source.length / pageSize));

    setTotalPages(pages);

    const safePage = Math.min(currentPage, pages);
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }

    showPage(safePage, source);
  }, [currentPage, searchDatas, totalDatas, searchContent, showPage, pageSize]);

  /* ================== 搜索 ================== */
  const searchHandler = () => {
    const keyword = searchContent.trim().toLowerCase();

    const result = totalDatas.filter(
      (el) =>
        el.game_name.toLowerCase().includes(keyword) ||
        el.description.toLowerCase().includes(keyword) ||
        el.developer.toLowerCase().includes(keyword) ||
        el.platform.toLowerCase().includes(keyword) ||
        el.genre.toLowerCase().includes(keyword),
    );

    setSearchDatas(result);
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  /* ================== 翻页 ================== */
  const changePage = (page: number) => {
    setCurrentPage(page);
    router.push(`?page=${page}`, { scroll: false });
  };

  /* ================== 渲染 ================== */
  return (
    <>
      {/* Header */}
      <Header />
      <div
        className="drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* ===== Hero ===== */}
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
                type="text"
                className="search-input"
                placeholder="Search games..."
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchHandler()}
              />
              <button className="search-btn" onClick={searchHandler}>
                <i className="fas fa-search" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== Game List ===== */}
        <section className="games-section">
          <div className="games-list">
            {currentPageDatas.map((el) => (
              <div className="game-item" key={el.name}>
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
                    onClick={() => router.push(`/run/${el.name}`)}
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
            ))}
          </div>

          {/* ===== Pagination ===== */}
          <div className="page-container">
            <button className="btn btn-primary" onClick={() => changePage(1)}>
              «
            </button>
            <button
              className="btn btn-primary"
              onClick={() => changePage(Math.max(1, currentPage - 1))}
            >
              ‹
            </button>
            <button
              className="btn btn-primary"
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
            >
              ›
            </button>
            <button
              className="btn btn-primary"
              onClick={() => changePage(totalPages)}
            >
              »
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

export default HomePage;
