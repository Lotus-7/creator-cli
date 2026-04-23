import { loadContext, loadVoice, saveProfile, saveVoice, ensureVoice, listVoices } from "../lib/storage.js";
import { analyzeVoiceSamples, auditVoiceText, collectSamples, createVoiceTemplate, improveVoiceText, summarizeVoice } from "../lib/voice.js";
import { parseList, readTextIfFile } from "../lib/utils.js";
import { makeOutputName } from "../lib/workflow.js";
import { printSuccess } from "../lib/ui.js";
import { writeOutputFile } from "../lib/storage.js";

const EDITABLE_KEYS = new Set([
  "description",
  "identity",
  "audience",
  "notes",
  "coreBeliefs",
  "bannedPhrases",
  "signaturePhrases",
  "structurePatterns",
  "styleFingerprint.tone",
  "styleFingerprint.sentenceStyle",
  "styleFingerprint.openingStyle",
  "styleFingerprint.closingStyle",
  "styleFingerprint.rhythm",
  "styleFingerprint.emotionalTemperature"
]);

function setByPath(object, keyPath, value) {
  const keys = keyPath.split(".");
  let cursor = object;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

function getVoiceTarget(name, context) {
  const target = name || context.profile.defaultVoice;
  if (!target) {
    throw new Error("voice command requires a name or a default voice");
  }
  return target;
}

export async function runVoice(positionals, options) {
  const [subcommand = "list", name, ...rest] = positionals;
  const context = await loadContext();

  if (subcommand === "list") {
    const voices = await listVoices();
    printSuccess(`Default voice: ${context.profile.defaultVoice || "(none)"}`);
    for (const voiceName of voices) {
      const marker = context.profile.defaultVoice === voiceName ? "*" : " ";
      printSuccess(`${marker} ${voiceName}`);
    }
    return;
  }

  if (subcommand === "init" || subcommand === "create") {
    if (!name) {
      throw new Error("voice init requires a name");
    }
    await runVoiceInitInteractive(name);
    return;
  }

// 交互式创建 voice
async function runVoiceInitInteractive(name) {
  const readline = (await import("node:readline/promises")).default;
  const { stdin: input, stdout: output } = process;
  const rl = readline.createInterface({ input, output });

  const voice = createVoiceTemplate(name);
  voice.name = name;

  console.log(`\n创建声音风格: ${name}`);
  console.log("按 Enter 跳过可选字段\n");

  const questions = [
    { key: "description", label: "描述", required: false, example: "比如：小红书风格，活泼亲切" },
    { key: "identity", label: "身份定位", required: false, example: "比如：内容创业者、产品经理" },
    { key: "audience", label: "目标受众", required: false, example: "比如：职场新人、自媒体创作者" },
    { key: "coreBeliefs", label: "核心理念", required: false, isArray: true, example: "用逗号分隔，如：少空话,先行动" },
    { key: "bannedPhrases", label: "禁用表达", required: false, isArray: true, example: "用逗号分隔，如：总的来说,基本上" },
    { key: "signaturePhrases", label: "标志性表达", required: false, isArray: true, example: "用逗号分隔，如：你好呀,我们来" },
  ];

  for (const q of questions) {
    const hint = q.example ? ` (${q.example})` : "";
    const answer = await rl.question(`${q.label}${hint}: `);

    if (answer.trim()) {
      if (q.isArray) {
        voice[q.key] = answer.split(/,|，/).map(s => s.trim()).filter(Boolean);
      } else {
        voice[q.key] = answer.trim();
      }
    }
  }

  console.log("\n风格特征（可选）");
  const styleQuestions = [
    { key: "tone", label: "语气", example: "比如：轻松、严肃、直接" },
    { key: "sentenceStyle", label: "句式风格", example: "比如：短句为主、长句解释" },
    { key: "openingStyle", label: "开头风格", example: "比如：喜欢用提问开头" },
    { key: "closingStyle", label: "结尾风格", example: "比如：总结+行动号召" },
    { key: "rhythm", label: "节奏", example: "比如：快节奏、娓娓道来" },
    { key: "emotionalTemperature", label: "情绪温度", example: "比如：偏热、偏稳" },
  ];

  for (const q of styleQuestions) {
    const hint = q.example ? ` (${q.example})` : "";
    const answer = await rl.question(`${q.label}${hint}: `);
    if (answer.trim()) {
      voice.styleFingerprint[q.key] = answer.trim();
    }
  }

  rl.close();

  const filePath = await ensureVoice(name, voice);
  console.log(`\n✔ Voice 已创建: ${filePath}`);
  console.log(`\n提示: 使用 "creator voice use ${name}" 设为默认`);
  console.log(`      使用 "creator voice train ${name} <samples>" 从样本文本中学习风格\n`);
}

  if (subcommand === "show") {
    const target = getVoiceTarget(name, context);
    const voice = await loadVoice(target);
    if (!voice) {
      throw new Error(`Unknown voice: ${target}`);
    }
    printSuccess(JSON.stringify(voice, null, 2));
    return;
  }

  if (subcommand === "use") {
    if (!name) {
      throw new Error("voice use requires a name");
    }
    const voice = await loadVoice(name);
    if (!voice) {
      throw new Error(`Unknown voice: ${name}`);
    }
    context.profile.defaultVoice = name;
    await saveProfile(context.profile);
    printSuccess(`Default voice set to ${name}`);
    return;
  }

  if (subcommand === "train") {
    if (!name) {
      throw new Error("voice train requires a name");
    }
    const samplePath = rest.join(" ").trim() || options.from;
    if (!samplePath) {
      throw new Error("voice train requires a file or directory path");
    }

    const existingVoice = (await loadVoice(name)) || createVoiceTemplate(name);
    const samples = await collectSamples(samplePath);
    if (!samples.length) {
      throw new Error("No usable .txt or .md samples found");
    }

    const trained = analyzeVoiceSamples(name, samples, existingVoice);
    await saveVoice(name, trained);
    printSuccess(`Voice trained: ${name}`);
    printSuccess(summarizeVoice(trained));
    return;
  }

  if (subcommand === "edit") {
    const target = getVoiceTarget(name, context);
    const field = rest[0];
    const rawValue = rest.slice(1).join(" ").trim();
    if (!field) {
      throw new Error("voice edit requires a field");
    }
    if (!EDITABLE_KEYS.has(field)) {
      throw new Error(`Unsupported voice field: ${field}`);
    }
    const voice = await loadVoice(target);
    if (!voice) {
      throw new Error(`Unknown voice: ${target}`);
    }

    const value =
      field === "coreBeliefs" ||
      field === "bannedPhrases" ||
      field === "signaturePhrases" ||
      field === "structurePatterns"
        ? parseList(rawValue)
        : rawValue;

    setByPath(voice, field, value);
    await saveVoice(target, voice);
    printSuccess(`Voice updated: ${target} ${field}`);
    printSuccess(summarizeVoice(voice));
    return;
  }

  if (subcommand === "audit") {
    const target = getVoiceTarget(name, context);
    const source = rest.join(" ").trim() || options.from;
    if (!source) {
      throw new Error("voice audit requires a file path or raw text");
    }
    const voice = await loadVoice(target);
    if (!voice) {
      throw new Error(`Unknown voice: ${target}`);
    }
    const text = await readTextIfFile(source);
    const audit = auditVoiceText(voice, text);
    printSuccess(JSON.stringify(audit, null, 2));
    return;
  }

  if (subcommand === "improve") {
    const target = getVoiceTarget(name, context);
    const source = rest.join(" ").trim() || options.from;
    if (!source) {
      throw new Error("voice improve requires a file path or raw text");
    }
    const voice = await loadVoice(target);
    if (!voice) {
      throw new Error(`Unknown voice: ${target}`);
    }
    const text = await readTextIfFile(source);
    const improved = improveVoiceText(voice, text);
    const outputName = makeOutputName("voice-improve", target, "md");
    const filePath = await writeOutputFile(outputName, improved.improvedText);
    printSuccess(JSON.stringify({
      voice: target,
      audit: improved.audit,
      suggestions: improved.suggestions,
      output: filePath
    }, null, 2));
    printSuccess(improved.improvedText);
    return;
  }

  throw new Error(`Unknown voice subcommand: ${subcommand}`);
}
