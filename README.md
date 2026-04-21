# creator-cli

A workflow-first CLI for content creators. The first version focuses on a simple content pipeline:

1. `topic`
2. `outline`
3. `draft`
4. `title`

This version also adds:

- multi-provider model routing
- `profile`
- `library`
- `repurpose`
- `calendar`
- `voice`

It also includes an interactive `chat` mode and local content storage under `.creator/`.

## Quick start

```bash
cd /Users/lotus-7/creator-cli
node ./src/cli.js help
node ./src/cli.js topic "为什么普通人做自媒体总是断更" --platform xiaohongshu --tone direct
node ./src/cli.js outline "为什么普通人做自媒体总是断更"
node ./src/cli.js draft "为什么普通人做自媒体总是断更"
node ./src/cli.js title "为什么普通人做自媒体总是断更"
node ./src/cli.js profile show
node ./src/cli.js profile set aiProvider openrouter
node ./src/cli.js profile provider openrouter --enable --model openai/gpt-4.1-mini
node ./src/cli.js providers list
node ./src/cli.js providers use qwen
node ./src/cli.js providers test
node ./src/cli.js voice init xiaoqi
node ./src/cli.js voice train xiaoqi ./samples
node ./src/cli.js voice use xiaoqi
node ./src/cli.js voice edit xiaoqi identity 内容创业者
node ./src/cli.js voice audit xiaoqi draft.md
node ./src/cli.js voice improve xiaoqi draft.md
node ./src/cli.js draft "为什么普通人做自媒体总是断更" --voice xiaoqi
node ./src/cli.js library add pillar 选题拆解
node ./src/cli.js repurpose ./.creator/outputs/example.md --to douyin
node ./src/cli.js calendar "个人成长内容矩阵" --days 7
node ./src/cli.js chat
```

## Design

- Workflow first: commands map to creator outcomes, not model primitives.
- Local first: outputs are written to `.creator/outputs/`.
- Context aware: profile and defaults live in `.creator/profile.json`.
- LLM ready: current generation supports local fallback plus remote providers.
- Voice aware: creator voices live in `.creator/voices/` and can be trained from sample texts.

## Provider support

The CLI can route generation through:

- OpenAI `Responses API`
- Kimi via OpenAI-compatible `chat/completions`
- Anthropic `Messages API`
- GLM via OpenAI-compatible `chat/completions`
- Google Gemini `models.generateContent`
- OpenRouter `chat/completions`
- Qwen via OpenAI-compatible `chat/completions`
- Local fallback provider

Provider settings are stored in `.creator/providers.json`.

Typical setup:

```bash
node ./src/cli.js init
node ./src/cli.js profile set aiProvider openrouter
node ./src/cli.js profile provider openrouter --enable --model openai/gpt-4.1-mini
export OPENROUTER_API_KEY=...
```

Supported environment variables:

- `OPENAI_API_KEY`
- `MOONSHOT_API_KEY`
- `ANTHROPIC_API_KEY`
- `ZHIPUAI_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `DASHSCOPE_API_KEY`

## Commands

### `creator init`

Creates `.creator/` with starter profile and content library files.

### `creator topic <idea>`

Generates a topic card with audience, angle, hook, and series ideas.

Options:

- `--platform <name>`
- `--niche <name>`
- `--tone <name>`
- `--audience <name>`
- `--provider <name>`
- `--model <id>`

### `creator outline <idea>`

Generates a content outline.

Options:

- `--provider <name>`
- `--model <id>`

### `creator draft <idea>`

Generates a first draft in markdown.

Options:

- `--provider <name>`
- `--model <id>`
- `--voice <name>`

### `creator title <idea>`

Generates several title options and title formulas.

Options:

- `--provider <name>`
- `--model <id>`
- `--voice <name>`

### `creator profile`

Shows or updates creator defaults and provider settings.

Examples:

```bash
node ./src/cli.js profile show
node ./src/cli.js profile set defaultPlatform 抖音
node ./src/cli.js profile set aiProvider gemini
node ./src/cli.js profile provider gemini --enable --model gemini-2.5-flash
node ./src/cli.js profile set defaultVoice xiaoqi
```

### `creator library`

Manages local content assets.

Examples:

```bash
node ./src/cli.js library list
node ./src/cli.js library add pillar 认知升级
node ./src/cli.js library add series 7天内容挑战
node ./src/cli.js library remove banned 自媒体秘籍
```

### `creator providers test [name]`

Checks provider configuration and, by default, attempts a live minimal request when the provider is enabled and the API key environment variable is present.

Examples:

```bash
node ./src/cli.js providers test
node ./src/cli.js providers test openrouter
node ./src/cli.js providers test qwen --no-live
```

### `creator providers list`

Shows all configured providers and marks the current default provider with `*`.

### `creator providers use <name>`

Switches the default provider and syncs the profile model to that provider's default model.

### `creator voice`

Stores and trains a personal style profile.

Examples:

```bash
node ./src/cli.js voice init xiaoqi
node ./src/cli.js voice train xiaoqi ./samples
node ./src/cli.js voice show xiaoqi
node ./src/cli.js voice use xiaoqi
node ./src/cli.js voice edit xiaoqi coreBeliefs 少空话,先行动,先验证
node ./src/cli.js voice audit xiaoqi ./draft.md
node ./src/cli.js voice improve xiaoqi ./draft.md
node ./src/cli.js draft "今天想聊执行力" --voice xiaoqi
```

Editable voice fields:

- `description`
- `identity`
- `audience`
- `notes`
- `coreBeliefs`
- `bannedPhrases`
- `signaturePhrases`
- `structurePatterns`
- `styleFingerprint.tone`
- `styleFingerprint.sentenceStyle`
- `styleFingerprint.openingStyle`
- `styleFingerprint.closingStyle`
- `styleFingerprint.rhythm`
- `styleFingerprint.emotionalTemperature`

### `creator repurpose <source>`

Rewrites an existing draft for another platform.

Options:

- `--to <platform>`
- `--provider <name>`
- `--model <id>`
- `--voice <name>`

### `creator calendar <theme>`

Generates a publishing calendar.

Options:

- `--days <count>`
- `--platform <name>`
- `--provider <name>`
- `--model <id>`
- `--voice <name>`

### `creator chat`

Starts a simple interactive workflow shell.

## Storage

Generated files go to:

- `.creator/profile.json`
- `.creator/library.json`
- `.creator/providers.json`
- `.creator/voices/*.json`
- `.creator/outputs/*.md`
- `.creator/outputs/*.json`
