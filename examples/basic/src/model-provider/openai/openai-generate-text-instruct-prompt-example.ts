import dotenv from "dotenv";
import {
  OpenAICompletionModel,
  generateText,
  mapInstructionPromptToTextFormat,
} from "modelfusion";

dotenv.config();

async function main() {
  const text = await generateText(
    new OpenAICompletionModel({
      model: "gpt-3.5-turbo-instruct",
      temperature: 0.7,
      maxCompletionTokens: 500,
    }).withPromptFormat(mapInstructionPromptToTextFormat()),
    {
      instruction: "Write a short story about:",
      input: "a robot learning to love",
    }
  );

  console.log(text);
}

main().catch(console.error);
