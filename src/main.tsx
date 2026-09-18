import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {SharedETAPublicView} from './components/SharedETAPublicView.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// No router library needed for one public, unauthenticated route: a friend
// opening a copied /share/:id link sees the live ETA page instead of the app.
const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)\/?$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shareMatch ? <SharedETAPublicView shareId={shareMatch[1]} /> : <App />}
  </StrictMode>,
);
