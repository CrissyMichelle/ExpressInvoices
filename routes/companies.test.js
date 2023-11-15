const request = require('supertest');
const app = require('./companies');
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

describe("GET /companies", () => {
    test("Gets a list of companies", async () => {
        const response = await request(app).get("/companies");
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Object);
    });
});

describe("GET /companies/apple", () => {
    test("Gets a single company", async () => {
        const response = await request(app).get("/companies/apple");
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Object);

        expect(response.body.company).toHaveProperty('code');
        expect(response.body.company).toHaveProperty('name');
        expect(response.body.company).toHaveProperty('description');
    });
});

describe("POST /companies", () => {
    test("Creates a new row in companies", async () => {
        const newRow = {code: 'OpenAI', name: 'ChatGPT', description: 'Large Language Model'}
        const response = await request(app).post("/companies").send(newRow);
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('company');

        expect(response.body.company).toHaveProperty('code', 'OpenAI');
        expect(response.body.company).toHaveProperty('name', 'ChatGPT');
        expect(response.body.company).toHaveProperty('description', 'Large Language Model');
    });
});

describe("PUT /companies/OpenAI", () => {
    beforeEach(async () => {
        await db.query("DELETE FROM companies WHERE code='OpenAI'");
        await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ('OpenAI', 'ChatGPT', 'Large Language Model')`
        );
    });
    afterEach(async () => {
        await db.query(
            `DELETE FROM companies
            WHERE code='OpenAI'`
        )
    });

    test("Edits an existing company record", async () => {
        const editRow = {name: 'Cathy Gwin Parker Tal', description: 'my dearest coding tutor'}
        const response = await request(app).put("/companies/OpenAI").send(editRow);

        expect(response.statusCode).toBe(204);
        // A 204 response doesn't have body content

        // Verify updates w/ a GET request
        const verifyRes = await request(app).get("/companies/OpenAI");

        expect(verifyRes.body.company).toHaveProperty('name', 'Cathy Gwin Parker Tal');
        expect(verifyRes.body.company).toHaveProperty('description', 'my dearest coding tutor');
    });
});

describe("DELETE /companies/OpenAI", () => {
    beforeEach(async () => {
        await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ('OpenAI', 'ChatGPT', 'Large Language Model')`
        );
    });
    afterEach(async () => {
        const res = await db.query(
            `SELECT * FROM companies
            WHERE code='OpenAI'`
        );
        if (res.rowCount > 0) {
            await db.query(
                `DELETE FROM companies
                WHERE code='OpenAI'`
            );
        }
    });

    test("Deletes a company record", async () => {
        const response = await request(app).delete("/companies/OpenAI");
        expect(response.statusCode).toBe(204);

        // Verify deletion with a GET request that returns 404
        const verifyDel = await request(app).get("/companies/OpenAI");
        expect(verifyDel.statusCode).toBe(404);
    });
});