import { AIAction } from "./aiTypes";

export function parseAIActions(text: string): AIAction[] {
  const actions: AIAction[] = [];

  const regex = /<action([\s\S]*?)<\/action>/g;
  const matches = text.matchAll(regex);

  for (const match of matches) {
    try {
      const json = match[1]
        .replace(/type="/, '"type":"')
        .replace(/path="/g, '"path":"')
        .replace(/oldPath="/g, '"oldPath":"')
        .replace(/newPath="/g, '"newPath":"')
        .replace(/content="/g, '"content":"')
        .replace(/">/, '",')
        .trim();

      const action = JSON.parse(`{${json}}`);
      actions.push(action);
    } catch (err) {
      console.error("❌ Failed to parse AI action:", err);
    }
  }

  return actions;
}
