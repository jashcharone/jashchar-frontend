# Debugging "Unexpected token <" Error on Hostinger

## The Issue
You are seeing the error: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.

## The Cause
This error happens when the application tries to fetch data from the API, but instead of receiving JSON data, it receives an HTML page (usually the 404 "Not Found" page or the `index.html` fallback).

This almost always means that the **Supabase URL is incorrect or missing** in your production environment.

When `VITE_SUPABASE_URL` is missing, the Supabase client might try to send requests to the current domain (e.g., `https://www.jashcharerp.com/rest/v1/...`). Since your Hostinger site is a static frontend, these paths do not exist, so Hostinger serves the `index.html` file. The code tries to parse this HTML as JSON and fails.

## How to Fix on Hostinger

1.  **Login to Hostinger hPanel**.
2.  Go to **Websites** -> **Manage**.
3.  Look for **Environment Variables** or **Advanced** settings.
    *   *Note: If you are using "Static Website" hosting, you might need to rebuild the app with the variables set in your build script or `.env` file.*
    *   *If you are using "VPS" or "Node.js" hosting, you can set environment variables in the dashboard.*
4.  **Verify the Variables**:
    Ensure you have the following variables set exactly as they are in your local `.env` file:
    *   `VITE_SUPABASE_URL`: Must start with `https://` and end with `.supabase.co`.
    *   `VITE_SUPABASE_ANON_KEY`: Your public anonymous key.

## If you are building locally and uploading to Hostinger:
If you build the `dist` folder locally and upload it via FTP/File Manager:
1.  Make sure your local `.env` file has the correct production values.
2.  Run `npm run build` locally.
3.  Upload the **new** `dist` folder contents to `public_html`.

**Crucial:** Vite embeds environment variables **at build time**. If you change the variables on Hostinger *after* uploading a static build, it won't work. You must rebuild the application with the correct variables present.

## Verification
1.  Open the browser Developer Tools (F12).
2.  Go to the **Console** tab.
3.  Reload the page.
4.  Look for the log message: `[Supabase] Initializing client with URL: ...`.
5.  If it says `UNDEFINED` or shows a wrong URL, you need to rebuild/reconfigure.
