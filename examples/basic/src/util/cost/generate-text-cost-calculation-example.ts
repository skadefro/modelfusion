import dotenv from "dotenv";
import {
  DefaultRun,
  OpenAICostCalculator,
  OpenAICompletionModel,
  calculateCost,
  generateText,
} from "modelfusion";

dotenv.config();

async function main() {
  const run = new DefaultRun();

  const text = await generateText(
    new OpenAICompletionModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 0.7,
      maxCompletionTokens: 500,
    }),
    "Write a short story about a robot learning to love:\n\n",
    { run }
  );

  console.log(text);

  const cost = await calculateCost({
    calls: run.successfulModelCalls,
    costCalculators: [new OpenAICostCalculator()],
  });

  console.log();
  console.log(`Cost: ${cost.formatAsDollarAmount({ decimals: 4 })}`);
}

main().catch(console.error);
