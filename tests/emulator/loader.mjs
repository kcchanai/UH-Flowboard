const source = await fetch('/UH-Trello/index.html').then(response => {
  if (!response.ok) throw new Error(`Flowboard test shell could not load (${response.status}).`);
  return response.text();
});
const parsed = new DOMParser().parseFromString(source, 'text/html');
document.documentElement.replaceWith(parsed.documentElement);
const script = document.createElement('script');
script.type = 'module';
script.src = '/UH-Trello/tests/emulator/entry.mjs';
document.body.append(script);
