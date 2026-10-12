import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const url = ('http://localhost:3000')

test('Fetch the page', () => {
    let response = fetch(url);
    assert.equal(response.ok, response.ok);
})

