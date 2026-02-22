export function parseAIMultiPreview(text: string) {
  const results: {
    path: string;
    oldContent: string;
    newContent: string;
  }[] = [];

  const fileRegex = /<file([\s\S]*?)<\/file>/g;
  const matches = text.matchAll(fileRegex);

  for (const match of matches) {
    const block = match[1];

    const pathMatch = block.match(/path="([^"]+)"/);
    const oldMatch = block.match(/<old>([\s\S]*?)<\/old>/);
    const newMatch = block.match(/<new>([\s\S]*?)<\/new>/);

    if (!pathMatch || !oldMatch || !newMatch) continue;

    results.push({
      path: pathMatch[1],
      oldContent: oldMatch[1].trim(),
      newContent: newMatch[1].trim(),
    });
  }

  return results;
}
