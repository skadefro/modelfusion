---
sidebar_position: 10
title: Stability AI
---

# Stability AI

## Setup

1. You can get an API key from [Stability AI](https://platform.stability.ai/docs/getting-started/authentication).
1. The API key can be configured as an environment variable (`STABILITY_API_KEY`) or passed in as an option into the model constructor.

## Configuration

### API Configuration

[Stability API Configuration](/api/classes/StabilityApiConfiguration)

```ts
const api = new StabilityApiConfiguration({
  // ...
});

const model = new StabilityImageGenerationModel({
  api,
  // ...
});
```

## Model Functions

[Examples](https://github.com/lgrammel/modelfusion/tree/main/examples/basic/src/model-provider/stability)

### Generate Image

[StabilityImageGenerationModel API](/api/classes/StabilityImageGenerationModel)

```ts
import { StabilityImageGenerationModel, generateImage } from "modelfusion";

const imageBase64 = await generateImage(
  new StabilityImageGenerationModel({
    model: "stable-diffusion-512-v2-1",
    cfgScale: 7,
    clipGuidancePreset: "FAST_BLUE",
    height: 512,
    width: 512,
    samples: 1,
    steps: 30,
  }),
  [
    { text: "the wicked witch of the west" },
    { text: "style of early 19th century painting", weight: 0.5 },
  ]
);
```

## Prompt Format

### Basic text prompt

You an use [mapBasicPromptToStabilityFormat()](/api/modules#mapbasicprompttostabilityformat) to use text prompts with Stability models. It is available as a shorthand method:

```ts
const image = await generateImage(
  new StabilityImageGenerationModel({
    //...
  }).withBasicPrompt(),
  "the wicked witch of the west in the style of early 19th century painting"
);
```
