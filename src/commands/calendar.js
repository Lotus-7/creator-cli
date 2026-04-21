import { generateCalendar } from "../lib/content-engine.js";
import { parseInteger } from "../lib/utils.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName, renderCalendar } from "../lib/workflow.js";
import { printSuccess, printWarning } from "../lib/ui.js";

export async function runCalendar(positionals, options) {
  const theme = positionals.join(" ").trim();
  if (!theme) {
    throw new Error("calendar requires a theme");
  }

  const context = await loadContext();
  const days = parseInteger(options.days, 7);
  const result = await generateCalendar(
    context,
    {
      theme,
      days,
      platform: options.platform || context.profile.defaultPlatform,
      voiceName: options.voice
    },
    getModelOverride(options)
  );

  const content = renderCalendar(result.data);
  const fileName = makeOutputName("calendar", theme, "md");
  const filePath = await writeOutputFile(fileName, content);

  if (result.meta.mode !== "remote") {
    printWarning(`Using fallback generation: ${result.meta.reason}`);
  }

  printSuccess(`Calendar created: ${filePath}`);
  printSuccess(content);
}
