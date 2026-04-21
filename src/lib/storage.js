import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CREATOR_DIR = path.join(ROOT, ".creator");
const OUTPUT_DIR = path.join(CREATOR_DIR, "outputs");
const VOICES_DIR = path.join(CREATOR_DIR, "voices");
const PROFILE_PATH = path.join(CREATOR_DIR, "profile.json");
const LIBRARY_PATH = path.join(CREATOR_DIR, "library.json");
const PROVIDERS_PATH = path.join(CREATOR_DIR, "providers.json");

const DEFAULT_PROFILE = {
  brandName: "My Creator Brand",
  voice: "清晰、温暖、直接",
  defaultPlatform: "小红书",
  defaultNiche: "个人成长",
  defaultAudience: "想认真做内容的普通创作者",
  contentGoals: ["建立信任", "提升收藏率", "形成可复用系列"],
  aiProvider: "local",
  aiModel: "creator-local-v1",
  defaultVoice: ""
};

const DEFAULT_LIBRARY = {
  pillars: ["认知", "流程", "表达"],
  bannedWords: [],
  recurringSeries: []
};

const DEFAULT_PROVIDERS = {
  defaultProvider: "local",
  providers: {
    local: {
      type: "local",
      enabled: true,
      model: "creator-local-v1"
    },
    openai: {
      type: "openai",
      enabled: false,
      baseUrl: "https://api.openai.com/v1",
      apiKeyEnv: "OPENAI_API_KEY",
      model: "gpt-5-mini"
    },
    openrouter: {
      type: "openrouter",
      enabled: false,
      baseUrl: "https://openrouter.ai/api/v1",
      apiKeyEnv: "OPENROUTER_API_KEY",
      model: "openai/gpt-4.1-mini"
    },
    kimi: {
      type: "openai_compatible",
      enabled: false,
      baseUrl: "https://api.moonshot.ai/v1",
      apiKeyEnv: "MOONSHOT_API_KEY",
      model: "kimi-k2.5"
    },
    anthropic: {
      type: "anthropic",
      enabled: false,
      baseUrl: "https://api.anthropic.com",
      apiKeyEnv: "ANTHROPIC_API_KEY",
      model: "claude-sonnet-4-20250514"
    },
    glm: {
      type: "openai_compatible",
      enabled: false,
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      apiKeyEnv: "ZHIPUAI_API_KEY",
      model: "glm-5"
    },
    gemini: {
      type: "gemini",
      enabled: false,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      apiKeyEnv: "GEMINI_API_KEY",
      model: "gemini-2.5-flash"
    },
    qwen: {
      type: "openai_compatible",
      enabled: false,
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKeyEnv: "DASHSCOPE_API_KEY",
      model: "qwen-plus"
    }
  }
};

