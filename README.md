# Clinic OPD Management System

A React TypeScript application for managing Outpatient Department (OPD) operations including patient registration, consultations, prescriptions, and printing.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   The app will be available at `http://localhost:5173` (or the port shown in terminal)

### Other Commands

- **Build for production:**

  ```bash
  npm run build
  ```

- **Preview production build:**
  ```bash
  npm run preview
  ```

## 📱 App Flow & Exploration Guide

### 1. **Home Screen** (`/`)

- **What to see:** Clinic name and "Start OPD" button
- **Action:** Click "Start OPD" to begin
- **Keyboard:** Press Enter or click the button

### 2. **Patient Search** (`/patient-search`)

- **What to see:** Search bar and "Add New Patient" button
- **Try this:**
  - Type at least 2 characters to search (e.g., "ram", "9898")
  - Click on a patient from results to open their visit
  - Click "Add New Patient" to create a new patient
- **Add New Patient:**
  - Fill in Name and Mobile (required)
  - Optionally add Age and Gender
  - Press Enter or click Save
  - Automatically creates a visit and navigates to Visit Context

### 3. **Visit Context** (`/visit/:visitId`)

- **What to see:**
  - Patient details (name, age, gender, mobile, date)
  - Visit history on the left
  - Actions panel on the right
- **Try this:**
  - Toggle "Send prescription on WhatsApp" checkbox
  - Click "Consult & Write Prescription" to proceed
  - Click on old visits in history to view past prescriptions

### 4. **Consultation Notes** (`/consultation/:visitId`)

- **What to see:** Large textarea for consultation notes
- **Try this:**
  - Type consultation notes (symptoms, diagnosis, etc.)
  - Notes auto-save after 500ms of inactivity
  - Notes also save when you blur the field
  - Click "Proceed to Prescription" when done

### 5. **Prescription Screen** (`/prescription/:visitId`)

- **What to see:**
  - Medicine table (initially empty)
  - Follow-up options
  - Sticky bottom bar with action buttons
- **Try this:**
  - Click "+ Add Medicine" to add a new row
  - Fill in Medicine name, Dosage (e.g., "1-0-1"), Duration (e.g., "5 days")
  - Add optional notes for each medicine
  - Remove medicines with "Remove" button
  - Set follow-up: Choose "Follow-up after" and enter value + unit
  - **Bottom Actions:**
    - Toggle "Send on WhatsApp" checkbox
    - Click "Print" to preview and print
    - Click "Send on WhatsApp" to see preview modal
    - Click "Save & Finish Visit" to complete the visit

### 6. **Print Preview** (`/print-preview/:visitId`)

- **What to see:** Two tabs - A4 Prescription and Thermal
- **Try this:**
  - Switch between A4 and Thermal tabs
  - Review the formatted prescription
  - Click "Print" button to open browser print dialog
  - Choose your printer and print

## 🎯 Key Features to Explore

### Search Functionality

- **Debounced search:** Type in patient search - notice it waits 300ms before searching
- **Minimum 2 characters:** Try typing just 1 character - no results
- **Search by name or mobile:** Try searching by partial name or mobile number

### Auto-Save

- **Consultation notes:** Type in consultation screen, wait 500ms, navigate away and come back - notes are saved
- **Prescription:** Changes are saved automatically when you navigate

### Toast Notifications

- **WhatsApp toggle:** Toggle the WhatsApp checkbox in Visit Context - see success toast
- **Prescription actions:** Save, send, or complete visit - see confirmation toasts

### Keyboard Navigation

- **Enter key:** Works in modals and forms
- **Tab navigation:** Navigate through form fields
- **Auto-focus:** Search bar and key inputs auto-focus

### Responsive Design

- **Resize browser:** Try different screen sizes
- **Mobile view:** Test on mobile or narrow browser window
- **Sticky elements:** Notice sticky search bar and bottom action bar

## 💾 Data Storage

Currently, the app uses **localStorage** as a mock backend. All data persists in your browser:

