import React, { useState } from "react";
import Weather from "./components/Weather.jsx";
import Converter from "./components/Converter.jsx";
import Quotes from "./components/Quotes.jsx";

// Simple tab button. Plain and keyboard‑friendly.
const Tab = ({ id, active, onClick, children }) => (
  <button
    onClick={() => onClick(id)}
    className={`tab ${active === id ? "active" : ""}`}
    aria-selected={active === id}
    role="tab"
  >
    {children}
  </button>
);

export default function App() {
  const [active, setActive] = useState("weather");

  return (
    <div className="container">
      <header>
        <h1>InfoHub</h1>
        <p className="subtitle">Weather • Currency • Quotes</p>
      </header>

      <nav role="tablist" className="tabs">
        <Tab id="weather" active={active} onClick={setActive}>Weather</Tab>
        <Tab id="converter" active={active} onClick={setActive}>Currency</Tab>
        <Tab id="quotes" active={active} onClick={setActive}>Quotes</Tab>
      </nav>

      <main className="panel">
        {active === "weather" && <Weather />}
        {active === "converter" && <Converter />}
        {active === "quotes" && <Quotes />}
      </main>

      <footer>
        <small>Built with React + Express.</small>
      </footer>
    </div>
  );
}
