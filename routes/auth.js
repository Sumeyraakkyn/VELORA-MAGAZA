const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const sql = require('mssql');

const router = express.Router();

// REGISTER (Kayıt)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType, adminCode, businessType, businessName, category, city } = req.body;

    // Validasyon
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur' });
    }

    if (userType === 'admin' && !adminCode) {
      return res.status(400).json({ success: false, message: 'Admin kodu zorunludur' });
    }

    const pool = getPool();
    
    // Email kontrol et
    const checkEmail = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluştur
    const result = await pool.request()
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('userType', sql.NVarChar, userType)
      .input('adminCode', sql.NVarChar, adminCode || null)
      .input('businessType', sql.NVarChar, businessType || null)
      .input('businessName', sql.NVarChar, businessName || null)
      .input('category', sql.NVarChar, category || null)
      .input('city', sql.NVarChar, city || null)
      .query(`
        INSERT INTO users (firstName, lastName, email, password, userType, adminCode, businessType, businessName, category, city)
        VALUES (@firstName, @lastName, @email, @password, @userType, @adminCode, @businessType, @businessName, @category, @city);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const userId = result.recordset[0].id;

    // JWT token oluştur
    const token = jwt.sign(
      { id: userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı!',
      token,
      user: {
        id: userId,
        firstName,
        lastName,
        email,
        userType
      }
    });

  } catch (err) {
    console.error('Register hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// LOGIN (Giriş)
router.post('/login', async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email ve şifre gereklidir' });
    }

    const pool = getPool();

    // Kullanıcıyı bul
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    const user = result.recordset[0];

    // Şifreyi kontrol et
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    // Admin ise, adminCode kontrol et
    if (user.userType === 'admin' && adminCode !== user.adminCode) {
      return res.status(401).json({ success: false, message: 'Admin kodu hatalı' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı!',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (err) {
    console.error('Login hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Profil Güncelle
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password, adminCode } = req.body;

    const pool = getPool();

    // Şifreyi hashle (varsa)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = hashedPassword
      ? `UPDATE users SET firstName = @firstName, lastName = @lastName, email = @email, password = @password, adminCode = @adminCode, updatedAt = GETDATE() WHERE id = @id`
      : `UPDATE users SET firstName = @firstName, lastName = @lastName, email = @email, adminCode = @adminCode, updatedAt = GETDATE() WHERE id = @id`;

    const request = pool.request()
      .input('id', sql.Int, id)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email)
      .input('adminCode', sql.NVarChar, adminCode);

    if (hashedPassword) {
      request.input('password', sql.NVarChar, hashedPassword);
    }

    await request.query(query);

    res.json({ success: true, message: 'Profil güncellendi' });

  } catch (err) {
    console.error('Profil güncelleme hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
