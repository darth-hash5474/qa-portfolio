import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

const url = process.env.SERVER_URL
const valid_user = process.env.TEST_USER
const valid_pass = process.env.TEST_PASS

const file_path = new URL('../test_files/test_img.png', import.meta.url);
if (!file_path)
    console.log("Double check the loaded file path");

const imageBuffer = fs.readFileSync(file_path);
const base64String = imageBuffer.toString('base64');

test('Attempt to upload a game with the valid token', async () => {   
    const payload = {username: valid_user, password: valid_pass}
    const response = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const token = await response.json();
    assert.equal(response.status, 200);
    assert.equal(token, token);

    const gamesUrl = `${url}/games`;

    const newGame = {
        title: "Test Game",
        description: "A game uploaded purely for testing purposes",
        coverArt: `data:image/png;base64,${base64String}`,
        releaseDate: "10-12-2026"
    };

    const postGame = await fetch(gamesUrl, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGame)
    });

    assert.equal(postGame.status, 201);
});

// Security Bug: A user can upload a game and alter data, even without logging in
test('Attempt to upload a game without logging in', async () => {   
    const gamesUrl = `${url}/games`;

    const newGame = {
        title: "Test Game",
        description: "A game uploaded purely for testing purposes",
        coverArt: `data:image/png;base64,${base64String}`,
        releaseDate: "10-12-2026"
    };

    const postGame = await fetch(gamesUrl, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGame)
    });

    assert.equal(postGame.status, 401);
});

