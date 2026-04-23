import { generateTitles } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import {
  startSpinner,
  stopSpinner,
  formatTitles,
  printFileInfo,
  printProviderInfo
} from "../lib/ui.js";

export async function runTitle(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("title requires an idea");
  }

  const context = await loadContext();

  const provider = options.provider || context.profile.aiProvider;
  const model = options.model || context.profile.aiModel;
  printProviderInfo(provider, model);

  startSpinner("正在生成标题选项...");

  try {
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

    stopSpinner("标题生成完成！", true);

    const content = result.data.titles.join("\n");
    const fileName = makeOutputName("title", idea, "md");
    const filePath = await writeOutputFile(fileName, content);

    formatTitles(result.data);
    printFileInfo(filePath);
  } catch (error) {
    stopSpinner("生成失败", false);
    throw error;
  }
}
