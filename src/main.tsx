import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const container = document.getElementById('root');
if (!container) throw new Error("Root container not found");
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
        <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <App />
            </ThemeProvider>
        </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
