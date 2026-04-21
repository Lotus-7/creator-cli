import { generateRepurpose } from "../lib/content-engine.js";
import { readTextIfFile } from "../lib/utils.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runRepurpose(positionals, options) {
  const sourceInput = positionals.join(" ").trim();
  if (!sourceInput) {
    throw new Error("repurpose requires a source file path or source text");
  }

  const targetPlatform = options.to || options.platform || "抖音";
  const source = await readTextIfFile(sourceInput);
  const context = await loadContext();
  const result = await generateRepurpose(
    context,
    source,
    targetPlatform,
    getModelOverride(options),
    { voiceName: options.voice }
  );
  const fileName = makeOutputName("repurpose", targetPlatform, "md");
  const filePath = await writeOutputFile(fileName, result.data);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Repurposed draft created: ${filePath}`);
  printSuccess(result.data);
}
