import Sidebar from './components/layout/Sidebar';
import { useNavigation } from './contexts/NavigationContext';

function App() {
  const { isSidebarOpen, closeSidebar } = useNavigation();

  return (
    <div className="App">
      {/* NavigationProviderとAppStateProviderはmain.tsxでレンダリングされるため、ここには不要 */}
      {/* AppRouterもmain.tsxでレンダリングされるため、ここには不要 */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
    </div>
  );
}

export default App;
