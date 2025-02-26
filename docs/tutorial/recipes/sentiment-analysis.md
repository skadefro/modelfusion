---
sidebar_position: 10
---

# Sentiment Analysis

Sentiment analysis is a natural language processing technique used to determine the emotional tone or subjective information behind words.
It is often implemented using models that are specifically trained for this task, but can also be done with language models.
This is helpful to quickly develop initial product versions and prototypes.

### Using generateStructure and OpenAI Chat Model

[Example](https://github.com/lgrammel/modelfusion/blob/main/examples/basic/src/recipes/sentiment-analysis.ts)

#### Define a sentiment analysis function:

```ts
const analyzeSentiment = async (productReview: string) =>
  generateStructure(
    new OpenAIChatModel({
      model: "gpt-4",
      temperature: 0, // remove randomness
      maxCompletionTokens: 500, // enough tokens for reasoning and sentiment
    }),
    new ZodStructureDefinition({
      name: "sentiment",
      description: "Write the sentiment analysis",
      schema: z.object({
        // Reason first to improve results:
        reasoning: z.string().describe("Reasoning to explain the sentiment."),
        // Report sentiment after reasoning:
        sentiment: z
          .enum(["positive", "neutral", "negative"])
          .describe("Sentiment."),
      }),
    }),
    [
      OpenAIChatMessage.system(
        "You are a sentiment evaluator. " +
          "Analyze the sentiment of the following product review:"
      ),
      OpenAIChatMessage.user(productReview),
    ]
  );
```

#### Use destructuring to get the sentiment:

```ts
// negative sentiment example:
const { sentiment } = await analyzeSentiment(
  "After I opened the package, I was met by a very unpleasant smell " +
    "that did not disappear even after washing. The towel also stained " +
    "extremely well and also turned the seal of my washing machine red. " +
    "Never again!"
);

console.log(sentiment);
// negative
```

#### Get the full reasoning and the sentiment:

```ts
const result = await analyzeSentiment(
  "After I opened the package, I was met by a very unpleasant smell " +
    "that did not disappear even after washing. The towel also stained " +
    "extremely well and also turned the seal of my washing machine red. " +
    "Never again!"
);

console.log(JSON.stringify(result, null, 2));
// {
//   "reasoning": "The reviewer is expressing dissatisfaction with the product.
//      They mention an unpleasant smell, staining, and damage to their washing machine,
//      all of which are negative experiences.",
//   "sentiment": "negative"
// }
```
