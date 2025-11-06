# InfoHub

One page. Three tools: weather by city, INR → USD/EUR, and a quick quote.

## Run it locally

**Backend**

```bash
cd server
npm install
npm run dev
# -> http://localhost:5000
```

Check in a browser:
- `/api/health`
- `/api/weather?city=Hyderabad`
- `/api/rates`
- `/api/quote`

**Frontend**

```bash
cd client
npm install
npm run dev
# -> http://localhost:5173
```

The client proxies `/api/*` to the backend during local dev.

## Notes

- Free providers, no keys.
- Loading and error states are visible.
- Code and comments stay short and straight to the point.
