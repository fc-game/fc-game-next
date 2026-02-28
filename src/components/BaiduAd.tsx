import { useEffect } from "react";

const BaiduAd = () => {
  useEffect(() => {
    window.cpro_id = "324324324";
    var script = document.createElement("script");
    script.src = "http://cpro.baidustatic.com/cpro/ui/c.js";
    document.body.appendChild(script);
  }, []);

  return <div className="adsbybaidu"></div>;
};

export default BaiduAd;
