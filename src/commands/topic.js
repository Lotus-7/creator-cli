import { generateTopic } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runTopic(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("topic requires an idea");
  }

  const context = await loadContext();
  const result = await generateTopic(
    context,
    {
      idea,
      platform: options.platform,
      niche: options.niche,
      audience: options.audience,
      tone: options.tone,
      voiceName: options.voice
    },
    getModelOverride(options)
  );
  const fileName = makeOutputName("topic", idea, "json");
  const filePath = await writeOutputFile(fileName, `${JSON.stringify(result.data, null, 2)}\n`);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Topic card created: ${filePath}`);
  printSuccess(JSON.stringify(result.data, null, 2));
}
