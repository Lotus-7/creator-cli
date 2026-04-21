#!/usr/bin/env node

import { runInit } from "./commands/init.js";
import { runTopic } from "./commands/topic.js";
import { runOutline } from "./commands/outline.js";
import { runDraft } from "./commands/draft.js";
import { runTitle } from "./commands/title.js";
import { runChat } from "./commands/chat.js";
import { runProfile } from "./commands/profile.js";
import { runLibrary } from "./commands/library.js";
import { runRepurpose } from "./commands/repurpose.js";
import { runCalendar } from "./commands/calendar.js";
import { runProviders } from "./commands/providers.js";
import { runVoice } from "./commands/voice.js";
import { parseArgs } from "./lib/args.js";
import { printHelp, printError } from "./lib/ui.js";

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const { command, positionals, options } = parsed;

  try {
    switch (command) {
      case "init":
        await runInit();
        break;
      case "topic":
        await runTopic(positionals, options);
        break;
      case "outline":
        await runOutline(positionals, options);
        break;
      case "draft":
        await runDraft(positionals, options);
        break;
      case "title":
        await runTitle(positionals, options);
        break;
      case "chat":
        await runChat();
        break;
      case "profile":
        await runProfile(positionals, options);
        break;
      case "library":
        await runLibrary(positionals, options);
        break;
      case "repurpose":
        await runRepurpose(positionals, options);
        break;
      case "calendar":
        await runCalendar(positionals, options);
        break;
      case "providers":
        await runProviders(positionals, options);
        break;
      case "voice":
        await runVoice(positionals, options);
        break;
      case "help":
      case undefined:
        printHelp();
        break;
      default:
        printError(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

await main();
