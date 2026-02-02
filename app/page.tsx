"use client";

import React, { Suspense } from "react";
import HomePage from "@/components/HomePage";

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
const ListPage: React.FC = () => {
  /* ================== 渲染 ================== */
  return (
    <>
      <Suspense fallback={<>...</>}>
        <HomePage />
      </Suspense>
    </>
  );
};

export default ListPage;
