"use client";

import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();

  const navagatePage = (pageName: string) => {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      router.push(pageName);
    };
  };

  return (
    <>
      <meta name="description" content="Family Computer Games" />
      <meta property="og:description" content="Family Computer Games" />
      <meta name="twitter:description" content="Family Computer Games" />
      <meta content="Family Computer Games" property="og:site_name" />
      <meta content="https://fc-game.github.io" property="og:url" />
      <meta content="website" property="og:type" />
      <meta content="@Seiriryu" name="twitter:site" />
      <meta content="@Seiriryu" name="twitter:creator" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta content="https://fc-game.github.io" name="twitter:url" />
      <meta content="https://fc-game.github.io" name="twitter:domain" />
      <meta
        content="fc games,online game,Family Computer Games"
        name="keywords"
      />
      <meta content="Family Computer Games" name="twitter:title" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "http://schema.org",
          "@type": "WebSite",
          name: "Family Computer Games",
          url: "https://fc-game.github.io",
        })}
      </script>

      <nav className="navbar">
        <div className="logo">
          <i className="fas fa-gamepad"></i>
          FC<span style={{ marginLeft: "10px" }}>GAME</span>
        </div>
        <ul className="nav-links">
          <li>
            <div onClick={navagatePage("/")} className="active">
              <a href="/#">Home</a>
            </div>
          </li>
          <li>
            <div onClick={navagatePage("/policy")}>
              <a href="/#">Policy</a>
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Header;
