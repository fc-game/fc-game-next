"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="logo">
        <i className="fas fa-gamepad" />
        FC<span style={{ marginLeft: "10px" }}>GAME</span>
      </div>

      <ul className="nav-links">
        <li className={pathname === "/" ? "active" : ""}>
          <Link href="/">Home</Link>
        </li>

        <li className={pathname === "/policy" ? "active" : ""}>
          <Link href="/policy">Policy</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
