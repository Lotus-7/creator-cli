import { generateCalendar } from "../lib/content-engine.js";
import { parseInteger } from "../lib/utils.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import {
  startSpinner,
  stopSpinner,
  formatCalendar,
  printFileInfo,
  printProviderInfo
} from "../lib/ui.js";

export async function runCalendar(positionals, options) {
  const theme = positionals.join(" ").trim();
  if (!theme) {
    throw new Error("calendar requires a theme");
  }

  const context = await loadContext();
  const days = parseInteger(options.days, 7);

  const provider = options.provider || context.profile.aiProvider;
  const model = options.model || context.profile.aiModel;
  printProviderInfo(provider, model);

  startSpinner("正在生成发布日历...");

  try {
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

    stopSpinner("日历生成完成！", true);

    const fileName = makeOutputName("calendar", theme, "md");
    const filePath = await writeOutputFile(fileName, result.data.days.map(d =>
      `${d.date} | ${d.platform} | ${d.topic} | ${d.format} | ${d.goal} | ${d.angle}`
    ).join("\n"));

    formatCalendar(result.data);
    printFileInfo(filePath);
  } catch (error) {
    stopSpinner("生成失败", false);
    throw error;
  }
}
