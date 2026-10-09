import React, { useState } from 'react';
import { api } from '../api';

const CATEGORIES = [
  'Food & Dining',
  'Housing & Utilities',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Salary & Income',
  'Healthcare',
  'Other'
];

const CATEGORY_ICONS = {
  'Food & Dining': '🍔',
  'Housing & Utilities': '🏠',
  'Shopping': '🛍️',
  'Transportation': '🚗',
  'Entertainment': '🎬',
  'Salary & Income': '💼',
  'Healthcare': '🏥',
  'Other': '📦'
};

export default function DashboardPage({ dashboardData, onRefresh }) {
  const { summary = {}, transactions = [], user = {} } = dashboardData || {};

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a transaction title');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.addTransaction({
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        date
      });
      setTitle('');
      setAmount('');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time cash flow and transaction activity for {user.name || 'your account'}</p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">
            <span>Net Balance</span>
            <span>💰</span>
          </div>
          <div className={`metric-amount ${summary.balance < 0 ? 'expense' : 'income'}`}>
            {formatCurrency(summary.balance)}
          </div>
          <div className="metric-sub">Total savings & available funds</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">
            <span>Total Income</span>
            <span>📈</span>
          </div>
          <div className="metric-amount income">
            +{formatCurrency(summary.totalIncome)}
          </div>
          <div className="metric-sub">All inbound payments</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">
            <span>Total Expenses</span>
            <span>📉</span>
          </div>
          <div className="metric-amount expense">
            -{formatCurrency(summary.totalExpense)}
          </div>
          <div className="metric-sub">All outbound spending</div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="dashboard-grid">
        {/* Form: Add Transaction */}
        <div className="card-box">
          <h3>
            <span>Add Transaction</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>+ Quick Entry</span>
          </h3>

          {error && <div className="alert-box alert-error">⚠️ {error}</div>}

          <form onSubmit={handleAddTransaction}>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense (-)
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
                onClick={() => setType('income')}
              >
                Income (+)
              </button>
            </div>

            <div className="form-group">
              <label>Description / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'expense' ? 'e.g. Grocery store' : 'e.g. Monthly salary'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat] || '🏷️'} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Saving...' : `Record ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div className="card-box">
          <h3>
            <span>Recent Transactions</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {transactions.length} record{transactions.length === 1 ? '' : 's'}
            </span>
          </h3>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions recorded yet.</p>
              <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
                Use the form on the left to add your first income or expense!
              </p>
            </div>
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => {
                const icon = CATEGORY_ICONS[tx.category] || '🏷️';
                return (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-left">
                      <div className="tx-icon">{icon}</div>
                      <div className="tx-info">
                        <h4>{tx.title}</h4>
                        <span>
                          {tx.category} • {tx.date}
                        </span>
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

