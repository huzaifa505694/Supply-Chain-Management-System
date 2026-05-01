const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');

// Initialize Thick mode for Oracle 11g
try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (err) {
  console.error('Failed to initialize Oracle Client:', err);
}

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  user: 'DATABASE7',
  password: 'pro123',
  connectionString: 'localhost:1521/XE' // Oracle 11g Express default
};

// Connect and execute helper
async function runQuery(query, binds = []) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// 1. Auth Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await runQuery(`SELECT USER_ROLE FROM APP_USERS WHERE USERNAME = :1 AND PASSWORD = :2`, [username, password]);
    if (users.length > 0) {
      res.json({ success: true, role: users[0].USER_ROLE });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Products Endpoint
app.get('/api/products', async (req, res) => {
  try {
    const products = await runQuery(`
      SELECT p.PRODUCT_ID as "id", p.NAME as "name", p.STOCK_QUANTITY as "stock", p.PRICE as "price",
             w.NAME as "warehouse", s.NAME as "supplier"
      FROM PRODUCTS p
      LEFT JOIN WAREHOUSES w ON p.WAREHOUSE_ID = w.WAREHOUSE_ID
      LEFT JOIN SUPPLIERS sup ON p.SUPPLIER_ID = sup.SUPPLIER_ID
      LEFT JOIN PERSON s ON sup.PERSON_ID = s.PERSON_ID
    `);
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Orders Endpoint
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await runQuery(`
      SELECT o.ORDER_ID as "id", TO_CHAR(o.ORDER_DATE, 'YYYY-MM-DD') as "date", o.BILL as "amount",
             p.NAME as "retailer"
      FROM ORDERS o
      LEFT JOIN RETAILERS r ON o.RETAILER_ID = r.RETAILER_ID
      LEFT JOIN PERSON p ON r.PERSON_ID = p.PERSON_ID
    `);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Shipments Endpoint
app.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await runQuery(`
      SELECT s.SHIPMENT_ID as "id", s.TRACKING_NUMBER as "tracking", s.STATUS as "status",
             s.SHIPMENT_DATE as "date", lp.COMPANY_NAME as "provider", o.ORDER_ID as "orderId", s.SHIPMENT_TYPE as "type"
      FROM SHIPMENT s
      LEFT JOIN LOGISTICS_PROVIDERS lp ON s.PROVIDER_ID = lp.PROVIDER_ID
      LEFT JOIN ORDERS o ON s.ORDER_ID = o.ORDER_ID
    `);
    res.json(shipments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Warehouses Endpoint
app.get('/api/warehouses', async (req, res) => {
  try {
    const wh = await runQuery(`
      SELECT WAREHOUSE_ID as "id", NAME as "name", LOCATION as "location", CAPACITY as "capacity", WAREHOUSE_TYPE as "type", MANAGER_NAME as "manager"
      FROM WAREHOUSES
    `);
    res.json(wh);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Partners Endpoint (GET)
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await runQuery(`
      SELECT PERSON_ID as "id", NAME as "name", COUNTRY as "country", EMAIL as "email", PERSON_TYPE as "type", PHONE_NUMBER as "phone", ADDRESS as "address"
      FROM PERSON
      UNION ALL
      SELECT PROVIDER_ID as "id", COMPANY_NAME as "name", AREA as "country", '' as "email", 'Logistics' as "type", CONTACT_NUMBER as "phone", '' as "address"
      FROM LOGISTICS_PROVIDERS
    `);
    res.json(partners);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Add Partner Endpoint (POST)
app.post('/api/partners', async (req, res) => {
  const { name, email, phone, country, address, type, area, transportMode, contactNumber } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    if (type === 'Supplier' || type === 'Retailer') {
      // Trigger TRG_PERSON_ID handles ID generation automatically
      const result = await connection.execute(
        `INSERT INTO PERSON (NAME, COUNTRY, EMAIL, PHONE_NUMBER, ADDRESS, PERSON_TYPE) 
         VALUES (:1, :2, :3, :4, :5, :6) RETURNING PERSON_ID INTO :7`,
        { 1: name, 2: country, 3: email, 4: phone, 5: address, 6: type.toUpperCase(), 7: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
      );
      const nextPersonId = result.outBinds[0][0];
      if (type === 'Supplier') {
        await connection.execute(`INSERT INTO SUPPLIERS (SUPPLIER_ID, PERSON_ID) VALUES (SEQ_SUPPLIER_ID.NEXTVAL, :1)`, [nextPersonId]);
      } else {
        await connection.execute(`INSERT INTO RETAILERS (RETAILER_ID, PERSON_ID) VALUES (SEQ_RETAILER_ID.NEXTVAL, :1)`, [nextPersonId]);
      }
    } else if (type === 'Logistics') {
      await connection.execute(`INSERT INTO LOGISTICS_PROVIDERS (PROVIDER_ID, COMPANY_NAME, TRANSPORT_MODE, AREA, CONTACT_NUMBER) VALUES (SEQ_PROVIDER_ID.NEXTVAL, :1, :2, :3, :4)`,
        [name, transportMode, area, contactNumber]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// 8. Delete Partner (Using Stored Procedure)
app.delete('/api/partners/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await runQuery(`BEGIN PROC_DELETE_PARTNER(:1); END;`, [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. Stats Endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await runQuery(`
      SELECT 
        (SELECT COUNT(*) FROM PRODUCTS) as "products",
        (SELECT COUNT(*) FROM ORDERS) as "orders",
        (SELECT COUNT(*) FROM SHIPMENT WHERE STATUS != 'Delivered') as "shipments",
        (SELECT COUNT(*) FROM PRODUCTS WHERE STOCK_QUANTITY < 20) as "lowStock"
      FROM DUAL
    `);
    res.json(stats[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. POST Order (Using Stored Procedure)
app.post('/api/orders', async (req, res) => {
  const { retailerId, amount, productId, quantity } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `BEGIN PROC_PLACE_ORDER(:1, :2, :3, :4, :5); END;`,
      {
        1: retailerId,
        2: productId,
        3: quantity,
        4: amount,
        5: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );
    await connection.commit();
    res.json({ success: true, id: result.outBinds[0] });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally { if (connection) await connection.close(); }
});

// 11. DELETE Order
app.delete('/api/orders/:id', async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM INCLUDE WHERE ORDER_ID = :1`, [id]);
    await connection.execute(`DELETE FROM SHIPMENT WHERE ORDER_ID = :1`, [id]);
    await connection.commit();
    await connection.execute(`DELETE FROM ORDERS WHERE ORDER_ID = :1`, [id]);
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { if (connection) await connection.close(); }
});

// 12. Update Product (PUT)
app.put('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  const { name, price, stock } = req.body;
  try {
    await runQuery(`UPDATE PRODUCTS SET NAME = :1, PRICE = :2, STOCK_QUANTITY = :3 WHERE PRODUCT_ID = :4`, [name, price, stock, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 13. Update Partner (PUT)
app.put('/api/partners/:id', async (req, res) => {
  const id = req.params.id;
  const { name, email, phone, country, address } = req.body;
  try {
    await runQuery(`UPDATE PERSON SET NAME = :1, EMAIL = :2, PHONE_NUMBER = :3, COUNTRY = :4, ADDRESS = :5 WHERE PERSON_ID = :6`, 
      [name, email, phone, country, address, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 14. POST Warehouse
app.post('/api/warehouses', async (req, res) => {
  const { name, location, capacity, type, manager } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`INSERT INTO WAREHOUSES (WAREHOUSE_ID, NAME, LOCATION, CAPACITY, WAREHOUSE_TYPE, MANAGER_NAME) VALUES (SEQ_WAREHOUSE_ID.NEXTVAL, :1, :2, :3, :4, :5) RETURNING WAREHOUSE_ID INTO :6`,
      { 1: name, 2: location, 3: capacity, 4: type.toUpperCase(), 5: manager, 6: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });
    const nextId = result.outBinds[0][0];
    if (type.toUpperCase() === 'GENERAL') {
      await connection.execute(`INSERT INTO GENERAL_WAREHOUSE (WAREHOUSE_ID, LAYOUT_STRUCTURE) VALUES (:1, 'Standard')`, [nextId]);
    } else {
      await connection.execute(`INSERT INTO COLD_WAREHOUSE (WAREHOUSE_ID, COOLING_SYSTEM_ID) VALUES (:1, 'Standard')`, [nextId]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { if (connection) await connection.close(); }
});

// 15. DELETE Shipment
app.delete('/api/shipments/:id', async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM OVERNIGHT_SHIP WHERE SHIPMENT_ID = :1`, [id]);
    await connection.execute(`DELETE FROM DAY_SHIP WHERE SHIPMENT_ID = :1`, [id]);
    await connection.execute(`DELETE FROM SHIPMENT WHERE SHIPMENT_ID = :1`, [id]);
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { if (connection) await connection.close(); }
});

// 16. POST Product
app.post('/api/products', async (req, res) => {
  const { name, price, stock, warehouseId, supplierId } = req.body;
  try {
    await runQuery(`INSERT INTO PRODUCTS (PRODUCT_ID, NAME, PRICE, STOCK_QUANTITY, WAREHOUSE_ID, SUPPLIER_ID) VALUES (SEQ_PRODUCT_ID.NEXTVAL, :1, :2, :3, :4, :5)`,
      [name, price, stock, warehouseId, supplierId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 17. DELETE Product
app.delete('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM INCLUDE WHERE PRODUCT_ID = :1`, [id]);
    await connection.execute(`DELETE FROM PRODUCTS WHERE PRODUCT_ID = :1`, [id]);
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { if (connection) await connection.close(); }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('ChainFlow Backend running on http://localhost:' + PORT);
});
