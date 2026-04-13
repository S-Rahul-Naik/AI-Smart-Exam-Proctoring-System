import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress WebGL/WASM/TensorFlow warnings during library initialization
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString?.() || '';
  // Filter out common WASM, WebGL, and TensorFlow warnings
  const suppressed = [
    'oneDNN',
    'OpenGL',
    'WASM',
    'TensorFlow',
    'Lit',
    'lit',
    'deprecated',
  ].some(s => message.includes(s));
  
  if (!suppressed) {
    originalWarn(...args);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
