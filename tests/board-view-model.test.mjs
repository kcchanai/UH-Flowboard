import test from 'node:test';
import assert from 'node:assert/strict';
import State from '../state-core.js';
import {projectBoard, sortRows} from '../src/board-view-model.js';

const matches = (card, search, filters, today, time) => State.cardMatches(card, search, filters, today, time);
const due = (card, today, time) => State.dueState(card, today, time);

function fixture() {
  const board = State.makeBoard('blank');
  board.lists = [State.makeList('Ideas'),State.makeList('Done'),State.makeList('Archive')];
  board.lists[0].cards = [
    {...State.makeCard('Overdue work'), dueDate:'2030-04-09', assigneeUids:['member-a']},
    {...State.makeCard('Today work'), dueDate:'2030-04-10', completed:false, checklist:[{id:'item',text:'Review',done:false}]}
  ];
  board.lists[1].cards = [{...State.makeCard('Finished work'), completed:true, dueDate:'2030-04-10'}];
  board.lists[2].archived = true;
  board.lists[2].cards = [{...State.makeCard('Archived work')}];
  return board;
}

test('projectBoard flattens active cards, excludes archives, and summarizes without mutation', () => {
  const board = fixture(), before = State.clone(board);
  const view = projectBoard(board, {today:'2030-04-10',time:'10:00',cardMatches:matches,dueState:due});
  assert.deepEqual(view.rows.map(row => row.card.title), ['Overdue work','Today work','Finished work']);
  assert.deepEqual(view.summary, {total:3,visible:3,overdue:1,dueToday:1,completed:1});
  assert.equal(view.filtered, false);
  assert.deepEqual(board, before);
});

test('projectBoard applies search, combined filters, and explicit current cloud UID', () => {
  const board = fixture();
  const view = projectBoard(board, {search:'work',filters:{member:'me',completed:'incomplete'},currentUserUid:'member-a',today:'2030-04-10',time:'10:00',cardMatches:matches,dueState:due});
  assert.deepEqual(view.rows.map(row => row.card.title), ['Overdue work']);
  assert.equal(view.summary.total, 3);
  assert.equal(view.summary.visible, 1);
  assert.equal(view.filtered, true);
});

test('sortRows is presentation-only, stable, and puts missing due dates last', () => {
  const board = fixture();
  const view = projectBoard(board, {cardMatches:matches,dueState:due});
  const before = view.rows.map(row => row.id);
  const sorted = sortRows(view.rows, 'due');
  assert.deepEqual(sorted.map(row => row.card.title), ['Overdue work','Today work','Finished work']);
  assert.deepEqual(view.rows.map(row => row.id), before);
  const titleSorted = sortRows(view.rows, 'title');
  assert.deepEqual(titleSorted.map(row => row.card.title), ['Finished work','Overdue work','Today work']);
});
