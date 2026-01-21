import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDummyData } from './utils/seedData'

// Seed dummy data if localStorage is empty
// Run immediately to ensure it happens before React renders
if (typeof window !== 'undefined') {
  seedDummyData();
  // Make it available globally for manual seeding
  (window as any).seedDummyData = () => seedDummyData(true);
  console.log('To manually seed data, run: window.seedDummyData()');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
