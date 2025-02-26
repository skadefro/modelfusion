import dotenv from "dotenv";
import {
  OpenAIApiConfiguration,
  OpenAICompletionModel,
  generateText,
} from "modelfusion";

dotenv.config();

async function main() {
  try {
    const text = await generateText(
      new OpenAICompletionModel({
        api: new OpenAIApiConfiguration({
          baseUrl: "invalid-url",
        }),
        model: "gpt-3.5-turbo-instruct",
        temperature: 0.7,
        maxCompletionTokens: 500,
      }),
      "Write a short story about a robot learning to love:\n\n"
    );

    console.log(text);
  } catch (error) {
    console.log(error);
  }
}

main().catch(console.error);
