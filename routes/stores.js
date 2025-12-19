const express = require('express');
const { getPool } = require('../db');
const sql = require('mssql');

const router = express.Router();

// TÜM MAĞAZALARI AL
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT s.*, u.firstName, u.lastName, u.email, u.businessName, u.category, u.city
        FROM stores s
        JOIN users u ON s.sellerId = u.id
      `);

    res.json({ success: true, stores: result.recordset });
  } catch (err) {
    console.error('Mağaza alma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// SATICI MAĞAZALARINI AL
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const pool = getPool();

    const result = await pool.request()
      .input('sellerId', sql.Int, sellerId)
      .query('SELECT * FROM stores WHERE sellerId = @sellerId');

    res.json({ success: true, stores: result.recordset });
  } catch (err) {
    console.error('Satıcı mağazaları alma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// MAĞAZA OLUŞTUR
router.post('/', async (req, res) => {
  try {
    const { sellerId, name, category, city } = req.body;

    if (!sellerId || !name) {
      return res.status(400).json({ success: false, message: 'Zorunlu alanlar eksik' });
    }

    const pool = getPool();

    const result = await pool.request()
      .input('sellerId', sql.Int, sellerId)
      .input('name', sql.NVarChar, name)
      .input('category', sql.NVarChar, category)
      .input('city', sql.NVarChar, city)
      .query(`
        INSERT INTO stores (sellerId, name, category, city)
        VALUES (@sellerId, @name, @category, @city);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const storeId = result.recordset[0].id;

    res.status(201).json({
      success: true,
      message: 'Mağaza oluşturuldu',
      storeId
    });

  } catch (err) {
    console.error('Mağaza oluşturma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
