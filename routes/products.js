const express = require('express');
const { getPool } = require('../db');
const sql = require('mssql');

const router = express.Router();

// TÜM ÜRÜNLERI AL
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM products ORDER BY createdAt DESC');

    res.json({ success: true, products: result.recordset });
  } catch (err) {
    console.error('Ürün alma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// SAT ICININ ÜRÜNLERINI AL
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const pool = getPool();

    const result = await pool.request()
      .input('sellerId', sql.Int, sellerId)
      .query('SELECT * FROM products WHERE sellerId = @sellerId ORDER BY createdAt DESC');

    res.json({ success: true, products: result.recordset });
  } catch (err) {
    console.error('Satıcı ürünleri alma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// ÜRÜN OLUŞTUR
router.post('/', async (req, res) => {
  try {
    const { sellerId, name, price, category, description, stock } = req.body;

    if (!sellerId || !name || !price) {
      return res.status(400).json({ success: false, message: 'Zorunlu alanlar eksik' });
    }

    const pool = getPool();

    const result = await pool.request()
      .input('sellerId', sql.Int, sellerId)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('category', sql.NVarChar, category)
      .input('description', sql.NVarChar, description)
      .input('stock', sql.Int, stock || 0)
      .query(`
        INSERT INTO products (sellerId, name, price, category, description, stock)
        VALUES (@sellerId, @name, @price, @category, @description, @stock);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const productId = result.recordset[0].id;

    res.status(201).json({
      success: true,
      message: 'Ürün oluşturuldu',
      productId
    });

  } catch (err) {
    console.error('Ürün oluşturma hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// ÜRÜN SİL
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM products WHERE id = @id');

    res.json({ success: true, message: 'Ürün silindi' });

  } catch (err) {
    console.error('Ürün silme hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
