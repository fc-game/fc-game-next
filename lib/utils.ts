/* ================== Error Report ================== */
// 推荐：@sentry/nextjs 或 @sentry/browser
import * as Sentry from "@sentry/browser";
import { useState, useEffect } from "react";

/**
 * 统一错误处理
 */
export const handleError = (
  error: unknown,
  errorInfo?: Record<string, any>,
) => {
  console.error(error);

  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: errorInfo,
    });
  }
};

/* ================== ROM Loader ================== */

/**
 * 加载 ROM（二进制）
 */
export function loadBinary(
  path: string,
  callback: (err: Error | null, data?: string) => void,
  handleProgress?: (
    this: XMLHttpRequest,
    ev: ProgressEvent<EventTarget>,
  ) => any,
): XMLHttpRequest {
  const req = new XMLHttpRequest();

  req.open("GET", `${process.env.NEXT_PUBLIC_ROM_DOMAIN}${path}`);
  req.overrideMimeType("text/plain; charset=x-user-defined");

  req.onload = function () {
    if (req.status === 200) {
      const text = req.responseText;

      if (/^<!doctype html>/i.test(text)) {
        // 404 fallback
        callback(new Error("Page Not Found!!"));
        return;
      }

      callback(null, text);
    } else if (req.status === 0) {
      // aborted → ignore
    } else {
      callback(new Error(req.statusText));
    }
  };

  req.onerror = function () {
    callback(new Error(req.statusText));
  };

  if (handleProgress) {
    req.onprogress = handleProgress;
  }

  req.send();
  return req;
}

/* ================== Orientation Hook ================== */

export type Orientation = "portrait" | "landscape";

/**
 * 屏幕方向 Hook（SSR 安全）
 */
export function useOrientation(): Orientation {
  const getOrientation = (): Orientation => {
    if (typeof window === "undefined") return "landscape";
    return window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait";
  };

  const [orientation, setOrientation] = useState<Orientation>(() =>
    getOrientation(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => setOrientation(getOrientation());

    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);

    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);

  return orientation;
}
