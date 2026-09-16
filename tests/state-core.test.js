const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../state-core.js');

test('legacy data migrates to schema 4 with usable collaboration metadata', () => {
  const migrated = State.migrateLegacy([{title: 'Inbox', cards: [{title: 'Call "Sam"', color: 'red', meta: 'today'}]}]);
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.boards[0].lists[0].cards[0].title, 'Call "Sam"');
  assert.equal(migrated.boards[0].collaboration.members[0].role, 'owner');
});

test('normalization safely upgrades old workspace data and rejects invalid envelope', () => {
  const normalized = State.normalizeWorkspace({schemaVersion: 1, boards: [{title: 'Old', lists: [{title: 'Next', cards: [{title: 'Task', labels: ['purple'], assigneeUids:['member-1','member-1','bad uid']}]}]}]});
  assert.equal(normalized.schemaVersion, 4);
  assert.equal(normalized.boards[0].lists[0].cards[0].labels[0].color, 'purple');
  assert.equal(normalized.boards[0].collaboration.access, 'private');
  assert.deepEqual(normalized.boards[0].lists[0].cards[0].assigneeUids, ['member-1']);
  assert.equal(State.validWorkspace({schemaVersion: 99, boards: []}), false);
});

test('cloud normalization preserves revision metadata across board, list, and card records', () => {
  const normalized = State.normalizeBoard({id: 'board-1', title: 'Cloud', revision: 4, clientMutationId: 'board-mutation', collaboration: {members: [{id: 'owner', name: 'Owner', role: 'owner'}]}, lists: [{id: 'list-1', title: 'Ready', revision: 2, clientMutationId: 'list-mutation', cards: [{id: 'card-1', title: 'Task', revision: 7, clientMutationId: 'card-mutation'}]}]});
  assert.deepEqual({revision: normalized.revision, clientMutationId: normalized.clientMutationId}, {revision: 4, clientMutationId: 'board-mutation'});
  assert.deepEqual({revision: normalized.lists[0].revision, clientMutationId: normalized.lists[0].clientMutationId}, {revision: 2, clientMutationId: 'list-mutation'});
  assert.deepEqual({revision: normalized.lists[0].cards[0].revision, clientMutationId: normalized.lists[0].cards[0].clientMutationId}, {revision: 7, clientMutationId: 'card-mutation'});
});

test('filtering covers card fields and due/label states without mutating the card', () => {
  const card = {title: 'Write launch copy', description: 'For home page', labels: [{color: 'orange', name: 'Marketing'}], checklist: [{text: 'Review with team', done: false}], assignees: ['Ari'], dueDate: '2030-04-10'};
  assert.equal(State.cardMatches(card, 'team'), true);
  assert.equal(State.cardMatches(card, 'ari', {due: 'upcoming', label: 'orange'}, '2030-04-01'), true);
  assert.equal(State.cardMatches(card, 'launch', {due: 'today', label: 'all'}, '2030-04-11'), false);
  assert.equal(card.labels[0].name, 'Marketing');
});

test('import recognition validates workspace and board shapes before mutation', () => {
  const board = State.makeBoard('tasks');
  const workspace = {schemaVersion: 4, activeBoardId: board.id, boards: [board], preferences: {theme: 'dark'}};
  assert.equal(State.describeImport(workspace).counts.boards, 1);
  assert.equal(State.describeImport({flowboardExport: 'board', board}).importedBoard.title, 'Personal tasks');
  assert.equal(State.describeImport({boards: 'not-an-array'}), null);
});

test('CSV export escapes commas, quotes, and newlines', () => {
  const board = {title: 'Q3, plan', lists: [{title: 'Inbox', cards: [{title: 'Say "hello"', description: 'Line one\nLine two', labels: [], assignees: [], archived: false}]}]};
  const csv = State.csvForBoard(board);
  assert.match(csv, /"Q3, plan"/);
  assert.match(csv, /"Say ""hello"""/);
  assert.match(csv, /"Line one\nLine two"/);
});

test('bounded undo restores the pre-mutation snapshot without aliasing', () => {
  const original = State.makeWorkspace();
  const history = State.pushUndo([], 'add card', original, 2);
  original.boards[0].title = 'Changed after snapshot';
  const result = State.takeUndo(history);
  assert.equal(result.item.workspace.boards[0].title, 'Website Launch');
  assert.equal(result.history.length, 0);
});

test('card drafts isolate editable fields until an explicit apply', () => {
  const card = State.makeCard('Draftable card', 'purple');
  const draft = State.makeCardDraft(card);
  draft.title = 'Edited title';
  draft.labels.push({id: 'draft-label', color: 'green', name: 'Next'});
  draft.checklist.push({id: 'draft-item', text: 'Review', done: false});
  assert.equal(card.title, 'Draftable card');
  assert.equal(card.labels.length, 1);
  assert.equal(card.checklist.length, 0);
  assert.equal(State.hasCardDraftChanges(card, draft), true);
  const applied = State.applyCardDraft(card, draft);
  assert.equal(applied.title, 'Edited title');
  assert.equal(applied.labels.length, 2);
  assert.equal(applied.checklist[0].text, 'Review');
  assert.equal(card.title, 'Draftable card');
});

test('card movement handles same-list order, self-drop, and empty destinations', () => {
  const board = State.makeBoard('blank'), source = State.makeList('Source', [State.makeCard('First'), State.makeCard('Second')]), empty = State.makeList('Empty');
  board.lists = [source, empty];
  const reordered = State.moveCard(board, source.cards[0].id, source.id, 1);
  assert.equal(reordered.changed, true);
  assert.deepEqual(reordered.board.lists[0].cards.map(card => card.title), ['Second', 'First']);
  const self = State.moveCard(reordered.board, source.cards[0].id, source.id, 1);
  assert.equal(self.changed, false);
  const movedEmpty = State.moveCard(reordered.board, source.cards[0].id, empty.id, 0);
  assert.equal(movedEmpty.changed, true);
  assert.deepEqual(movedEmpty.board.lists.map(list => list.cards.length), [1, 1]);
});

test('pure card and list movement commands preserve input and report no-ops', () => {
  const board = State.makeBoard('tasks');
  const first = State.makeCard('First'), second = State.makeCard('Second');
  board.lists[0].cards = [first, second];
  const moved = State.moveCard(board, first.id, board.lists[1].id, 0);
  assert.equal(moved.changed, true);
  assert.deepEqual(board.lists[0].cards.map(card => card.title), ['First', 'Second']);
  assert.deepEqual(moved.board.lists.map(list => list.cards.length), [1, 1, 0]);
  const same = State.moveCard(moved.board, first.id, board.lists[1].id, 0);
  assert.equal(same.changed, false);
  const reordered = State.moveList(board, board.lists[2].id, 0);
  assert.equal(reordered.changed, true);
  assert.equal(reordered.board.lists[0].id, board.lists[2].id);
  assert.equal(State.moveList(reordered.board, board.lists[2].id, 0).changed, false);
});
