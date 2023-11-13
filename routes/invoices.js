const express = require('express');
const app = express();
app.use(express.json());

const db = require('./db');

// Returns info on invoices
app.get('/invoices', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM invoices'
        );
        return res.json({invoices: results.rows});
    } catch (err) {
        return next(err);
    }
});

// Returns given invoice object. Returns 404 if not found
app.get('/invoices/:id', async (req, res, next) => {
    try {
        const invoiceRes = await db.query(
            `SELECT invoices.id,invoices.amt,invoices.paid,invoices.add_date,invoices.paid_date, companies.* 
            FROM invoices
            JOIN companies ON companies.code=invoices.comp_code
            WHERE invoices.id=$1`,
            [req.params.id]
        );
        
        if (invoice.rowCount === 0) {
            return res.status(404).json({message: "Invoice not found"});
        }
        return res.status(200).json({invoice: invoiceRes.rows[0]});
    } catch (err) {
        next(err);
    }
});

// Adds an invoice, given company code and amount
app.post('/invoices', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        return res.status(201).json({invoice: result.rows[0]});
    } catch (err) {
        next(err);
    }
});

// Updates an invoice with a given amount. Returns 404 if not found
app.put('./invoices/:id', async (req, res, next) => {
    try {
        const invoice = req.params.id;
        const amount = req.body;

        const result = await db.query (
            `UPDATE invoices SET amt=$1
            WHERE id=$2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amount, invoice]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({message: "Invoice not found"});
        }
        return res.status(204).json({invoice: result.rows[0]});
    } catch (err) {
        next(err);
    }
});

// Deletes an invoice. Returns 404 if not found
app.delete('/invoices/:id', async (req, res, next) => {
    try {
        const invoice = req.params.id;

        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1`,
            [invoice]
        );
        if(result.rowCount === 0) {
            return res.status(404).json({message: "Invoice not found"});
        }
        return res.status(204).json({status: "deleted"});
    } catch (err) {
        next(err);
    }
});