- Patients are stored in `clinic_patients`
- Visits are stored in `clinic_visits`

**To clear data:**

- Open browser DevTools (F12)
- Go to Application/Storage tab
- Clear localStorage

## 🔌 API Integration

The app is structured to use the API format from `API_SPECIFICATION.md`. Currently using mock API client with localStorage. To connect to a real backend:

1. Set environment variable: `VITE_API_BASE_URL=http://your-api-url/api/v1`
2. Update `src/services/apiClient.ts` to use real fetch calls instead of mock

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **React Router v7** - Navigation
- **Radix UI** - Accessible components
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence (mock)

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_CLINIC_NAME=Your Clinic Name
VITE_API_BASE_URL=/api/v1
```

## 🐛 Troubleshooting

**App won't start:**

- Make sure you've run `npm install`
- Check Node.js version (should be v18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

**No data showing:**

- Check browser console for errors
- Verify localStorage is enabled
- Try clearing localStorage and adding new data

**Build errors:**

- Run `npm run build` to see TypeScript errors
- Check `tsconfig.json` configuration

## 📚 Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Main application screens
├── services/       # API services (patient, visit, prescription, whatsapp)
├── types/          # TypeScript interfaces
├── utils/          # Utilities (toast, print, cn)
├── App.tsx         # Main app with routing
└── main.tsx        # Entry point
```

## 🎨 Customization

- **Clinic Name:** Set `VITE_CLINIC_NAME` in `.env` or environment
- **Colors:** Modify Tailwind classes in components
- **Print Layout:** Edit `src/utils/print.ts` for custom print formats

## 🌐 Building & Deploying as Web App

### Building for Production

1. **Build the production bundle:**

   ```bash
   npm run build
   ```

   This creates an optimized production build in the `dist/` folder.

2. **Preview the production build locally:**
   ```bash
   npm run preview
   ```
   This serves the production build at `http://localhost:4173` for testing.

### Deployment Options

#### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

   Follow the prompts. Your app will be live at `https://your-app.vercel.app`

3. **Or use Vercel Dashboard:**
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect Vite and deploy

**Vercel Configuration:**

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### Option 2: Netlify

1. **Install Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**

   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Or use Netlify Dashboard:**
   - Push to GitHub
   - Go to [netlify.com](https://netlify.com)
   - Add new site from Git
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

#### Option 3: GitHub Pages

1. **Install gh-pages:**

   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `package.json` scripts:**

   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update `vite.config.ts`:**

   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/', // Replace with your GitHub repo name
   });
   ```

4. **Deploy:**

   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your repo Settings > Pages
   - Select `gh-pages` branch
   - Your app will be at `https://username.github.io/your-repo-name/`

#### Option 4: Traditional Web Hosting (cPanel, FTP, etc.)

1. **Build the app:**

   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder contents** to your web server's public directory (usually `public_html` or `www`)

3. **Configure your server:**
   - Ensure your server supports SPA routing
   - Add a `.htaccess` file (for Apache) in the `dist/` folder:
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

#### Option 5: Docker Deployment

1. **Create `Dockerfile`:**

   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   # Production stage
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create `nginx.conf`:**

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

3. **Build and run:**
   ```bash
   docker build -t clinic-app .
   docker run -p 80:80 clinic-app
   ```

### Environment Variables for Production

For production deployments, set these environment variables in your hosting platform:

- `VITE_CLINIC_NAME` - Your clinic name
- `VITE_API_BASE_URL` - Your backend API URL (if using real API)

**Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the client.

### Important Notes

- **SPA Routing:** All hosting options need to support Single Page Application routing (redirect all routes to `index.html`)
- **HTTPS:** Recommended for production to ensure secure data transmission
- **API CORS:** If connecting to a backend API, ensure CORS is properly configured
- **localStorage:** Current implementation uses browser localStorage, which is per-device. For multi-device sync, you'll need a real backend API

---

**Happy Exploring! 🎉**
