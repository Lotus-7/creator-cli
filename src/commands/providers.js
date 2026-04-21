import { loadContext, saveProfile, saveProviders } from "../lib/storage.js";
import { probeProvider } from "../lib/providers.js";
import { printSuccess } from "../lib/ui.js";

function renderProbe(result) {
  return [
    `[${result.status.toUpperCase()}] ${result.provider}`,
    `type=${result.type}`,
    `enabled=${result.enabled}`,
    `model=${result.model}`,
    result.baseUrl ? `baseUrl=${result.baseUrl}` : null,
    result.apiKeyEnv ? `apiKeyEnv=${result.apiKeyEnv}` : null,
    `mode=${result.mode}`,
    `detail=${result.detail}`
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function runProviders(positionals, options) {
  const [subcommand = "test", target] = positionals;
  const context = await loadContext();

  if (subcommand === "list") {
    const lines = Object.entries(context.providers.providers).map(([name, config]) => {
      const marker = context.providers.defaultProvider === name ? "*" : " ";
      const activeModel =
        context.profile.aiProvider === name && context.profile.aiModel ? context.profile.aiModel : config.model;
      return [
        `${marker} ${name}`,
        `type=${config.type}`,
        `enabled=${config.enabled}`,
        `model=${activeModel}`,
        config.baseUrl ? `baseUrl=${config.baseUrl}` : null,
        config.apiKeyEnv ? `apiKeyEnv=${config.apiKeyEnv}` : null
      ]
        .filter(Boolean)
        .join(" | ");
    });

    printSuccess(`Default provider: ${context.providers.defaultProvider}`);
    for (const line of lines) {
      printSuccess(line);
    }
    return;
  }

  if (subcommand === "use") {
    if (!target) {
      throw new Error("providers use requires a provider name");
    }

    const provider = context.providers.providers[target];
    if (!provider) {
      throw new Error(`Unknown provider: ${target}`);
    }

    context.providers.defaultProvider = target;
    context.profile.aiProvider = target;
    context.profile.aiModel = provider.model;

    await saveProviders(context.providers);
    await saveProfile(context.profile);
    printSuccess(`Default provider set to ${target} with model ${provider.model}`);
    return;
  }

  if (subcommand === "test") {
    const entries = Object.entries(context.providers.providers);
    const selected = target ? entries.filter(([name]) => name === target) : entries;

    if (!selected.length) {
      throw new Error(`Unknown provider: ${target}`);
    }

    const live = options.live === false || options["no-live"] ? false : true;
    const results = [];

    for (const [name, config] of selected) {
      const result = await probeProvider(name, config, context.profile, {
        live,
        model: options.model
      });
      results.push(result);
    }

    const summary = {
      ok: results.filter((item) => item.status === "ok").length,
      warn: results.filter((item) => item.status === "warn").length,
      error: results.filter((item) => item.status === "error").length
    };

    printSuccess(`Provider test summary: ok=${summary.ok} warn=${summary.warn} error=${summary.error}`);
    for (const result of results) {
      printSuccess(renderProbe(result));
    }
    return;
  }

  throw new Error(`Unknown providers subcommand: ${subcommand}`);
}
