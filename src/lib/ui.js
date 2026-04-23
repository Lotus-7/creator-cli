let spinnerInterval = null;
let spinnerCurrentFrame = 0;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

function colorize(color, text) {
  return `${COLORS[color] || ""}${text}${COLORS.reset}`;
}

export function printHelp() {
  console.log(`creator-cli

Usage:
  creator init
  creator topic <idea> [--platform <name>] [--niche <name>] [--tone <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator outline <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator draft <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator title <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator profile [show]
  creator profile set <key> <value>
  creator profile provider <name> [--enable] [--disable] [--model <id>] [--baseUrl <url>] [--apiKeyEnv <env>]
  creator library [list]
  creator library add <pillar|banned|series> <value>
  creator library remove <pillar|banned|series> <value>
  creator providers list
  creator providers use <name>
  creator providers test [name] [--model <id>] [--no-live]
  creator voice list
  creator voice init <name>
  creator voice show [name]
  creator voice use <name>
  creator voice train <name> <path>
  creator voice edit [name] <field> <value>
  creator voice audit [name] <file-or-text>
  creator voice improve [name] <file-or-text>
  creator repurpose <source> [--to <platform>] [--provider <name>] [--model <id>] [--voice <name>]
  creator calendar <theme> [--days <count>] [--platform <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator chat
  creator help
`);
}

export function printError(message) {
  console.error(colorize("red", `Error: ${message}`));
}

export function printSuccess(message) {
  console.log(message);
}

export function printWarning(message) {
  console.warn(colorize("yellow", `Warning: ${message}`));
}

export function startSpinner(message) {
  if (spinnerInterval) return;

  process.stdout.write(`\r${SPINNER_FRAMES[0]} ${message}`);
  spinnerCurrentFrame = 0;

  spinnerInterval = setInterval(() => {
    spinnerCurrentFrame = (spinnerCurrentFrame + 1) % SPINNER_FRAMES.length;
    process.stdout.write(`\r${SPINNER_FRAMES[spinnerCurrentFrame]} ${message}`);
  }, 80);
}

export function stopSpinner(message = "", success = true) {
  if (!spinnerInterval) return;

  clearInterval(spinnerInterval);
  spinnerInterval = null;

  const icon = success ? "✓" : "✗";
  const color = success ? "green" : "red";
  process.stdout.write(`\r${colorize(color, icon)} ${message}\n`);
}

export function clearLine() {
  process.stdout.write("\r\x1b[K");
}

export function printHeader(text) {
  const line = "─".repeat(Math.max(40, text.length + 4));
  console.log(colorize("cyan", line));
  console.log(colorize("bright", colorize("cyan", `  ${text}  `)));
  console.log(colorize("cyan", line));
}

export function printDivider(char = "─", length = 40) {
  console.log(colorize("gray", char.repeat(length)));
}

export function printLabel(label, text, indent = "") {
  const labelColor = "cyan";
  const coloredLabel = colorize(labelColor, `${label}:`);
  console.log(`${indent}${coloredLabel} ${text}`);
}

export function printList(items, options = {}) {
  const { emoji = "•", indent = "" } = options;
  items.forEach((item, index) => {
    const prefix = typeof emoji === "string" ? emoji : emoji[index];
    console.log(`${indent}${prefix} ${item}`);
  });
}

export function formatTopicCard(data) {
  console.log();
  printHeader("📝 选题卡片");

  printLabel("💡 选题", data.idea, "  ");
  printLabel("🎯 领域", data.niche, "  ");
  printLabel("👥 受众", data.audience, "  ");
  printLabel("📱 平台", data.platform, "  ");
  printLabel("🎨 语气", data.tone, "  ");

  console.log();
  printLabel("🔑 核心角度", "", "  ");
  console.log(`  ${colorize("bright", data.angle)}`);

  console.log();
  printLabel("⚡ 冲突点", "", "  ");
  console.log(`  ${data.coreConflict}`);

  console.log();
  printLabel("🎣 开头钩子", "", "  ");
  console.log(`  ${colorize("yellow", data.hook)}`);

  console.log();
  printLabel("💎 读者收获", "", "  ");
  console.log(`  ${data.payoff}`);

  if (data.pillarsUsed && data.pillarsUsed.length) {
    console.log();
    printLabel("📚 涉及领域", data.pillarsUsed.join("、"), "  ");
  }

  if (data.seriesIdeas && data.seriesIdeas.length) {
    console.log();
    printLabel("📖 系列延伸", "", "  ");
    printList(data.seriesIdeas, { emoji: "  ", indent: "  " });
  }

  console.log();
  return data;
}

export function formatOutline(data) {
  console.log();
  printHeader("📋 内容大纲");

  console.log(colorize("bright", colorize("cyan", `\n${data.title}\n`)));

  data.sections.forEach((section, index) => {
    const num = colorize("cyan", `${index + 1}.`);
    console.log(`  ${num} ${section}`);
  });

  console.log();
  return data;
}

export function formatDraft(content) {
  console.log();
  printHeader("📄 内容初稿");
  console.log();
  console.log(content);
  console.log();
  return content;
}

export function formatTitles(data) {
  console.log();
  printHeader("✨ 标题选项");

  if (data.titles && data.titles.length) {
    console.log();
    data.titles.forEach((title, index) => {
      const num = colorize("cyan", `${String(index + 1).padStart(2)}.`);
      console.log(`  ${num} ${title}`);
    });
  }

  if (data.formulas && data.formulas.length) {
    console.log();
    printLabel("📐 标题公式", "", "  ");
    printList(data.formulas, { emoji: "  ", indent: "  " });
  }

  console.log();
  return data;
}

export function formatCalendar(data) {
  console.log();
  printHeader("📅 发布日历");

  if (data.days && data.days.length) {
    console.log();
    data.days.forEach((day, index) => {
      const date = colorize("cyan", day.date);
      const num = colorize("gray", `#${String(index + 1).padStart(2, "0")}`);
      console.log(`  ${num} ${date} | ${day.platform} | ${day.topic}`);
      console.log(`     格式: ${day.format} | 目标: ${day.goal} | 角度: ${day.angle}`);
      if (index < data.days.length - 1) console.log();
    });
  }

  console.log();
  return data;
}

export function printFileInfo(filePath) {
  console.log();
  printDivider("·", 40);
  console.log(colorize("gray", `  💾 已保存到: ${filePath}`));
  console.log();
}

export function printProviderInfo(provider, model) {
  const providerInfo = colorize("cyan", provider);
  const modelInfo = colorize("gray", `(${model})`);
  console.log(colorize("dim", `  使用: ${providerInfo} ${modelInfo}`));
}
