import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadContext } from "../lib/storage.js";
import { generateDraft, generateOutline, generateTitles, generateTopic } from "../lib/content-engine.js";

export async function runChat() {
  const context = await loadContext();
  const rl = readline.createInterface({ input, output });

  console.log("creator chat");
  console.log("Type an idea, or use /topic, /outline, /draft, /title. Type /exit to quit.");

  while (true) {
    const line = (await rl.question("> ")).trim();

    if (!line) {
      continue;
    }

    if (line === "/exit") {
      rl.close();
      return;
    }

    const [command, ...rest] = line.split(" ");
    const payload = rest.join(" ").trim();
    const idea = command.startsWith("/") ? payload : line;

    if (!idea) {
      console.log("Please enter an idea.");
      continue;
    }

    switch (command) {
      case "/topic":
        console.log(JSON.stringify((await generateTopic(context, { idea, voiceName: context.profile.defaultVoice })).data, null, 2));
        break;
      case "/outline":
        console.log((await generateOutline(context, { idea, voiceName: context.profile.defaultVoice })).data.sections.map((item, index) => `${index + 1}. ${item}`).join("\n"));
        break;
      case "/draft":
        console.log((await generateDraft(context, { idea, voiceName: context.profile.defaultVoice })).data);
        break;
      case "/title":
        console.log((await generateTitles(context, { idea, voiceName: context.profile.defaultVoice })).data.titles.map((item, index) => `${index + 1}. ${item}`).join("\n"));
        break;
      default:
        console.log(JSON.stringify((await generateTopic(context, { idea, voiceName: context.profile.defaultVoice })).data, null, 2));
        console.log("");
        console.log((await generateTitles(context, { idea, voiceName: context.profile.defaultVoice })).data.titles.map((item, index) => `${index + 1}. ${item}`).join("\n"));
    }
  }
}
