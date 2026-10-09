require('dotenv').config();
const express = require('express');
const crypto = require('node:crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'personal_finance_workshop_secret_2026';

app.use(express.json());

// Minimal permissive CORS headers for local workshop development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Helper: Normalize phone to E.164 format (+91 by default for 10 digits)
function normalizePhone(input) {
  if (!input) return '';
  let cleaned = String(input).trim().replace(/[\s-]/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (!cleaned.startsWith('+') && /^\d+$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

// Helper: Lightweight secure signed token (HMAC-SHA256)
function generateToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: 'Session expired or token invalid' });
  }
  req.userId = decoded.userId;
  next();
}

// ==========================================
// 5 WORKSHOP BACKEND ENDPOINTS
// ==========================================

// 1. POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const formattedPhone = normalizePhone(phone);

    if (!formattedPhone || !/^\+\d{10,15}$/.test(formattedPhone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number with country code (e.g., +919876543210)' });
    }

    const hasRealKey = MINIMOTH_API_KEY && !MINIMOTH_API_KEY.includes('your_minimoth') && !MINIMOTH_API_KEY.includes('placeholder');

    if (hasRealKey) {
      const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': MINIMOTH_API_KEY,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || data.error || 'Failed to dispatch OTP via Minimoth'
        });
      }

      return res.json({
        success: true,
        message: 'OTP dispatched via Minimoth (WhatsApp/SMS)',
        otp_id: data.otp_id,
        phone: formattedPhone
      });
    }

    // Dev Fallback when MINIMOTH_API_KEY is not yet configured in .env
    console.log(`\n[Minimoth Dev Sandbox] Sending OTP to ${formattedPhone}. Use verification code: 123456\n(Set MINIMOTH_API_KEY in backend/.env for live delivery)\n`);
    return res.json({
      success: true,
      message: 'OTP sent! (Workshop Dev Mode: Use 123456. Add MINIMOTH_API_KEY to backend/.env for live WhatsApp/SMS)',
      is_demo: true,
      phone: formattedPhone
    });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Internal server error while sending OTP' });
  }
});

// 2. POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    const formattedPhone = normalizePhone(phone);

    if (!formattedPhone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    const hasRealKey = MINIMOTH_API_KEY && !MINIMOTH_API_KEY.includes('your_minimoth') && !MINIMOTH_API_KEY.includes('placeholder');

    if (hasRealKey) {
      const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': MINIMOTH_API_KEY,
        },
        body: JSON.stringify({ phone: formattedPhone, code: code.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || data.error || 'Invalid or expired OTP code'
        });
      }
    } else {
      // Dev mode validation: code 123456
      if (code.trim() !== '123456') {
        return res.status(400).json({ error: 'Invalid OTP code. Dev mode code is 123456' });
      }
    }

    // Upsert User in SQLite
    let user = db.prepare('SELECT id, phone, name, created_at FROM users WHERE phone = ?').get(formattedPhone);

    if (!user) {
      const userId = crypto.randomUUID();
      const userName = (name && name.trim()) ? name.trim() : `Member ${formattedPhone.slice(-4)}`;
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, phone, name, created_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, formattedPhone, userName, createdAt);

      user = { id: userId, phone: formattedPhone, name: userName, created_at: createdAt };

      // Seed initial sample budgets for common categories
      const initialBudgets = [
        { category: 'Food & Dining', limit: 8000 },
        { category: 'Housing & Utilities', limit: 25000 },
        { category: 'Shopping', limit: 5000 },
        { category: 'Transportation', limit: 4000 },
      ];
      for (const b of initialBudgets) {
        db.prepare(`
          INSERT INTO budgets (id, user_id, category, monthly_limit, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), userId, b.category, b.limit, createdAt);
      }
    } else if (name && name.trim() && user.name !== name.trim()) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), user.id);
      user.name = name.trim();
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      }
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Internal server error while verifying OTP' });
  }
});

// 3. GET /api/dashboard
app.get('/api/dashboard', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, phone, name FROM users WHERE id = ?').get(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = db.prepare(`
      SELECT id, user_id, title, amount, type, category, date, created_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
    `).all(req.userId);

    const budgets = db.prepare(`
      SELECT id, user_id, category, monthly_limit, created_at
      FROM budgets
      WHERE user_id = ?
      ORDER BY category ASC
    `).all(req.userId);

    let totalIncome = 0;
    let totalExpense = 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const categorySpent = {};

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (t.date && t.date.startsWith(currentMonth)) {
          categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
        }
      }
    }

    const budgetProgress = budgets.map((b) => {
      const spent = categorySpent[b.category] || 0;
      const limit = b.monthly_limit || 1;
      return {
        ...b,
        spent,
        remaining: Math.max(0, limit - spent),
        percentage: Math.min(100, Math.round((spent / limit) * 100)),
        isOverBudget: spent > limit
      };
    });

    res.json({
      user,
      summary: {
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
      },
      transactions,
      budgets: budgetProgress,
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ error: 'Internal server error while fetching dashboard' });
  }
});

// 4. POST /api/transactions
app.post('/api/transactions', authMiddleware, (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Transaction title is required' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: "Type must be either 'income' or 'expense'" });
    }

    const cleanCategory = (category && category.trim()) || 'General';
    const cleanDate = (date && date.trim()) || new Date().toISOString().slice(0, 10);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (id, user_id, title, amount, type, category, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, title.trim(), parsedAmount, type, cleanCategory, cleanDate, createdAt);

    res.status(201).json({
      success: true,
      transaction: {
        id,
        user_id: req.userId,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: cleanCategory,
        date: cleanDate,
        created_at: createdAt
      }
    });
  } catch (err) {
    console.error('add transaction error:', err);
    res.status(500).json({ error: 'Internal server error while creating transaction' });
  }
});

// 5. POST /api/budgets
app.post('/api/budgets', authMiddleware, (req, res) => {
  try {
    const { category, monthly_limit } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }
    const parsedLimit = parseFloat(monthly_limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Monthly limit must be a positive number' });
    }

    const cleanCategory = category.trim();
    const existing = db.prepare('SELECT id FROM budgets WHERE user_id = ? AND category = ?').get(req.userId, cleanCategory);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare('UPDATE budgets SET monthly_limit = ? WHERE id = ?').run(parsedLimit, existing.id);
      return res.json({
        success: true,
        budget: {
          id: existing.id,
          user_id: req.userId,
          category: cleanCategory,
          monthly_limit: parsedLimit
        }
      });
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO budgets (id, user_id, category, monthly_limit, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, req.userId, cleanCategory, parsedLimit, now);

      return res.status(201).json({
        success: true,
        budget: {
          id,
          user_id: req.userId,
          category: cleanCategory,
          monthly_limit: parsedLimit,
          created_at: now
        }
      });
    }
  } catch (err) {
    console.error('set budget error:', err);
    res.status(500).json({ error: 'Internal server error while saving budget' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Minimoth Key: ${MINIMOTH_API_KEY ? 'Configured' : 'Not set (using dev sandbox mode)'}`);
});
