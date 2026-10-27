import '@flowcanvas/ui/styles.css';
import { preventReactAriaStyleInjection } from '@flowcanvas/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

preventReactAriaStyleInjection();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Flowcanvas could not start: the #root element is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App buildInfo={__FLOWCANVAS_BUILD__} />
  </StrictMode>,
);
