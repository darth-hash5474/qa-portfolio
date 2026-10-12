import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.SERVER_URL
const valid_user = process.env.TEST_USER
const valid_pass = process.env.TEST_PASS

test('Login with given credentials', async () => {   
    const payload = {username: valid_user, password: valid_pass}
    const response = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const token = await response.json();
    assert.equal(response.status, 200)
    assert.equal(token, token);
});

test('Login with invalid password', async () => {   
    let psswd = ("testPass123") 
    // Send a payload with the wrong password, right username
    const payload = {username: valid_user, password: psswd}
    const response = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    // Generate the same error message for assertion
    const resMessage = await response.json();
    const psswdMsg = {
        message: "Password is incorrect...Try clicking 'Forgot your password' ; )", 
        password: psswd
    };

    // Parse the data into a json string for assertion
    const jsonErr = JSON.stringify(resMessage);
    const jsonMsg = JSON.stringify(psswdMsg);

    // The response returns 200 and the json strings match
    assert.equal(response.status, 200);
    assert.equal(jsonErr, jsonMsg);
});

test('Login with invalid username', async () => {
    let user = ("testUser123") 
    // This time send it with an invalid username, but valid password
    const payload = {username: user, password: valid_pass}
    const response = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    // Generate the error messages for the username error
    const resMessage = await response.json();
    const userMsg = {
        message: "Username is incorrect", 
        username: user
    };
    
    const jsonErr = JSON.stringify(resMessage);
    const jsonMsg = JSON.stringify(userMsg);

    // Again the response returns 200 and the json data matches
    assert.equal(response.status, 200);
    assert.equal(jsonErr, jsonMsg);

});