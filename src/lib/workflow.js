import { makeOutputName } from "./utils.js";

export function getModelOverride(options) {
  if (!options.provider && !options.model) {
    return null;
  }

  return {
    provider: options.provider,
    model: options.model
  };
}

export function renderOutline(outline) {
  return `# ${outline.title}

${outline.sections.map((section, index) => `${index + 1}. ${section}`).join("\n")}
`;
}

export function renderTitles(payload) {
  return `# Title Options

${payload.titles.map((title, index) => `${index + 1}. ${title}`).join("\n")}
`;
}

export function renderCalendar(payload) {
  return `# 发布日历

${payload.days
  .map(
    (item, index) =>
      `${index + 1}. ${item.date} | ${item.platform || ""} | ${item.topic} | ${item.format} | ${item.goal} | ${item.angle}`
  )
  .join("\n")}
`;
}

export { makeOutputName };
