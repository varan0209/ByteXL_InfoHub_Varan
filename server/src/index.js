import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
import pino from "pino";
import pinoHttp from "pino-http";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

// Small message so hitting "/" isn't a dead end.
app.get("/", (_req, res) => {
  res
    .status(200)
    .type("text/plain")
    .send("InfoHub server is up. Try /api/health, /api/weather, /api/rates, /api/quote");
});

// Health check I use while developing.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/**
 * Fetch JSON with a timeout.
 * If the service answers with something other than 200,
 * include a short description to help me debug.
 */
async function safeJsonFetch(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 10000);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      const err = new Error(`HTTP ${r.status} @ ${url} :: ${text.slice(0, 160)}`);
      err.status = r.status;
      throw err;
    }
    return await r.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Turn a city name into lat/lon.
 * I first try Open‑Meteo. If it fails, I fall back to OSM Nominatim.
 */
async function geocodeCity(city) {
  try {
    const q = encodeURIComponent(city);
    const om = await safeJsonFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`
    );
    if (om.results && om.results.length > 0) {
      const g = om.results[0];
      return { lat: g.latitude, lon: g.longitude, display: g.name };
    }
  } catch (_) {
    // try fallback
  }

  const nq = encodeURIComponent(city);
  const nom = await safeJsonFetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${nq}&limit=1`,
    { headers: { "User-Agent": "InfoHub/1.0 (local dev)" } }
  );
  if (Array.isArray(nom) && nom.length > 0) {
    return {
      lat: Number(nom[0].lat),
      lon: Number(nom[0].lon),
      display: nom[0].display_name?.split(",")[0] || city
    };
  }

  const err = new Error(`City not found: ${city}`);
  err.status = 404;
  throw err;
}

// Weather — /api/weather?city=Hyderabad
app.get("/api/weather", async (req, res) => {
  try {
    let { city, lat, lon } = req.query;
    if ((!lat || !lon) && !city) city = "Hyderabad"; // sensible default

    if (!lat || !lon) {
      const g = await geocodeCity(city);
      lat = g.lat;
      lon = g.lon;
      city = g.display || city;
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

    const w = await safeJsonFetch(url, { timeoutMs: 10000 });
    if (!w?.current) {
      const err = new Error("Weather provider returned no current section");
      err.status = 502;
      throw err;
    }

    res.json({
      city,
      lat: Number(lat),
      lon: Number(lon),
      current: {
        temperature: w.current.temperature_2m,
        apparent: w.current.apparent_temperature,
        humidity: w.current.relative_humidity_2m,
        wind_speed: w.current.wind_speed_10m,
        weather_code: w.current.weather_code,
        time: w.current.time
      }
    });
  } catch (e) {
    req.log.error({ err: e?.message || e }, "weather error");
    res.status(e?.status || 500).json({
      error: "Failed to fetch weather",
      details: e?.message || String(e)
    });
  }
});

// Currency — INR to USD/EUR with fallback provider.
app.get("/api/rates", async (_req, res) => {
  try {
    const ok = (obj) =>
      obj && obj.rates && typeof obj.rates.USD === "number" && typeof obj.rates.EUR === "number";

    // Primary
    const d1 = await safeJsonFetch(
      "https://api.exchangerate.host/latest?base=INR&symbols=USD,EUR",
      { timeoutMs: 10000 }
    ).catch(() => null);

    if (ok(d1)) {
      return res.json({ base: "INR", date: d1.date, rates: { USD: d1.rates.USD, EUR: d1.rates.EUR } });
    }

    // Fallback
    const d2 = await safeJsonFetch(
      "https://api.frankfurter.app/latest?from=INR&to=USD,EUR",
      { timeoutMs: 10000 }
    ).catch(() => null);

    if (d2 && d2.rates && typeof d2.rates.USD === "number" && typeof d2.rates.EUR === "number") {
      return res.json({ base: "INR", date: d2.date, rates: { USD: d2.rates.USD, EUR: d2.rates.EUR } });
    }

    return res.status(502).json({
      error: "Failed to fetch currency rates",
      details: "Both providers returned invalid responses"
    });
  } catch (e) {
    req.log.error({ err: e?.message || e }, "rates error");
    res.status(500).json({ error: "Failed to fetch rates", details: e?.message || String(e) });
  }
});

// Quote — uses provider or a small local list if the provider is down.
const localQuotes = [
  { content: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { content: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { content: "Action is the foundational key to all success.", author: "Pablo Picasso" }
];

app.get("/api/quote", async (req, res) => {
  try {
    const r = await safeJsonFetch("https://api.quotable.io/random", { timeoutMs: 8000 });
    res.json({ content: r.content, author: r.author });
  } catch (e) {
    req.log.warn({ err: e?.message || e }, "quote provider failed, serving a local one");
    const q = localQuotes[Math.floor(Math.random() * localQuotes.length)];
    res.json(q);
  }
});

app.listen(PORT, () => {
  logger.info(`InfoHub server listening on http://localhost:${PORT}`);
});
