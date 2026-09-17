import assert from 'node:assert/strict';
import test from 'node:test';
import {personInitials, safePhotoURL} from '../src/person-badges.js';

test('person initials use readable names and stable fallbacks', () => {
  assert.equal(personInitials({displayName:'Avery Lee'}), 'AL');
  assert.equal(personInitials({email:'sam@example.test'}), 'S');
  assert.equal(personInitials({}), 'A');
});

test('person photo URLs allow only the approved HTTPS Google host', () => {
  assert.equal(safePhotoURL('https://lh3.googleusercontent.com/a/synthetic=s96-c'), 'https://lh3.googleusercontent.com/a/synthetic=s96-c');
  assert.equal(safePhotoURL('http://lh3.googleusercontent.com/a/synthetic'), '');
  assert.equal(safePhotoURL('https://evil.example.test/avatar.png'), '');
  assert.equal(safePhotoURL('data:image/png;base64,synthetic'), '');
  assert.equal(safePhotoURL('https://lh3.googleusercontent.com.evil.example.test/avatar'), '');
});
