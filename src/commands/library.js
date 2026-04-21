import { loadContext, saveLibrary } from "../lib/storage.js";
import { printSuccess } from "../lib/ui.js";

const BUCKETS = {
  pillar: "pillars",
  pillars: "pillars",
  banned: "bannedWords",
  bannedWords: "bannedWords",
  series: "recurringSeries",
  recurringSeries: "recurringSeries"
};

export async function runLibrary(positionals) {
  const [subcommand = "list", bucketName, ...valueParts] = positionals;
  const context = await loadContext();

  if (subcommand === "list") {
    printSuccess(JSON.stringify(context.library, null, 2));
    return;
  }

  const bucket = BUCKETS[bucketName];
  if (!bucket) {
    throw new Error(`Unknown library bucket: ${bucketName}`);
  }

  const value = valueParts.join(" ").trim();
  if (!value) {
    throw new Error(`library ${subcommand} requires a value`);
  }

  if (subcommand === "add") {
    if (!context.library[bucket].includes(value)) {
      context.library[bucket].push(value);
    }
    await saveLibrary(context.library);
    printSuccess(`Added to ${bucket}: ${value}`);
    return;
  }

  if (subcommand === "remove") {
    context.library[bucket] = context.library[bucket].filter((item) => item !== value);
    await saveLibrary(context.library);
    printSuccess(`Removed from ${bucket}: ${value}`);
    return;
  }

  throw new Error(`Unknown library subcommand: ${subcommand}`);
}
