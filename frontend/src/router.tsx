import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen';
import TypeSelectionScreen from './pages/TypeSelectionScreen';
import ComparisonScreen from './pages/ComparisonScreen';
import BattleScreen from './pages/BattleScreen';
// import ProductDetailScreen from './pages/ProductDetailScreen';

const routes = [
  {
    path: '/',
    element: <WelcomeScreen />,
  },
  {
    path: '/type-selection',
    element: <TypeSelectionScreen />,
  },
  {
    path: '/comparison',
    element: <ComparisonScreen />,
  },
    {
    path: '/battle/:param1/:param2',
    element: <BattleScreen />,
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const appRouter = createBrowserRouter(routes);

// eslint-disable-next-line react-refresh/only-export-components
export const createTestRouter = (initialEntries?: string[]) => {
  return createMemoryRouter(routes, {
    initialEntries: initialEntries || ['/'],
  });
};

const AppRouter = () => {
  return <RouterProvider router={appRouter} />;
};

export default AppRouter;
