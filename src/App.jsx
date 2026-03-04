import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import "./styles/global.css";
import Home from "./pages/Home";
import Survey from "./pages/Survey";
import Explore from "./pages/Explore";
import About from "./pages/About";

const NAV_LINKS = [
  { to: "/",        label: "Home" },
  { to: "/survey",  label: "Survey" },
  { to: "/explore", label: "Explore" },
  { to: "/about",   label: "About" },
];

function NavBar() {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.2rem 2.5rem",
      borderBottom: "1px solid #1e1e22",
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(13,13,15,0.96)",
      backdropFilter: "blur(8px)",
    }}>
      <NavLink to="/" style={{ fontSize: "0.7rem", letterSpacing: "0.35em", color: "#555", textTransform: "uppercase" }}>
        Mindspace
      </NavLink>
      <div style={{ display: "flex", gap: "2rem" }}>
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: isActive ? "#d4d0c8" : "#555",
              textTransform: "uppercase",
              border: "none",
              background: "none",
              borderBottom: isActive ? "1px solid #d4d0c8" : "1px solid transparent",
              paddingBottom: "2px",
              transition: "color 0.2s, border-color 0.2s",
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: "1rem 2.5rem",
      borderTop: "1px solid #1a1a1e",
      fontSize: "0.58rem",
      color: "#2e2e36",
      letterSpacing: "0.1em",
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "0.5rem",
    }}>
      <span>MINDSPACE</span>
      <span>63 CONCEPTS · 1,953 PAIRS · CLASSICAL MDS</span>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <NavBar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/survey"  element={<Survey />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about"   element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
