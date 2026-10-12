import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.CLIENT_URL

test('Fetch the page', async () => {
    const response = await fetch(url);
    assert(response.status, 200)
})

