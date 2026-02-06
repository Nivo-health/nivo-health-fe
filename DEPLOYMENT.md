# Deployment Guide

Quick guide to deploy your Clinic OPD Management System as a web app.

## Quick Start - Build & Deploy

### Step 1: Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 2: Test Production Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` to test your production build.

### Step 3: Deploy

Choose one of the deployment options below.

---

## 🚀 Deployment Options

### 1. Vercel (Easiest - Recommended)

**Via CLI:**

```bash
npm install -g vercel
vercel
```

**Via Dashboard:**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite - just click "Deploy"

**Settings:**

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

✅ **Done!** Your app is live at `https://your-app.vercel.app`

---

### 2. Netlify

**Via CLI:**

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Via Dashboard:**

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Connect GitHub and select your repo
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

✅ **Done!** Your app is live at `https://your-app.netlify.app`

---

### 3. GitHub Pages

**Setup:**

```bash
npm install --save-dev gh-pages
```

**Update `package.json`:**

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**Update `vite.config.ts`:**

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/', // Replace with your actual repo name
});
```

**Deploy:**

```bash
npm run deploy
```

**Enable Pages:**

1. Go to your GitHub repo
2. Settings > Pages
3. Source: `gh-pages` branch
4. Save

✅ **Done!** Your app is live at `https://username.github.io/your-repo-name/`

---

### 4. Traditional Web Hosting (cPanel, FTP)

**Build:**

```bash
npm run build
```

**Upload:**

1. Upload all files from the `dist/` folder to your web server
2. Place them in `public_html` or `www` directory

**Configure for SPA Routing:**

Create `.htaccess` file in the `dist/` folder (for Apache):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

For Nginx, add to your server config:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

✅ **Done!** Your app is live on your domain.

---

### 5. Docker

**Create `Dockerfile`:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`:**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Build and run:**

```bash
docker build -t clinic-app .
docker run -p 80:80 clinic-app
```

---

## Environment Variables

Set these in your hosting platform's environment variables section:

- `VITE_CLINIC_NAME` - Your clinic name
- `VITE_API_BASE_URL` - Your backend API URL (if using real API)

**Note:** Vite requires the `VITE_` prefix for client-side variables.

---

## Troubleshooting

### Build Fails

- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run build`

### 404 Errors on Routes

- Ensure SPA routing is configured (see options above)
- All routes should redirect to `index.html`

### API Not Working

- Check CORS settings on your backend
- Verify `VITE_API_BASE_URL` is set correctly
- Check browser console for errors

---

## Next Steps

1. **Connect to Real Backend:** Update `src/services/apiClient.ts` to use real API
2. **Add Authentication:** Implement user login/authentication
3. **Add Database:** Replace localStorage with real database
4. **Enable HTTPS:** Ensure your hosting uses HTTPS
5. **Set Up Monitoring:** Add error tracking (Sentry, etc.)

---

**Need Help?** Check the main README.md for more details.
