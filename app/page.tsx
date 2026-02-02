"use client";

import React, { Suspense } from "react";
import HomePage from "@/components/HomePage";

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
