# Hostinger Deployment Guide for Collixa

Deploying a modern decoupled application (Next.js 14 Frontend + Node.js Express Backend) on Hostinger Business Hosting involves hosting two separate Node.js applications using Hostinger's cPanel/hPanel.

This guide provides exactly what you need to do to deploy Collixa to **collixa.space**.

## High-Level Strategy
- **Frontend**: Hosted on your main domain (`https://collixa.space`)
- **Backend (API)**: Hosted on a subdomain (`https://api.collixa.space`)

---

## Part 1: Preparing Your Code for Production

Before uploading anything to Hostinger, we need to prepare the production builds on your local computer.

1. **Build the Frontend:**
   Open a terminal in the `frontend` folder and run:
   ```bash
   npm run build
   ```
   This will generate a `.next` folder optimized for production. Wait for it to finish.

2. **Clean up for Upload:**
   Normally, you don't upload the `node_modules` folder because it's massive. You will install them on Hostinger. To make uploading easy, zip your folders:
   - **Frontend Archive**: Zip the contents of your `frontend` folder (make sure to include `.next`, `server.js`, `package.json`, `.env.local`, `public/`). *Do not include `node_modules`*.
   - **Backend Archive**: Zip the contents of your `backend` folder (must include `src/`, `package.json`, `.env`). *Do not include `node_modules`*.

---

## Part 2: Setting up Hostinger

### 1. Create the API Subdomain
1. Log into your **Hostinger hPanel**.
2. Go to **Domains** -> **Subdomains**.
3. Create a new subdomain named `api` under your `collixa.space` domain.
   - Set the Document Root to `/public_html/api` or a custom directory outside `public_html` (like `/api-backend`).

### 2. Upload Your Files
1. Go to **Files** -> **File Manager**.
2. **For the Backend**: Navigate to the directory connected to your subdomain (`api.collixa.space`).
   - Upload your Backend Zip file there.
   - Extract the zip file.
3. **For the Frontend**: Navigate to `/public_html` (the root directory for `collixa.space`).
   - Upload your Frontend Zip file there.
   - Extract the zip file.

---

## Part 3: Deploying the Backend Node App

1. Go to your Hostinger hPanel dashboard and search for **Node.js** in the sidebar.
2. Click **Create Application**.
3. **Configuration:**
   - **Node.js Version**: Select 18.x or 20.x (whichever is newer).
   - **Application mode**: `Production`
   - **Application root**: Select the folder where you uploaded the backend (e.g., `/api-backend` or `/public_html/api`).
   - **Application URL**: Select `api.collixa.space` from the dropdown.
   - **Application startup file**: `src/server.js` (This is very important).
4. **Environment Variables**: Add all your backend environment variables from your `.env` file here:
   - `PORT`: (Leave blank, you don't need to pass this, Hostinger handles it)
   - `SUPABASE_URL`: (Your URL)
   - `SUPABASE_ANON_KEY`: (Your Key)
   - `JWT_SECRET`: (Your Key)
   - *(Add your SMTP/Email settings here too)*
5. **Install Dependencies**: Once created, click on the **NPM Install** button in the Node App dashboard. This will install your `node_modules` on the server.
6. **Start/Restart**: Click "Start" or "Restart", and then visit `https://api.collixa.space/api/health` to confirm it's running!

---

## Part 4: Deploying the Frontend Node App

Now we do the same process for Next.js. We have created a custom `server.js` script to make this compatible with Hostinger.

1. Go back to the **Node.js** app manager in hPanel.
2. Click **Create Application** again.
3. **Configuration:**
   - **Node.js Version**: 18.x or 20.x
   - **Application mode**: `Production`
   - **Application root**: Select `/public_html`
   - **Application URL**: Select `collixa.space`
   - **Application startup file**: `server.js` (This points to the custom wrapper we just built).
4. **Environment Variables**: Add your frontend variables here:
   - `NEXT_PUBLIC_API_URL`: `https://api.collixa.space`
   - `NEXT_PUBLIC_SUPABASE_URL`: (Your URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Key)
   - `NODE_ENV`: `production`
5. **Install Dependencies**: Click the **NPM Install** button.
6. **Start/Restart**: Click "Start". It might take a few moments for Next.js to boot up.

---

## Important Hostinger Troubleshooting

> [!WARNING]
> **503 Service Unavailable**
> If you see this, it means your Node app failed to start.
> - Go to the Node.js dashboard in Hostinger and find the **Log File**.
> - It usually means an Environment Variable is missing or your `Application startup file` path is slightly wrong.

> [!TIP]
> **Next.js Caching Issues**
> If you upload new frontend code, make sure you uploaded the newly built `.next` folder, not your old one, otherwise the site won't reflect the updates!
