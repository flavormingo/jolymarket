// main app component with routing and auth

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './lib/wagmi';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { SignUpModal } from './components/SignUpModal';
import { MarketsPage } from './pages/MarketsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { InfoPage } from './pages/InfoPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // initialize theme
  useTheme();

  // show auth modal if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated]);

  const handleAuthClose = () => {
    setShowAuthModal(false);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div className="loading">
          <div className="loading-spinner" />
          <span>loading jolymarket...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {showAuthModal && !isAuthenticated && (
        <SignUpModal onClose={handleAuthClose} />
      )}

      {isAuthenticated && (
        <>
          <Header />
          <Routes>
            <Route path="/" element={<MarketsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/market/:slug" element={<MarketDetailPage />} />
            <Route path="/market/:slug/:marketId" element={<MarketDetailPage />} />
          </Routes>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
