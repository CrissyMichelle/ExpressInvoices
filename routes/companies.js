const express = require('express');
const slugify = require("slugify");
const app = express();
app.use(express.json());

const db = require('../db');

// Returns list of companies
app.get('/companies', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT * FROM companies`);
        
        return res.json({companies: results.rows});
    } catch (err) {
        return next(err);
    }
});

// Return company object to include invoices. Return 404 if not found
app.get('/companies/:code', async (req, res, next) => {
    try {
        const companyRes = await db.query(
            `SELECT * FROM companies WHERE code=$1`,
            [req.params.code]
        );
        if (companyRes.rowCount === 0) {
            return res.status(404).json({message: "Company not found"});
        }

        const invoicesRes = await db.query(
            `SELECT * FROM invoices WHERE comp_code = $1`,
            [req.params.code]
        );
        const company = companyRes.rows[0];
        const invoices = invoicesRes.rows;
        
        return res.status(200).json({company: company, invoices: invoices});
    } catch (err) {
        return next(err);
    }
});

// Adds a new company, returning the added row
app.post('/companies', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        let code = slugify(name, {lower: true});

        const result = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({company: result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

// Edit existing company. Return 404 if not found
app.put('/companies/:code', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const { code } = req.params;

        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`,
            [name, description, code]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({message: "Company not found"});
        }
        return res.status(204).json({company: result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

// Deletes a company. Returns 404 if not found
app.delete('/companies/:code', async (req, res, next) => {
    try {
        const result = await db.query(
            "DELETE FROM companies WHERE code=$1",
            [req.params.code]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({message: "Company not found"});
        }
        return res.status(204).json({status: "Deleted"});
    } catch (err) {
        return next(err);
    }
});

module.exports = app;