import {
  applyVoiceToBrief,
  summarizeVoice
} from "./voice.js";
import {
  createBrief,
  fallbackCalendar,
  fallbackDraft,
  fallbackOutline,
  fallbackRepurpose,
  fallbackTitles,
  fallbackTopicCard
} from "./fallbacks.js";
import { buildSystemPrompt, calendarPrompt, draftPrompt, outlinePrompt, repurposePrompt, titlePrompt, topicPrompt } from "./prompts.js";
import { generateWithProvider, tryParseJson } from "./providers.js";

function resolveVoice(context, input) {
  const voiceName = input.voiceName || context.profile.defaultVoice || "";
  if (!voiceName) return null;
  return context.voiceMap?.[voiceName] || null;
}

function buildVoiceSystemPrompt(context, voice) {
  return buildSystemPrompt(context.profile, context.library, voice);
}

export async function generateTopic(context, input, modelOverride) {
  const voice = resolveVoice(context, input);
  const brief = applyVoiceToBrief(createBrief(input, context.profile), voice);
  const fallback = fallbackTopicCard(brief, context.library, voice);
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: topicPrompt(brief)
    }
  });

  if (result.mode !== "remote") {
    return { data: fallback, meta: result };
  }

  return {
    data: { ...fallback, ...tryParseJson(result.text, fallback) },
    meta: result
  };
}

export async function generateOutline(context, input, modelOverride) {
  const voice = resolveVoice(context, input);
  const brief = applyVoiceToBrief(createBrief(input, context.profile), voice);
  const fallback = fallbackOutline(brief, voice);
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: outlinePrompt(brief)
    }
  });

  if (result.mode !== "remote") {
    return { data: fallback, meta: result };
  }

  return {
    data: { ...fallback, ...tryParseJson(result.text, fallback) },
    meta: result
  };
}

export async function generateDraft(context, input, modelOverride) {
  const voice = resolveVoice(context, input);
  const brief = applyVoiceToBrief(createBrief(input, context.profile), voice);
  const fallback = fallbackDraft(brief, voice);
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: draftPrompt(brief)
    }
  });

  return {
    data: result.mode === "remote" ? result.text.trim() : fallback,
    meta: result
  };
}

export async function generateTitles(context, input, modelOverride) {
  const voice = resolveVoice(context, input);
  const brief = applyVoiceToBrief(createBrief(input, context.profile), voice);
  const fallback = { titles: fallbackTitles(brief, voice) };
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: titlePrompt(brief)
    }
  });

  if (result.mode !== "remote") {
    return { data: fallback, meta: result };
  }

  return {
    data: { ...fallback, ...tryParseJson(result.text, fallback) },
    meta: result
  };
}

export async function generateRepurpose(context, source, targetPlatform, modelOverride, input = {}) {
  const voice = resolveVoice(context, input);
  const fallback = fallbackRepurpose(source, targetPlatform, voice);
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: repurposePrompt(source, targetPlatform, context.profile)
    }
  });

  return {
    data: result.mode === "remote" ? result.text.trim() : fallback,
    meta: result
  };
}

export async function generateCalendar(context, input, modelOverride) {
  const platform = input.platform || context.profile.defaultPlatform;
  const fallback = { days: fallbackCalendar(input.theme, input.days, platform) };
  const voice = resolveVoice(context, input);
  const result = await generateWithProvider({
    providers: context.providers,
    profile: context.profile,
    modelOverride,
    task: {
      system: buildVoiceSystemPrompt(context, voice),
      user: calendarPrompt({ theme: input.theme, platform, days: input.days })
    }
  });

  if (result.mode !== "remote") {
    return { data: fallback, meta: result };
  }

  return {
    data: { ...fallback, ...tryParseJson(result.text, fallback) },
    meta: result
  };
}

export function describeVoiceUsage(voice) {
  return voice ? summarizeVoice(voice) : "";
}
