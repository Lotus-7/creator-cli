import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { slugify } from "./utils.js";

export function createVoiceTemplate(name) {
  return {
    name,
    description: "",
    identity: "",
    audience: "",
    coreBeliefs: [],
    bannedPhrases: [],
    signaturePhrases: [],
    structurePatterns: [],
    styleFingerprint: {
      tone: "",
      sentenceStyle: "",
      openingStyle: "",
      closingStyle: "",
      rhythm: "",
      emotionalTemperature: ""
    },
    sampleStats: {
      sampleCount: 0,
      averageParagraphs: 0,
      averageSentenceLength: 0,
      exclamationRate: 0,
      questionRate: 0
    },
    sampleSources: [],
    notes: ""
  };
}

export async function collectSamples(inputPath) {
  const absolute = path.resolve(process.cwd(), inputPath);
  const stat = await import("node:fs/promises").then((fs) => fs.stat(absolute));

  if (stat.isDirectory()) {
    const files = await readdir(absolute, { withFileTypes: true });
    const samples = [];
    for (const file of files) {
      if (!file.isFile()) continue;
      if (!/\.(txt|md)$/i.test(file.name)) continue;
      const filePath = path.join(absolute, file.name);
      const content = await readFile(filePath, "utf8");
      if (content.trim()) {
        samples.push({ path: filePath, content });
      }
    }
    return samples;
  }

  const content = await readFile(absolute, "utf8");
  return [{ path: absolute, content }];
}

function splitSentences(text) {
  return text
    .split(/[。！？!?；;\n]+/g)
    .map((item) => sanitizeCandidate(item))
    .filter(Boolean);
}

