import { render, screen } from '@testing-library/react';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { NavigationProvider } from '../contexts/NavigationContext'; // Import NavigationProvider

describe('App', () => {
  it('should render the App component with sidebar', () => {
    render(
      <MemoryRouter>
        <NavigationProvider> {/* Wrap App with NavigationProvider */}
          <App />
        </NavigationProvider>
      </MemoryRouter>
    );
    // サイドバーの「Menu」タイトルが存在することを確認
    expect(screen.getByRole('heading', { name: /Menu/i })).toBeInTheDocument();
    // サイドバーのリンクが存在することを確認
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Choices/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });
});
