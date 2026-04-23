import { generateOutline } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import {
  startSpinner,
  stopSpinner,
  formatOutline,
  printFileInfo,
  printProviderInfo
} from "../lib/ui.js";

export async function runOutline(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("outline requires an idea");
  }

  const context = await loadContext();

  const provider = options.provider || context.profile.aiProvider;
  const model = options.model || context.profile.aiModel;
  printProviderInfo(provider, model);

  startSpinner("正在生成内容大纲...");

  try {
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

    stopSpinner("大纲生成完成！", true);

    const fileName = makeOutputName("outline", idea, "md");
    const filePath = await writeOutputFile(fileName, result.data.sections.join("\n"));

    formatOutline(result.data);
    printFileInfo(filePath);
  } catch (error) {
    stopSpinner("生成失败", false);
    throw error;
  }
}