function sanitizeCandidate(text) {
  return text
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/^[-*]\s*/, "")
    .replace(/\s+/g, " ");
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topPhrases(samples, limit = 5) {
  const counts = new Map();
  for (const sample of samples) {
    for (const line of sample.content.split("\n")) {
      const cleaned = sanitizeCandidate(line);
      if (cleaned.length < 6 || cleaned.length > 24) continue;
      if (isTemplateSentence(cleaned)) continue;
      counts.set(cleaned, (counts.get(cleaned) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase]) => phrase);
}

function detectTone(stats) {
  if (stats.questionRate > 0.18) return "偏提问、带引导感";
  if (stats.exclamationRate > 0.12) return "表达直接，情绪较强";
  if (stats.averageSentenceLength < 18) return "短句为主，节奏偏快";
  return "克制、清晰、偏分析";
}

function detectStructure(samples) {
  const joined = samples.map((sample) => sample.content).join("\n");
  const patterns = [];
  if (/\n1\.\s|\n2\.\s/.test(joined)) patterns.push("喜欢编号拆解");
  if (/##\s|###\s/.test(joined)) patterns.push("常用分段小标题");
  if (/不是.+而是.+/s.test(joined)) patterns.push("偏爱对比句式");
  if (/如果你/.test(joined)) patterns.push("常用直接对话式开头");
  if (!patterns.length) patterns.push("以自然段推进观点");
  return patterns;
}

function pickNaturalSentences(sentences, count) {
  return sentences
    .filter((sentence) => sentence.length >= 10 && sentence.length <= 42)
    .filter((sentence) => !isTemplateSentence(sentence))
    .slice(0, count);
}

function pickNaturalClosings(sentences, count) {
  return [...sentences]
    .reverse()
    .filter((sentence) => sentence.length >= 10 && sentence.length <= 42)
    .filter((sentence) => !isTemplateSentence(sentence))
    .slice(0, count)
    .reverse();
}

function isTemplateSentence(sentence) {
  return /^(title options|发布日历|内容结构参考|开场钩子|问题定义|核心拆解|可执行动作|结尾行动|第\d+条)/i.test(sentence) ||
    /内容提纲|Title Options/.test(sentence);
}

export function analyzeVoiceSamples(name, samples, existingVoice = null) {
  const sentences = samples.flatMap((sample) => splitSentences(sample.content));
  const paragraphs = samples.map((sample) =>
    sample.content
      .split(/\n\s*\n/g)
      .map((item) => item.trim())
      .filter(Boolean).length
  );
  const sentenceLengths = sentences.map((sentence) => sentence.length);
  const fullText = samples.map((sample) => sample.content).join("\n");
  const exclamationCount = (fullText.match(/[!！]/g) || []).length;
  const questionCount = (fullText.match(/[?？]/g) || []).length;
  const stats = {
    sampleCount: samples.length,
    averageParagraphs: Number(average(paragraphs).toFixed(1)),
    averageSentenceLength: Number(average(sentenceLengths).toFixed(1)),
    exclamationRate: Number((exclamationCount / Math.max(sentences.length, 1)).toFixed(2)),
    questionRate: Number((questionCount / Math.max(sentences.length, 1)).toFixed(2))
  };

  const openingCandidates = pickNaturalSentences(sentences, 3);
  const closingCandidates = pickNaturalClosings(sentences, 3);
  const signaturePhrases = topPhrases(samples, 5);
  const structurePatterns = detectStructure(samples);
  const voice = existingVoice || createVoiceTemplate(slugify(name));

  return {
    ...voice,
    name: voice.name || name,
    description: voice.description || `${name} 的风格档案`,
    styleFingerprint: {
      ...(voice.styleFingerprint || {}),
      tone: detectTone(stats),
      sentenceStyle: stats.averageSentenceLength < 18 ? "短句推进，判断明确" : "句子偏完整，解释较充分",
      openingStyle: openingCandidates.join(" / "),
      closingStyle: closingCandidates.join(" / "),
      rhythm: stats.averageParagraphs > 5 ? "分段较细，推进感明显" : "篇幅紧凑，少分叉",
      emotionalTemperature: stats.exclamationRate > 0.08 ? "偏热" : "偏稳"
    },
    structurePatterns,
    signaturePhrases,
    sampleStats: stats,
    sampleSources: samples.map((sample) => sample.path)
  };
}

export function applyVoiceToBrief(brief, voice) {
  if (!voice) {
    return brief;
  }

  return {
    ...brief,
    tone: voice.styleFingerprint?.tone || brief.tone,
    voiceName: voice.name
  };
}

export function summarizeVoice(voice) {
  return [
    `name: ${voice.name}`,
    `description: ${voice.description || ""}`,
    `identity: ${voice.identity || ""}`,
    `audience: ${voice.audience || ""}`,
    `coreBeliefs: ${(voice.coreBeliefs || []).join("、")}`,
    `bannedPhrases: ${(voice.bannedPhrases || []).join("、")}`,
    `tone: ${voice.styleFingerprint?.tone || ""}`,
    `sentenceStyle: ${voice.styleFingerprint?.sentenceStyle || ""}`,
    `openingStyle: ${voice.styleFingerprint?.openingStyle || ""}`,
    `closingStyle: ${voice.styleFingerprint?.closingStyle || ""}`,
    `structurePatterns: ${(voice.structurePatterns || []).join("、")}`,
    `signaturePhrases: ${(voice.signaturePhrases || []).join("、")}`,
    `sampleCount: ${voice.sampleStats?.sampleCount || 0}`
  ].join("\n");
}

function paragraphCount(text) {
  return text
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function includesAny(text, values) {
  return values.filter((value) => value && text.includes(value));
}

export function auditVoiceText(voice, text) {
  const sentences = splitSentences(text);
  const avgSentenceLength = average(sentences.map((sentence) => sentence.length));
  const paragraphs = paragraphCount(text);
  const exclamationRate = (text.match(/[!！]/g) || []).length / Math.max(sentences.length, 1);
  const questionRate = (text.match(/[?？]/g) || []).length / Math.max(sentences.length, 1);
  const signatureHits = includesAny(text, voice.signaturePhrases || []);
  const bannedHits = includesAny(text, voice.bannedPhrases || []);
  const structureHits = (voice.structurePatterns || []).filter((pattern) => {
    if (pattern === "喜欢编号拆解") return /\n\d+\.\s/.test(text);
    if (pattern === "常用分段小标题") return /^##\s/m.test(text);
    if (pattern === "偏爱对比句式") return /不是.+而是.+/s.test(text);
    if (pattern === "常用直接对话式开头") return /^如果你|^你/.test(text.trim());
    if (pattern === "以自然段推进观点") return paragraphs >= 3;
    return false;
  });

  const findings = [];
  const misses = [];
  let score = 100;

  const expectedSentenceLength = voice.sampleStats?.averageSentenceLength || 0;
  if (expectedSentenceLength) {
    const diff = Math.abs(avgSentenceLength - expectedSentenceLength);
    if (diff <= 4) {
      findings.push(`句长接近 voice 均值 (${avgSentenceLength.toFixed(1)} vs ${expectedSentenceLength})`);
    } else {
      misses.push(`句长偏离较大 (${avgSentenceLength.toFixed(1)} vs ${expectedSentenceLength})`);
      score -= 12;
    }
  }

  const expectedParagraphs = voice.sampleStats?.averageParagraphs || 0;
  if (expectedParagraphs) {
    const diff = Math.abs(paragraphs - expectedParagraphs);
    if (diff <= 2) {
      findings.push(`段落密度接近 voice 习惯 (${paragraphs} 段)`);
    } else {
      misses.push(`段落密度和 voice 不太一致 (${paragraphs} 段 vs ${expectedParagraphs})`);
      score -= 8;
    }
  }

  if (signatureHits.length) {
    findings.push(`命中标志性表达: ${signatureHits.join("、")}`);
    score += Math.min(8, signatureHits.length * 2);
  } else if ((voice.signaturePhrases || []).length) {
    misses.push("没有命中 voice 的标志性表达");
    score -= 10;
  }

  if (structureHits.length) {
    findings.push(`命中结构习惯: ${structureHits.join("、")}`);
  } else if ((voice.structurePatterns || []).length) {
    misses.push("结构习惯命中较少");
    score -= 10;
  }

  if (bannedHits.length) {
    misses.push(`出现禁用表达: ${bannedHits.join("、")}`);
    score -= 25;
  }

  const expectedTone = voice.styleFingerprint?.emotionalTemperature;
  if (expectedTone === "偏稳" && exclamationRate > 0.08) {
    misses.push("情绪温度偏高，和 voice 的稳定表达不一致");
    score -= 8;
  } else if (expectedTone) {
    findings.push(`情绪温度基本匹配 (${expectedTone})`);
  }

  if (voice.styleFingerprint?.tone?.includes("提问") && questionRate < 0.05) {
    misses.push("voice 偏提问引导，但当前文本提问感不足");
    score -= 8;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verdict = "高一致";
  if (score < 80) verdict = "中等一致";
  if (score < 60) verdict = "低一致";

  return {
    voice: voice.name,
    score,
    verdict,
    findings,
    misses,
    metrics: {
      averageSentenceLength: Number(avgSentenceLength.toFixed(1)),
      paragraphs,
      exclamationRate: Number(exclamationRate.toFixed(2)),
      questionRate: Number(questionRate.toFixed(2))
    }
  };
}

function rewriteOpening(text, voice) {
  const preferred = voice.styleFingerprint?.openingStyle?.split(" / ").map((item) => item.trim()).filter(Boolean)[0];
  if (!preferred) return text;
  const lines = text.split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  if (firstContentIndex === -1) return text;
  if (lines[firstContentIndex].startsWith("#")) {
    lines[firstContentIndex] = `# ${preferred}`;
  } else {
    lines[firstContentIndex] = preferred;
  }
  return lines.join("\n");
}

function rewriteClosing(text, voice) {
  const preferred = voice.styleFingerprint?.closingStyle?.split(" / ").map((item) => item.trim()).filter(Boolean)[0];
  if (!preferred) return text;
  const blocks = text.split(/\n\s*\n/g);
  if (!blocks.length) return text;
  blocks[blocks.length - 1] = preferred;
  return blocks.join("\n\n");
}

function injectSignaturePhrase(text, voice) {
  const phrase = (voice.signaturePhrases || [])[0];
  if (!phrase || text.includes(phrase)) return text;
  const marker = "## 为什么这件事总是做不起来";
  if (text.includes(marker)) {
    return text.replace(marker, `${marker}\n\n${phrase}`);
  }
  return `${text}\n\n${phrase}`;
}

function stripBannedPhrases(text, voice) {
  let next = text;
  for (const phrase of voice.bannedPhrases || []) {
    if (!phrase) continue;
    next = next.split(phrase).join("");
  }
  return next;
}

function addStructureHint(text, voice) {
  if (!(voice.structurePatterns || []).includes("喜欢编号拆解")) {
    return text;
  }
  if (/\n1\.\s/.test(text)) {
    return text;
  }
  const insertion = `\n\n1. 先拆错位动作。\n2. 再压缩执行门槛。\n3. 最后保留一个最小动作。`;
  return text.includes("## 真正的卡点只有三个")
    ? text.replace("## 真正的卡点只有三个", `## 真正的卡点只有三个${insertion}`)
    : `${text}${insertion}`;
}

export function improveVoiceText(voice, text) {
  const audit = auditVoiceText(voice, text);
  const suggestions = [];

  if (!audit.findings.some((item) => item.includes("标志性表达"))) {
    suggestions.push(`补进 1-2 个标志性表达，比如“${(voice.signaturePhrases || [])[0] || "你的固定说法"}”。`);
  }
  if (!audit.findings.some((item) => item.includes("结构习惯"))) {
    suggestions.push(`把结构往 voice 习惯靠拢，优先采用“${(voice.structurePatterns || []).join("、") || "更稳定的固定结构"}”。`);
  }
  if (audit.misses.some((item) => item.includes("句长偏离"))) {
    suggestions.push(`调整句长到更接近 voice 的平均值 ${voice.sampleStats?.averageSentenceLength || 0}。`);
  }
  if (audit.misses.some((item) => item.includes("段落密度"))) {
    suggestions.push(`把段落密度调整到更接近 voice 的平均值 ${voice.sampleStats?.averageParagraphs || 0}。`);
  }
  if (audit.misses.some((item) => item.includes("情绪温度"))) {
    suggestions.push(`降低情绪强度，让表达更接近“${voice.styleFingerprint?.emotionalTemperature || "当前 voice"}”。`);
  }
  if (audit.misses.some((item) => item.includes("提问感不足"))) {
    suggestions.push("增加 1-2 个提问句，把读者拉进来。");
  }
  if (audit.misses.some((item) => item.includes("禁用表达"))) {
    suggestions.push(`删掉禁用表达: ${(voice.bannedPhrases || []).join("、")}`);
  }
  if (!suggestions.length) {
    suggestions.push("这篇稿子整体已经贴近该 voice，优先微调开头和结尾，让记忆点更强。");
  }

  let improved = text;
  improved = stripBannedPhrases(improved, voice);
  improved = rewriteOpening(improved, voice);
  improved = injectSignaturePhrase(improved, voice);
  improved = addStructureHint(improved, voice);
  improved = rewriteClosing(improved, voice);

  return {
    audit,
    suggestions,
    improvedText: improved
  };
}
