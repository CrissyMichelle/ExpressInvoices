const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

let router = new express.Router();

// Returns info on invoices
router.get('/', async (req, res, next) => {
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
router.get('/:id', async (req, res, next) => {
    try {
        let id = req.params.id;
        const invoiceRes = await db.query(
            `SELECT invoices.id,invoices.amt,invoices.paid,invoices.add_date,invoices.paid_date, companies.* 
            FROM invoices
            JOIN companies ON companies.code=invoices.comp_code
            WHERE invoices.id=$1`,
            [id]
        );
        
        if (invoiceRes.rowCount === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404);
        }
        return res.status(200).json({invoice: invoiceRes.rows[0]});
    } catch (err) {
        next(err);
    }
});

// Adds an invoice, given company code and amount
router.post('/', async (req, res, next) => {
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

// Updates an invoice with a given amount or clears paid_date if marking unpaid. Returns 404 if not found
router.put('/:id', async (req, res, next) => {
    try {
        const {amt, paid} = req.body;
        const id = req.params.id;
        let paidDate = null;

        const currResult = await db.query(
            `SELECT paid
            FROM invoices
            WHERE id = $1`,
            [id]
        );

        if (currResult.rows.length === 0) {
            throw new ExpressError(`Invoice not found ${id}`, 404);
        }
        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query (
            `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );
    
        return res.status(204).json({invoice: result.rows[0]});
    } catch (err) {
        next(err);
    }
});

// Deletes an invoice. Returns 404 if not found
router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1`,
            [id]
        );
        if(result.rowCount === 0) {
            throw new ExpressError(`Invoice not found ${id}`, 404);
        }
        return res.status(204).json({status: "deleted"});
    } catch (err) {
        next(err);
    }
});

module.exports = router;