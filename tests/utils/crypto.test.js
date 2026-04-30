'use strict';

const { validateTransaction } = require('../../src/utils/crypto');

describe('Crypto Basic Tests', () => {
    test('validateTransaction returns false for invalid input', () => {
        expect(validateTransaction(null)).toBe(false);
        expect(validateTransaction({})).toBe(false);
    });
});
