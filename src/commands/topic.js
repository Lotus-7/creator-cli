import { generateTopic } from "../lib/content-engine.js";
import { loadContext, writeOutputFile } from "../lib/storage.js";
import { getModelOverride, makeOutputName } from "../lib/workflow.js";
import {
  startSpinner,
  stopSpinner,
  formatTopicCard,
  printFileInfo,
  printProviderInfo,
  printError
} from "../lib/ui.js";

export async function runTopic(positionals, options) {
  const idea = positionals.join(" ").trim();
  if (!idea) {
    throw new Error("topic requires an idea");
  }

  const context = await loadContext();

  // 显示使用的提供商
  const provider = options.provider || context.profile.aiProvider;
  const model = options.model || context.profile.aiModel;
  printProviderInfo(provider, model);

  // 显示 loading
  startSpinner("正在生成选题卡片...");

  try {
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

    stopSpinner("选题卡片生成完成！", true);

    // 保存文件
    const fileName = makeOutputName("topic", idea, "json");
    const filePath = await writeOutputFile(fileName, `${JSON.stringify(result.data, null, 2)}\n`);

    // 美化输出
    formatTopicCard(result.data);
    printFileInfo(filePath);
  } catch (error) {
    stopSpinner("生成失败", false);
    throw error;
  }
}
