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

---

**Happy Exploring! 🎉**
