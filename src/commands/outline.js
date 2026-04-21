import { generateOutline } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName, renderOutline } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runOutline(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("outline requires an idea");
  }

  const context = await loadContext();
  const result = await generateOutline(
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
  const content = renderOutline(result.data);
  const fileName = makeOutputName("outline", idea, "md");
  const filePath = await writeOutputFile(fileName, content);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Outline created: ${filePath}`);
  printSuccess(content);
}
