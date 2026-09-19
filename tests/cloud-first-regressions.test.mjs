import test from 'node:test';

// Baseline expected-failure ledger. Convert each entry into an executable
// regression before marking its implementation checkpoint complete.
test.todo('board horizontal scrolling stays within the visible viewport');
test.todo('Filters closes on outside interaction and remains within viewport bounds');
test.todo('cloud list deletion removes its cards and comments through the lifecycle engine');
test.todo('cloud Delete card is distinct from reversible Archive');
test.todo('dirty-card discard can safely open and execute a second confirmation');
test.todo('cloud archive failure reconciles the card editor and archive list');
test.todo('deleting or archiving the last active board produces an honest empty state');
