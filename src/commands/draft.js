import { generateDraft } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runDraft(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("draft requires an idea");
  }

  const context = await loadContext();
  const result = await generateDraft(
    context,
    {
      idea,
      platform: options.platform,
      audience: options.audience,
      niche: options.niche,
      tone: options.tone,
      voiceName: options.voice
    },
    getModelOverride(options)
  );
  const fileName = makeOutputName("draft", idea, "md");
  const filePath = await writeOutputFile(fileName, result.data);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Draft created: ${filePath}`);
  printSuccess(result.data);
}
