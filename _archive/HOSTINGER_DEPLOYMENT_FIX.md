# Hostinger Deployment Fix for "Unexpected token <" Error

The error `SyntaxError: Unexpected token '<'` in the dashboard means the Frontend cannot reach the Backend API. It is receiving an HTML page (the frontend itself) instead of JSON data.

## Step 1: Code Update (Already Done)
I have updated `MasterAdminDashboard.jsx` to use the central API configuration (`src/lib/api.js`). This ensures it respects your environment variables.

## Step 2: Configure Environment Variables (CRITICAL)
You must tell the frontend where your backend is running.

### Option A: If you have a separate Backend URL (e.g., VPS or Cloud)
1.  Go to your Hostinger Dashboard -> **Environment Variables**.
2.  Add a new variable:
    *   **Key**: `VITE_API_URL`
    *   **Value**: `https://your-backend-domain.com/api` (Example: `https://api.jashcharerp.com/api`)
3.  **Rebuild** your frontend application.

### Option B: If you are using Nginx Reverse Proxy (VPS)
If your frontend and backend are on the same server, you need to configure Nginx to forward `/api` requests to the backend port (5000).

Edit your Nginx config (`/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    server_name www.jashcharerp.com;

    root /var/www/html/dist; # Path to your frontend build
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # THIS BLOCK IS MISSING - ADD IT
    location /api {
        proxy_pass http://localhost:5000; # Forward to Node.js Backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
After saving, run: `sudo systemctl restart nginx`.

### Option C: If you are using Shared Hosting (cPanel/hPanel)
Shared hosting usually doesn't support running a Node.js backend on the same port/domain easily.
1.  You must deploy the backend to a **subdomain** (e.g., `api.jashcharerp.com`) using the "Node.js App" feature in Hostinger.
2.  Once deployed, get the URL (e.g., `https://api.jashcharerp.com`).
3.  Set `VITE_API_URL` to `https://api.jashcharerp.com/api` in your frontend build settings.
4.  Rebuild and redeploy the frontend.

## Summary
The dashboard is empty because the API calls are failing. Fixing the `VITE_API_URL` or Nginx config will solve it.
