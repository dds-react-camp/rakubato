import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import { appRouter } from './router.tsx';
import { RouterProvider } from 'react-router-dom';
import { NavigationProvider } from './contexts/NavigationContext';
import { AppStateProvider } from './contexts/AppStateContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NavigationProvider> {/* NavigationProviderをRouterProviderの外側に移動 */}
      <AppStateProvider> {/* AppStateProviderも同様に移動 */}
        <RouterProvider router={appRouter} />
      </AppStateProvider>
    </NavigationProvider>
  </React.StrictMode>,
);
