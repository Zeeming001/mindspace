import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import "./styles/global.css";
import { CONCEPTS, TOTAL_PAIRS } from "./lib/concepts";
import Home from "./pages/Home";
import Survey from "./pages/Survey";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import ErrorBoundary from "./components/ErrorBoundary";

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
      borderBottom: "1px solid #e0dbd3",
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(248,247,244,0.96)",
      backdropFilter: "blur(8px)",
    }}>
      <NavLink to="/" style={{ fontSize: "0.7rem", letterSpacing: "0.35em", color: "#888", textTransform: "uppercase" }}>
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
              color: isActive ? "#1a1a1e" : "#888",
              textTransform: "uppercase",
              border: "none",
              background: "none",
              borderBottom: isActive ? "1px solid #1a1a1e" : "1px solid transparent",
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
      borderTop: "1px solid #e0dbd3",
      fontSize: "0.58rem",
      color: "#aaa",
      letterSpacing: "0.1em",
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "0.5rem",
    }}>
      <span>MINDSPACE</span>
      <span>{CONCEPTS.length} CONCEPTS · {TOTAL_PAIRS.toLocaleString()} PAIRS · FORCE-DIRECTED + MDS</span>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <NavBar />
        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/"        element={<Home />} />
              <Route path="/survey"  element={<Survey />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/about"   element={<About />} />
              <Route path="/results" element={<Results />} />
              <Route path="/admin"   element={<Admin />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
