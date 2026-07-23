# AI Services

## Overview

Meadow integrates AI services through a layered architecture that abstracts provider implementations, manages prompts centrally, and enforces runtime type safety via Zod schemas.

## AI Provider Abstraction

All AI interactions go through a unified provider interface. Concrete implementations exist for each supported provider (OpenAI, Anthropic, etc.).

```
providers/
  base.ts          — Abstract provider class
  openai.ts        — OpenAI implementation
  anthropic.ts     — Anthropic implementation
  registry.ts      — Provider registry & factory
```

The base provider defines a common contract:

- `complete(prompt, options)` — Single-turn completion
- `stream(prompt, options)` — Streaming completion
- `embed(input)` — Generate embeddings
- `model()` — Return the active model identifier

Selection happens via environment configuration, not at call sites.

## Prompt Management

Hardcoded prompts are prohibited. All prompts live in a dedicated directory and are loaded by key.

```
prompts/
  summarize.yaml
  extract-entities.yaml
  classify-intent.yaml
  ...
```

Each prompt file includes:

- `system` — System message template
- `template` — User message template (Handlebars or equivalent)
- `variables` — Declared variable names with descriptions
- `model` — Optional model override
- `maxTokens` — Optional token limit override

Prompts are loaded via `getPrompt(key, variables)` which validates that all required variables are provided and no unknown variables are passed.

## Response Parsing with Zod

Every AI call that returns structured data defines a Zod schema. Parsing is a required step, not optional.

```ts
const SummarySchema = z.object({
  title: z.string(),
  keyPoints: z.array(z.string()).max(5),
  sentiment: z.enum(["positive", "negative", "neutral"]),
})

const result = SummarySchema.parse(raw)
```

Schemas live alongside the consuming feature or in a shared `schemas/` directory.

Parsing failures are caught and surfaced as typed errors, not runtime crashes. The error includes the raw response for debugging.

## Streaming

Streaming is a first-class concern. The `stream()` method returns an async iterable.

```ts
for await (const chunk of ai.stream(prompt, options)) {
  appendToOutput(chunk.delta)
}
```

Streaming responses that target structured output buffer chunks, attempt incremental parsing, and yield partial results when safe.

## Token Management

Token counting is handled at the provider layer before requests are sent.

- Input tokens are estimated using provider-specific tokenizers
- A pre-request check rejects prompts that exceed the model's context window
- Output token limits are passed to the provider and enforced on the response

## Model Abstraction

Consumers reference models by capability, not by name.

- `fast` — Low-latency model for simple tasks
- `default` — Balanced model for general use
- `capable` — High-quality model for complex reasoning

The mapping from capability to concrete model name is configuration-driven.

## Error Handling

AI errors are categorized and surfaced via a discriminated union:

```
AiError
  ├── AuthenticationError
  ├── RateLimitError
  ├── ContextWindowExceededError
  ├── ParsingError
  ├── TimeoutError
  └── ProviderError
```

Every error includes:

- `provider` — Which provider was used
- `model` — Which model was used
- `durationMs` — How long the request lived
- `raw` — The original error from the provider (if available)

## Retry Logic

Retries are handled by a wrapper that applies configurable policies:

- Maximum retries (default: 3)
- Backoff strategy (exponential with jitter)
- Retryable error types (RateLimitError, TimeoutError, ProviderError)
- Non-retryable errors (AuthenticationError, ParsingError) surface immediately

The retry layer logs each attempt with duration and reason.
