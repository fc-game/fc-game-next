import Raven from "raven-js";
import { useState, useEffect } from "react";

export const handleError = (error: any, errorInfo: any) => {
  console.error(error);
  Raven.captureException(error, { extra: errorInfo });
};

export function loadBinary(path: any, callback: any, handleProgress: any) {
  let req = new XMLHttpRequest();
  req.open("GET", `${process.env.NEXT_PUBLIC_ROM_DOMAIN}${path}`);
  req.overrideMimeType("text/plain; charset=x-user-defined");
  req.onload = function () {
    if (req.status === 200) {
      if (req.responseText.match(/^<!doctype html>/i)) {
        // Got HTML back, so it is probably falling back to index.html due to 404
        return callback(new Error("Page Not Found!!"));
      }

      callback(null, req.responseText);
    } else if (req.status === 0) {
      // Aborted, so ignore error
    } else {
      callback(new Error(req.statusText));
    }
  };
  req.onerror = function () {
    callback(new Error(req.statusText));
  };
  req.onprogress = handleProgress;
  req.send();
  return req;
}

export function useOrientation() {
  const getOrientation = () =>
    window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait";

  const [orientation, setOrientation] = useState(getOrientation);

  useEffect(() => {
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
