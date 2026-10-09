import React from 'react';

export default function Navbar({ user, currentPage, setCurrentPage, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">💳</div>
        <div>
          <h1>
            Personal Finance
            <span className="brand-badge">Minimoth OTP</span>
          </h1>
        </div>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${currentPage === 'budgets' ? 'active' : ''}`}
          onClick={() => setCurrentPage('budgets')}
        >
          🎯 Budgets
        </button>
      </nav>

      <div className="nav-user">
        <div className="user-badge">
          👤 {user?.name || user?.phone || 'Member'}
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign Out">
          Logout
        </button>
      </div>
    </header>
  );
}
