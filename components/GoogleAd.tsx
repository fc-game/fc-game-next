import { useEffect } from 'react';

interface GoogleAdProps {
  className?: string;
  style?: React.CSSProperties;
  client?: string;
  slot: string;
  format?: string;
  layout?: string;
  layoutKey?: string;
  responsive?: string;
}

const GoogleAd: React.FC<GoogleAdProps> = (props) => {
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

  useEffect(() => {
    // Ensure this only runs on the client side
    if (typeof window !== 'undefined') {
      try {
        // Type assertion for Google Ads API
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        (window as any).adsbygoogle = adsbygoogle;
      } catch (e) {
        console.error("Google Ads error:", e);
      }
    }
  }, []);

  // For Next.js, environment variables are accessed differently
  const adClient = client || process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT;

  if (!adClient) {
    console.warn('Google Ad Client ID is not defined');
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
      />
      <ins
        className={`${className} adsbygoogle`}
        style={style}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </>
  );
};

export default GoogleAd;