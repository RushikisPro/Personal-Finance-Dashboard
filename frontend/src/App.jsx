import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import BudgetsPage from './pages/BudgetsPage';
import { api } from './api';
import './App.css';

export default function App() {
  const [token, setToken] = useState(api.getToken());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'budgets'

  const fetchDashboard = useCallback(async () => {
    if (!api.getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      if (err.message.includes('expired') || err.message.includes('invalid') || err.message.includes('missing')) {
        api.removeToken();
        setToken(null);
      } else {
        setError(err.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token, fetchDashboard]);

  const handleAuthSuccess = () => {
    setToken(api.getToken());
  };

  const handleLogout = () => {
    api.removeToken();
    setToken(null);
    setDashboardData(null);
  };

  // If user is not authenticated, show Page 1: AuthPage
  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar
        user={dashboardData?.user}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
          <button
            onClick={fetchDashboard}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && !dashboardData ? (
        <div className="card-box empty-state">
          <p>⏳ Loading financial dashboard...</p>
        </div>
      ) : currentPage === 'dashboard' ? (
        <DashboardPage
          dashboardData={dashboardData}
          onRefresh={fetchDashboard}
        />
      ) : (
        <BudgetsPage
          dashboardData={dashboardData}
          onRefresh={fetchDashboard}
        />
      )}
    </div>
  );
}

