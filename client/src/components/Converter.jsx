import React, { useEffect, useState } from "react";

/**
 * Simple INR converter.
 * I fetch rates once and then multiply as the user types.
 */
export default function Converter() {
  const [rates, setRates] = useState(null);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/rates");
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const j = await r.json();
      setRates(j);
    } catch (e) {
      setError(e.message || "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const usd = rates ? (amount * rates.rates.USD).toFixed(2) : "";
  const eur = rates ? (amount * rates.rates.EUR).toFixed(2) : "";

  return (
    <section>
      <div className="row">
        <input
          className="input"
          type="number"
          min="0"
          value={amount}
          onChange={(e)=> setAmount(Number(e.target.value))}
          aria-label="Amount in INR"
        />
        <span className="unit">INR</span>
      </div>

      {loading && <div className="skeleton">Loading rates…</div>}
      {error && <div className="error">⚠️ {error}</div>}

      {rates && (
        <div className="grid-2">
          <div className="card">
            <h3>USD</h3>
            <p className="big">{usd}</p>
            <small>Base: INR • Date: {rates.date}</small>
          </div>
          <div className="card">
            <h3>EUR</h3>
            <p className="big">{eur}</p>
            <small>Base: INR • Date: {rates.date}</small>
          </div>
        </div>
      )}
      <button className="btn" onClick={load} style={{marginTop:12}}>Refresh Rates</button>
    </section>
  );
}
