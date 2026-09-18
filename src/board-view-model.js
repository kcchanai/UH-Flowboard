const active = value => value && !value.archived;

export function projectBoard(board, {
  search = '',
  filters = {},
  currentUserUid = '',
  today,
  time,
  cardMatches,
  dueState
} = {}) {
  const match = typeof cardMatches === 'function' ? cardMatches : () => true;
  const due = typeof dueState === 'function' ? dueState : () => 'none';
  const lists = (board?.lists || []).filter(active);
  const allCards = lists.flatMap(list => (list.cards || []).filter(active));
  const resolvedFilters = filters.member === 'me' ? {...filters, member:currentUserUid} : filters;
  const rows = [];
  lists.forEach((list, listIndex) => {
    (list.cards || []).filter(active).forEach((card, cardIndex) => {
      if (match(card, search, resolvedFilters, today, time)) rows.push({
        id:card.id,
        card,
        list,
        listId:list.id,
        listTitle:list.title,
        listIndex,
        cardIndex,
        order:rows.length
      });
    });
  });
  const summary = {
    total:allCards.length,
    visible:rows.length,
    overdue:allCards.filter(card => !card.completed && due(card, today, time) === 'overdue').length,
    dueToday:allCards.filter(card => !card.completed && due(card, today, time) === 'today').length,
    completed:allCards.filter(card => card.completed).length
  };
  return {
    boardId:board?.id || '',
    boardTitle:board?.title || '',
    rows,
    lists,
    summary,
    filtered:rows.length !== allCards.length
  };
}

export function sortRows(rows, key = 'board') {
  if (key === 'title') return [...rows].sort((a,b) => a.card.title.localeCompare(b.card.title) || a.order - b.order);
  if (key === 'due') return [...rows].sort((a,b) => {
    const left = a.card.dueDate ? `${a.card.dueDate}T${a.card.dueTime || '23:59'}` : '9999-12-31T23:59';
    const right = b.card.dueDate ? `${b.card.dueDate}T${b.card.dueTime || '23:59'}` : '9999-12-31T23:59';
    return left.localeCompare(right) || a.order - b.order;
  });
  return [...rows].sort((a,b) => a.order - b.order);
}
