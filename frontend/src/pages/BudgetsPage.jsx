import React, { useState } from 'react';
import { api } from '../api';

const CATEGORIES = [
  'Food & Dining',
  'Housing & Utilities',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Other'
];

const CATEGORY_ICONS = {
  'Food & Dining': '🍔',
  'Housing & Utilities': '🏠',
  'Shopping': '🛍️',
  'Transportation': '🚗',
  'Entertainment': '🎬',
  'Healthcare': '🏥',
  'Other': '📦'
};

export default function BudgetsPage({ dashboardData, onRefresh }) {
  const { budgets = [] } = dashboardData || {};

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please provide a valid positive budget limit');
      return;
    }

    setSubmitting(true);
    try {
      await api.setBudget({
        category,
        monthly_limit: limit
      });
      setSuccess(`Budget for ${category} successfully set to ${formatCurrency(limit)}/month`);
      setMonthlyLimit('');
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Monthly Budgets & Spending Limits</h2>
        <p>Monitor your category thresholds and prevent overspending this month</p>
      </div>

      {/* Set / Update Budget Card */}
      <div className="card-box" style={{ maxWidth: '600px', marginBottom: '28px' }}>
        <h3>
          <span>Set Category Budget Limit</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🎯 Monthly Goal</span>
        </h3>

        {error && <div className="alert-box alert-error">⚠️ {error}</div>}
        {success && <div className="alert-box alert-success">✅ {success}</div>}

        <form onSubmit={handleSetBudget} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Monthly Limit (₹)</label>
            <input
              type="number"
              step="any"
              className="form-input"
              placeholder="e.g. 5000"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            style={{ width: 'auto', padding: '10px 20px', height: '42px' }}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Set Budget'}
          </button>
        </form>
      </div>

      {/* Category Budgets Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
        Current Month Budget Progress
      </h3>

      {budgets.length === 0 ? (
        <div className="card-box empty-state">
          <p>No budget limits configured yet.</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
            Set a monthly spending limit above to start tracking your category progress!
          </p>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const icon = CATEGORY_ICONS[b.category] || '🏷️';
            let badgeClass = 'normal';
            let badgeText = `${b.percentage}% Spent`;

            if (b.isOverBudget) {
              badgeClass = 'exceeded';
              badgeText = 'Over Budget!';
            } else if (b.percentage >= 75) {
              badgeClass = 'warning';
              badgeText = `${b.percentage}% Nearing Limit`;
            }

            return (
              <div key={b.id || b.category} className="budget-card">
                <div className="budget-top">
                  <div className="budget-cat">
                    {icon} {b.category}
                  </div>
                  <span className={`budget-badge ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${badgeClass}`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="budget-stats">
                  <div>
                    Spent: <strong>{formatCurrency(b.spent)}</strong>
                  </div>
                  <div>
                    Limit: <strong>{formatCurrency(b.monthly_limit)}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: b.isOverBudget ? 'var(--rose)' : 'var(--text-dim)' }}>
                  {b.isOverBudget
                    ? `⚠️ Exceeded budget by ${formatCurrency(b.spent - b.monthly_limit)}`
                    : `Remaining: ${formatCurrency(b.remaining)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
