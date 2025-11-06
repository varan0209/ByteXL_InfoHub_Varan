import React, { useState } from "react";

/**
 * One button. One quote.
 */
export default function Quotes() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    setQuote(null);
    try {
      const r = await fetch("/api/quote");
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const j = await r.json();
      setQuote(j);
    } catch (e) {
      setError(e.message || "Failed to load quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <button className="btn" onClick={load}>Get Motivational Quote</button>
      {loading && <div className="skeleton">Loading quote…</div>}
      {error && <div className="error">⚠️ {error}</div>}
      {quote && (
        <blockquote className="quote">
          <p>“{quote.content}”</p>
          <footer>— {quote.author}</footer>
        </blockquote>
      )}
    </section>
  );
}
