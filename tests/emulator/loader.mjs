const source = await fetch(new URL('../../index.html', import.meta.url)).then(response => {
  if (!response.ok) throw new Error(`Flowboard test shell could not load (${response.status}).`);
  return response.text();
});
const parsed = new DOMParser().parseFromString(source, 'text/html');
document.documentElement.replaceWith(parsed.documentElement);
const script = document.createElement('script');
script.type = 'module';
script.src = new URL('./entry.mjs', import.meta.url).href;
document.body.append(script);
