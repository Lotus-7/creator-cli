import { readFile } from "node:fs/promises";

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function makeOutputName(kind, idea, extension) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${timestamp}-${kind}-${slugify(idea)}.${extension}`;
}

export function normalizePlatform(platform) {
  const value = platform.toLowerCase();
  if (value === "xiaohongshu") return "小红书";
  if (value === "douyin") return "抖音";
  if (value === "wechat") return "微信公众号";
  return platform;
}

export function normalizeAudience(audience) {
  const value = audience.toLowerCase();
  if (value === "young professionals") return "年轻职场人";
  return audience;
}

export function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function readTextIfFile(input) {
  try {
    return await readFile(input, "utf8");
  } catch (error) {
    return input;
  }
}

export function addDays(date, amount) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function parseList(value) {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}
