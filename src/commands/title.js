import { generateTitles } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName, renderTitles } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runTitle(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("title requires an idea");
  }

  const context = await loadContext();
  const result = await generateTitles(
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
  const content = renderTitles(result.data);
  const fileName = makeOutputName("title", idea, "md");
  const filePath = await writeOutputFile(fileName, content);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Titles created: ${filePath}`);
  printSuccess(content);
}
