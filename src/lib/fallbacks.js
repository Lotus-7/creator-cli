import { addDays, formatDate, normalizeAudience, normalizePlatform } from "./utils.js";

export function createBrief(input, profile) {
  return {
    idea: input.idea,
    platform: normalizePlatform(input.platform || profile.defaultPlatform),
    niche: input.niche || profile.defaultNiche,
    audience: normalizeAudience(input.audience || profile.defaultAudience),
    tone: input.tone || profile.voice,
    voiceName: input.voiceName || profile.defaultVoice || ""
  };
}

function voiceHookPrefix(brief, voice) {
  if (!voice) return "";
  return `${voice.name}风格 | `;
}

export function fallbackTopicCard(brief, library, voice = null) {
  return {
    idea: brief.idea,
    niche: brief.niche,
    audience: brief.audience,
    platform: brief.platform,
    tone: brief.tone,
    angle: `把“${brief.idea}”从空泛目标改成可以复用的内容动作。`,
    coreConflict: `很多${brief.audience}知道“${brief.idea}”重要，但常常卡在起步和持续输出。`,
    hook: `${voiceHookPrefix(brief, voice)}你不是做不到${brief.idea}，你只是一直在用错误的起跑方式。`,
    payoff: `读完后，用户能知道先删掉什么动作、保留什么动作、今天先做哪一步。`,
    pillarsUsed: library.pillars.slice(0, 3),
    seriesIdeas: [
      `从0到1拆解：${brief.idea}`,
      `${brief.idea}里最容易骗过自己的3个瞬间`,
      `如果只保留一个动作，我会怎么做${brief.idea}`
    ]
  };
}

export function fallbackOutline(brief, voice = null) {
  return {
    title: `${voice ? `${voice.name} | ` : ""}${brief.platform}内容提纲: ${brief.idea}`,
    sections: [
      `开场钩子: 直接戳穿${brief.audience}在“${brief.idea}”上的常见误区`,
      `问题定义: 为什么多数人努力了，结果还是没有起色`,
      `核心拆解: 用3个层次拆开${brief.idea}，让用户知道真正的卡点`,
      `可执行动作: 给出今天就能做的1个最小动作和1个避坑动作`,
      `结尾行动: 引导收藏、评论或继续看系列下一篇`
    ]
  };
}

export function fallbackDraft(brief, voice = null) {
  const outline = fallbackOutline(brief, voice);
  const opener = voice?.styleFingerprint?.openingStyle
    ? `${voice.styleFingerprint.openingStyle.split(" / ")[0]}`
    : `你不是做不到${brief.idea}，你只是一直在用错误的起跑方式`;
  const closer = voice?.styleFingerprint?.closingStyle
    ? `${voice.styleFingerprint.closingStyle.split(" / ")[0]}`
    : `先把今天那一个最小动作做完，再回来告诉我，你卡住的到底是哪一步。`;

  return `# ${opener}

很多人以为自己做不好“${brief.idea}”，是因为不够努力。
真相更刺耳一点: 不是你不努力，是你的动作顺序从第一步就错了。

## 为什么这件事总是做不起来

在${brief.audience}里，最常见的问题不是不知道方法，而是把“知道”误当成“做到”。
一旦你把${brief.idea}理解成一个需要长期意志力支撑的工程，它就会变得又重又拖。

## 真正的卡点只有三个

1. 目标太大，导致每天都像在扛石头。
2. 反馈太慢，做了几次就怀疑有没有用。
3. 环境太乱，真正该做的动作反而排在最后。

## 你今天就能做的最小动作

把“${brief.idea}”缩到一个今天能完成、15分钟内能收尾的小动作。
不要追求完整，先追求可重复。

## 收尾

如果你也卡在“${brief.idea}”，先别急着找更多技巧。
${closer}

---

内容结构参考:
${outline.sections.map((section, index) => `${index + 1}. ${section}`).join("\n")}
`;
}

export function fallbackTitles(brief, voice = null) {
  const prefix = voice ? `${voice.name}风格: ` : "";
  return [
    `${prefix}你不是做不好${brief.idea}，你只是顺序全错了`,
    `给所有${brief.audience}的提醒: ${brief.idea}不是靠狠劲完成的`,
    `我发现，${brief.idea}最难的从来不是开始`,
    `${brief.platform}上最容易被忽略的真相: ${brief.idea}先删再做`,
    `如果你总在${brief.idea}上半途而废，先看这条`
  ];
}

export function fallbackRepurpose(source, targetPlatform, voice = null) {
  return `# ${targetPlatform}改写版

## 开头
${voice?.styleFingerprint?.openingStyle?.split(" / ")[0] || "如果你总觉得内容做不起来，先别怀疑天赋，先怀疑动作顺序。"}

## 正文
${source.trim()}

## 结尾
${voice?.styleFingerprint?.closingStyle?.split(" / ")[0] || `如果你要，我可以继续把这条拆成适合${targetPlatform}的系列内容。`}`;
}

export function fallbackCalendar(theme, days, platform) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(new Date(), index);
    return {
      date: formatDate(date),
      platform,
      topic: `${theme} 第${index + 1}条`,
      format: index % 2 === 0 ? "观点短文" : "清单/步骤",
      goal: index % 3 === 0 ? "拉新" : "促收藏",
      angle: index % 2 === 0 ? `拆掉${theme}里的误区` : `把${theme}变成可执行步骤`
    };
  });
}
