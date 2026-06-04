# LinkLens AI - Deployment Guide

This guide details how to deploy **LinkLens AI** to production. Since the project contains a stateful backend (Node.js/Express with Socket.io WebSockets, MongoDB, and live analytics timers) and a static React frontend, there are two primary deployment pathways.

---

## Environment Variables Needed

Whether you choose Option A or Option B, you will need to provision a MongoDB database (e.g., using a free [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) cluster) and configure the following variables:

### Backend Variables:
- `MONGO_URI`: The connection string to your MongoDB Atlas database.
- `JWT_SECRET`: A secure random string for JWT token generation.
- `CLIENT_URL`: The URL where your React frontend is hosted (e.g., `https://linklens-ai.vercel.app`).
- `BASE_URL`: The base URL of the backend server (used for generating shortened redirect links, e.g., `https://linklens-api.render.com`).
- `PORT`: (Optional, defaults to `5000` or set automatically by the platform).
- `BRAND_NAME`: Set to `LinkLens AI`.

### Frontend Variables:
- `VITE_API_URL`: The base URL of your API server ending in `/api` (e.g., `https://linklens-api.render.com/api`).
- `VITE_SOCKET_URL`: The base URL of your API server (e.g., `https://linklens-api.render.com`).

---

## Option A: Split Deployment (Highly Recommended)
*Deploy Frontend on Vercel, and Backend on Render/Railway/Fly.io.*

This option is recommended because **WebSockets (Socket.io) and persistent timers (`setInterval` for live tickers) are stateful** and require a continuous server environment to run correctly. Vercel Serverless Functions do not support persistent WebSocket connections.

### Step 1: Deploy Backend (Express) to Render, Railway, or Fly.io

We will use **Render** (Free tier supported) as the example:
1. Sign up/log in to [Render](https://render.com/).
2. Create a new **Web Service** and connect your GitHub repository `LinkLens-AI`.
3. Configure the following settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In the **Environment** tab, add your Backend environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (Wait until you create the Vercel site to fill this, then update it)
   - `BASE_URL` (Set this to the domain provided by Render, e.g., `https://linklens-api.onrender.com`)
   - `BRAND_NAME`: `LinkLens AI`
5. Click **Deploy Web Service**.

### Step 2: Deploy Frontend (Vite) to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** > **Project** and select your GitHub repository `LinkLens-AI`.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://[your-render-app-url]/api`
   - `VITE_SOCKET_URL`: `https://[your-render-app-url]`
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://linklens-ai.vercel.app`) and update the `CLIENT_URL` environment variable in your Render backend settings.

---

## Option B: Monorepo Deployment to Vercel (Serverless)
*Deploy both Frontend and Backend on Vercel.*

> [!WARNING]
> Vercel Serverless Functions do not support persistent TCP/WebSocket connections. Real-time visit pings and the live visitor ticker will fall back or not function, but core API calls, user authentication, link shortening, analytics storage, and safety redirects will work perfectly.

To make the backend compatible with Vercel Serverless Functions, you can configure routes and serverless handlers by adding a `vercel.json` config in the root directory.

### Step 1: Create a `vercel.json` file in the root directory

Here is the configuration required:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/app.js" },
    { "source": "/unlock/(.*)", "destination": "/api/app.js" },
    { "source": "/:shortCode", "destination": "/api/app.js" }
  ]
}
```

To support this, the API entry point must be exposed inside an `/api` folder for Vercel. We create an `/api/app.js` file at the root level referencing the Express app:

```javascript
// /api/app.js
const app = require('../server/src/app');
const mongoose = require('mongoose');
const { mongoUri } = require('../server/src/config/env');

let cachedDb = null;

module.exports = async (req, res) => {
  if (!cachedDb) {
    if (!mongoUri) throw new Error('MONGO_URI is missing');
    cachedDb = await mongoose.connect(mongoUri);
  }
  return app(req, res);
};
```

### Step 2: Set Environment Variables in Vercel
In your Vercel Project settings, configure:
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` (Your Vercel deployment URL)
- `BASE_URL` (Your Vercel deployment URL)
- `BRAND_NAME`: `LinkLens AI`

---

## Database Initialization (MongoDB Atlas Setup)

1. Go to [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) and sign up for a free account.
2. Create a free **M0 cluster**.
3. In **Network Access**, allow access from anywhere (`0.0.0.0/0`) since Vercel serverless IPs change dynamically.
4. In **Database Access**, create a user credentials (username and password).
5. Obtain your Connection String (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/linklens?retryWrites=true&w=majority`).
6. Substitute this connection string into your `MONGO_URI` environment variable configuration.
