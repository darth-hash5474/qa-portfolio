import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict'

test('Login with given credentials', () => {    
    const user = (process.env.USERNAME);
    const pass = (process.env.PASSWORD);

    const payload = {"username": user, "password": pass}

    const response = fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
    assert.equal(response.ok, response.ok);
})

