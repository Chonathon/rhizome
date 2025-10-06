import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScopedControlsProvider } from '@/state/scopedControls'

const container = document.getElementById('root');
if (!container) throw new Error("Root container not found");
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ScopedControlsProvider>
          <App />
        </ScopedControlsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
