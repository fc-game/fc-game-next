const GoogleAd = (props: any) => {
  const {
    className = "",
    style = { display: "block", width: "100%", height: "100px" },
    client,
    slot,
    format = "auto",
    layout = "",
    layoutKey = "",
    responsive = "false",
  } = props;

  return (
    <>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT}`}
        crossOrigin="anonymous"
      ></script>
      <ins
        className={`${className} adsbygoogle`}
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
      <script
        dangerouslySetInnerHTML={{
          __html: "(window.adsbygoogle = window.adsbygoogle || []).push({});",
        }}
      />
    </>
  );
};

export default GoogleAd;
