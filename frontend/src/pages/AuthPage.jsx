import React, { useState } from 'react';
import { api } from '../api';

export default function AuthPage({ onAuthSuccess }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number (e.g. 9876543210 or +919876543210)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.sendOtp(phone.trim());
      setMessage(data.message || 'OTP code sent via Minimoth!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!code || code.trim().length < 4) {
      setError('Please enter the verification code sent to your phone');
      return;
    }

    setLoading(true);
    try {
      const data = await api.verifyOtp(phone.trim(), code.trim(), name.trim());
      api.setToken(data.token);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Verification failed. Please double-check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💰</div>
          <h2>Personal Finance</h2>
          <p>Sign in or create your account using phone verification</p>
          <div className="minimoth-pill">
            <span>⚡ Powered by Minimoth OTP</span>
          </div>
        </div>

        {error && <div className="alert-box alert-error">⚠️ {error}</div>}
        {message && <div className="alert-box alert-success">✅ {message}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Phone Number</label>
              <div className="phone-row">
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP via WhatsApp/SMS'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div className="form-group">
              <label>Full Name (Optional for new users)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="otp-box">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    letterSpacing: '0.25em',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)'
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              style={{ marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP & Enter'}
            </button>

            <button
              type="button"
              className="nav-btn"
              style={{ width: '100%', marginTop: '8px', textAlign: 'center' }}
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
              }}
            >
              ← Change Phone Number
            </button>
          </form>
        )}

        <div className="dev-hint">
          💡 <strong>Workshop Note:</strong> With a live <code>MINIMOTH_API_KEY</code> in <code>backend/.env</code>, OTP delivers instantly to WhatsApp/SMS. In demo sandbox mode, enter code <code>123456</code>.
        </div>
      </div>
    </div>
  );
}