export async function ensureWorkspace() {
  await mkdir(CREATOR_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(VOICES_DIR, { recursive: true });
  await ensureJsonFile(PROFILE_PATH, DEFAULT_PROFILE);
  await ensureJsonFile(LIBRARY_PATH, DEFAULT_LIBRARY);
  await ensureJsonFile(PROVIDERS_PATH, DEFAULT_PROVIDERS);

  return {
    root: ROOT,
    creatorDir: CREATOR_DIR,
    outputDir: OUTPUT_DIR,
    voicesDir: VOICES_DIR,
    profilePath: PROFILE_PATH,
    libraryPath: LIBRARY_PATH,
    providersPath: PROVIDERS_PATH
  };
}

export async function loadContext() {
  await ensureWorkspace();

  const profile = migrateProfile(await safeReadJson(PROFILE_PATH, DEFAULT_PROFILE));
  const library = migrateLibrary(await safeReadJson(LIBRARY_PATH, DEFAULT_LIBRARY));
  const providers = migrateProviders(await safeReadJson(PROVIDERS_PATH, DEFAULT_PROVIDERS));
  const voiceNames = await listVoices();
  const voices = await Promise.all(voiceNames.map((name) => loadVoice(name)));
  const voiceMap = Object.fromEntries(voiceNames.map((name, index) => [name, voices[index]]).filter(([, voice]) => Boolean(voice)));

  await writeJson(PROFILE_PATH, profile);
  await writeJson(LIBRARY_PATH, library);
  await writeJson(PROVIDERS_PATH, providers);

  return { profile, library, providers, voiceMap };
}

export async function writeOutputFile(name, content) {
  await ensureWorkspace();
  const filePath = path.join(OUTPUT_DIR, name);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

export async function writeJson(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function saveProfile(profile) {
  await ensureWorkspace();
  await writeJson(PROFILE_PATH, profile);
}

export async function saveLibrary(library) {
  await ensureWorkspace();
  await writeJson(LIBRARY_PATH, library);
}

export async function saveProviders(providers) {
  await ensureWorkspace();
  await writeJson(PROVIDERS_PATH, providers);
}

export async function ensureVoice(name, initialVoice) {
  await ensureWorkspace();
  const filePath = path.join(VOICES_DIR, `${name}.json`);
  await ensureJsonFile(filePath, initialVoice);
  return filePath;
}

export async function loadVoice(name) {
  await ensureWorkspace();
  return safeReadJson(path.join(VOICES_DIR, `${name}.json`), null);
}

export async function saveVoice(name, voice) {
  await ensureWorkspace();
  await writeJson(path.join(VOICES_DIR, `${name}.json`), voice);
}

export async function listVoices() {
  await ensureWorkspace();
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(VOICES_DIR, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort();
}

async function safeReadJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (isPlainObject(fallback) && isPlainObject(parsed)) {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch (error) {
    return fallback;
  }
}

async function ensureJsonFile(filePath, fallback) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    await writeJson(filePath, fallback);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function migrateProfile(profile) {
  const migrated = { ...profile };

  if (migrated.voice === "clear, warm, direct") {
    migrated.voice = DEFAULT_PROFILE.voice;
  }
  if (migrated.defaultPlatform === "xiaohongshu") {
    migrated.defaultPlatform = DEFAULT_PROFILE.defaultPlatform;
  }
  if (migrated.defaultNiche === "personal growth") {
    migrated.defaultNiche = DEFAULT_PROFILE.defaultNiche;
  }
  if (migrated.defaultAudience === "young professionals") {
    migrated.defaultAudience = DEFAULT_PROFILE.defaultAudience;
  }
  if (Array.isArray(migrated.contentGoals)) {
    migrated.contentGoals = migrated.contentGoals.map((goal) => {
      if (goal === "grow trust") return "建立信任";
      if (goal === "increase saves") return "提升收藏率";
      if (goal === "build repeatable series") return "形成可复用系列";
      return goal;
    });
  }
  if (!migrated.aiProvider) {
    migrated.aiProvider = DEFAULT_PROFILE.aiProvider;
  }
  if (!migrated.aiModel) {
    migrated.aiModel = DEFAULT_PROFILE.aiModel;
  }
  if (typeof migrated.defaultVoice !== "string") {
    migrated.defaultVoice = DEFAULT_PROFILE.defaultVoice;
  }

  return migrated;
}

function migrateProviders(providers) {
  const merged = {
    ...DEFAULT_PROVIDERS,
    ...providers,
    providers: {
      ...DEFAULT_PROVIDERS.providers,
      ...(providers.providers || {})
    }
  };

  for (const key of Object.keys(DEFAULT_PROVIDERS.providers)) {
    merged.providers[key] = {
      ...DEFAULT_PROVIDERS.providers[key],
      ...(merged.providers[key] || {})
    };
  }

  return merged;
}

function migrateLibrary(library) {
  const migrated = {
    ...DEFAULT_LIBRARY,
    ...library
  };

  migrated.pillars = (migrated.pillars || []).map((item) => {
    if (item === "mindset") return "认知";
    if (item === "workflow") return "流程";
    if (item === "storytelling") return "表达";
    return item;
  });

  return migrated;
}
