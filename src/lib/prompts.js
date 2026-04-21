function buildVoiceLines(voice) {
  if (!voice) {
    return [];
  }

  return [
    `当前启用 voice: ${voice.name}`,
    `voice 描述: ${voice.description || "无"}`,
    `voice 身份定位: ${voice.identity || "无"}`,
    `voice 目标受众: ${voice.audience || "无"}`,
    `voice 核心信念: ${(voice.coreBeliefs || []).join("、") || "无"}`,
    `voice 禁用表达: ${(voice.bannedPhrases || []).join("、") || "无"}`,
    `voice 标志性表达: ${(voice.signaturePhrases || []).join("、") || "无"}`,
    `voice 结构习惯: ${(voice.structurePatterns || []).join("、") || "无"}`,
    `voice 风格指纹: ${JSON.stringify(voice.styleFingerprint || {})}`
  ];
}

export function buildSystemPrompt(profile, library, voice) {
  return [
    `你是一名顶级中文内容策略师和自媒体编辑。`,
    `品牌名: ${profile.brandName}`,
    `语气: ${profile.voice}`,
    `默认平台: ${profile.defaultPlatform}`,
    `默认赛道: ${profile.defaultNiche}`,
    `默认受众: ${profile.defaultAudience}`,
    `内容目标: ${(profile.contentGoals || []).join("、")}`,
    `内容支柱: ${(library.pillars || []).join("、") || "无"}`,
    `禁用词: ${(library.bannedWords || []).join("、") || "无"}`,
    `系列栏目: ${(library.recurringSeries || []).join("、") || "无"}`,
    ...buildVoiceLines(voice),
    `除非明确要求，否则只输出中文。`,
    `输出要具体、可发布、少空话。`,
    voice ? `请优先保持该 voice 的表达习惯、结构习惯和价值判断一致性。` : ``
  ].join("\n");
}

export function topicPrompt(brief) {
  return [
    `围绕以下创作需求生成一个选题卡，返回 JSON。`,
    `idea: ${brief.idea}`,
    `platform: ${brief.platform}`,
    `niche: ${brief.niche}`,
    `audience: ${brief.audience}`,
    `tone: ${brief.tone}`,
    `JSON 字段必须包含: idea, angle, coreConflict, hook, payoff, seriesIdeas, audience, platform, niche, tone`
  ].join("\n");
}

export function outlinePrompt(brief) {
  return [
    `为以下内容生成中文提纲，返回 JSON。`,
    `idea: ${brief.idea}`,
    `platform: ${brief.platform}`,
    `audience: ${brief.audience}`,
    `JSON 字段必须包含: title, sections`,
    `sections 是 5-7 条字符串数组。`
  ].join("\n");
}

export function draftPrompt(brief) {
  return [
    `围绕以下需求生成一篇中文初稿，直接返回 markdown，不要解释。`,
    `idea: ${brief.idea}`,
    `platform: ${brief.platform}`,
    `audience: ${brief.audience}`,
    `tone: ${brief.tone}`,
    `文章要有明确开头、主体、结尾，并且保留强钩子。`
  ].join("\n");
}

export function titlePrompt(brief) {
  return [
    `围绕以下需求生成标题，返回 JSON。`,
    `idea: ${brief.idea}`,
    `platform: ${brief.platform}`,
    `audience: ${brief.audience}`,
    `JSON 字段必须包含: titles`,
    `titles 是 5-8 条中文标题数组。`
  ].join("\n");
}

export function repurposePrompt(source, targetPlatform, profile) {
  return [
    `请把下面内容改写为适合${targetPlatform}发布的中文版本，直接返回 markdown。`,
    `保持品牌语气: ${profile.voice}`,
    `原始内容如下:`,
    source
  ].join("\n\n");
}

export function calendarPrompt({ theme, platform, days }) {
  return [
    `请为主题“${theme}”生成 ${days} 天的中文内容发布日历，返回 JSON。`,
    `平台: ${platform}`,
    `JSON 字段必须包含: days`,
    `days 是数组，每项包含 date, topic, format, goal, angle`
  ].join("\n");
}
