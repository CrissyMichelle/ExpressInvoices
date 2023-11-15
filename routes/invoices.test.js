const request = require('supertest');
const app = require('./invoices');
const db = require('../db');

let isConnected = true;
beforeAll(async () => {
    if (!isConnected) {    
        await db.connect();
        isConnected = true;
    }
})

afterAll(async () => {
    if (isConnected) {
        await db.end();
        isConnected = false;
    }
})

describe("GET /", () => {
    test("Gets a list of invoices", async () => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Object);
    });
});

describe("GET /1", () => {
    test("Gets a single invoice", async () => {
        const response = await request(app).get("/1");
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Object);

        expect(response.body.invoice).toHaveProperty('id');
        expect(response.body.invoice).toHaveProperty('comp_code');
        expect(response.body.invoice).toHaveProperty('amt');
        expect(response.body.invoice).toHaveProperty('paid');
        expect(response.body.invoice).toHaveProperty('add_date');
        expect(response.body.invoice).toHaveProperty('paid_date');
    });
});

describe("POST /", () => {
    test("Creates a new row in invoices", async () => {
        const newRow = {id: 9999, comp_code: 'OpenAI', amt: 19.99, paid: 'f', add_date: '2023-11-14', paid_date: '2022-11-30'}
        const response = await request(app).post("/").send(newRow);
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('invoice');

        expect(response.body.invoice).toHaveProperty('id', 9999);
        expect(response.body.invoice).toHaveProperty('comp_code', 'OpenAI');
        expect(response.body.invoice).toHaveProperty('amt', 19.99);
        expect(response.body.invoice).toHaveProperty('paid', 'f');
        expect(response.body.invoice).toHaveProperty('add_date', '2023-11-14');
        expect(response.body.invoice).toHaveProperty('paid_date', '2022-11-30');
    });
});

describe("PUT /9999", () => {
    beforeEach(async () => {
        await db.query("DELETE FROM invoices WHERE comp_code='OpenAI'");
        await db.query(
            `INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date)
            VALUES (9999, 'OpenAI', 19.99, 'f', '2023-11-14', '2022-11-30')`
        );
    });
    afterEach(async () => {
        await db.query(
            `DELETE FROM invoices
            WHERE comp_code='OpenAI'`
        )
    });

    test("Edits an existing invoice record", async () => {
        const editRow = {comp_code: 'ChatGPT', amt: 31.99}
        const response = await request(app).put("/9999").send(editRow);

        expect(response.statusCode).toBe(204);
        // A 204 response doesn't have body content

        // Verify updates w/ a GET request
        const verifyRes = await request(app).get("/9999");

        expect(verifyRes.body.invoice).toHaveProperty('comp_code', 'ChatGPT');
        expect(verifyRes.body.company).toHaveProperty('amt', 31.99);
    });
});

describe("DELETE /9999", () => {
    beforeEach(async () => {
        await db.query(
            `INSERT INTO invoices (id, comp_code, amt, paid, add_date, paid_date)
            VALUES (9999, 'OpenAI', 19.99, 'f', '2023-11-14', '2022-11-30')`
        );
    });
    afterEach(async () => {
        const res = await db.query(
            `SELECT * FROM invoices
            WHERE comp_code='OpenAI'`
        );
        if (res.rowCount > 0) {
            await db.query(
                `DELETE FROM invoices
                WHERE comp_code='OpenAI'`
            );
        }
    });

    test("Deletes a company record", async () => {
        const response = await request(app).delete("/9999");
        expect(response.statusCode).toBe(204);

        // Verify deletion with a GET request that returns 404
        const verifyDel = await request(app).get("/9999");
        expect(verifyDel.statusCode).toBe(404);
    });
});