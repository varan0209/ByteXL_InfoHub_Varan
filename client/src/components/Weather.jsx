import React, { useEffect, useState } from "react";

/**
 * Weather
 * - input for a city
 * - fetch button
 * - shows current numbers
 */
export default function Weather() {
  const [city, setCity] = useState("Hyderabad");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const r = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const j = await r.json();
      setData(j);
    } catch (e) {
      setError(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section>
      <form className="row" onSubmit={(e)=>{e.preventDefault(); load();}}>
        <input
          className="input"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Enter city (e.g., Hyderabad)"
          aria-label="City"
        />
        <button className="btn" type="submit">Get Weather</button>
      </form>

      {loading && <div className="skeleton">Loading weather…</div>}
      {error && <div className="error">⚠️ {error}</div>}

      {data && (
        <div className="card">
          <h3>{data.city}</h3>
          <ul className="metrics">
            <li><span>Temp</span><strong>{data.current.temperature}°C</strong></li>
            <li><span>Feels</span><strong>{data.current.apparent}°C</strong></li>
            <li><span>Humidity</span><strong>{data.current.humidity}%</strong></li>
            <li><span>Wind</span><strong>{data.current.wind_speed} m/s</strong></li>
          </ul>
          <small>Updated: {new Date(data.current.time).toLocaleString()}</small>
        </div>
      )}
    </section>
  );
}
