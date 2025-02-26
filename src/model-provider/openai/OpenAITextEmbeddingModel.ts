import { z } from "zod";
import { FunctionOptions } from "../../core/FunctionOptions.js";
import { ApiConfiguration } from "../../core/api/ApiConfiguration.js";
import { callWithRetryAndThrottle } from "../../core/api/callWithRetryAndThrottle.js";
import {
  createJsonResponseHandler,
  postJsonToApi,
} from "../../core/api/postToApi.js";
import { AbstractModel } from "../../model-function/AbstractModel.js";
import {
  EmbeddingModel,
  EmbeddingModelSettings,
} from "../../model-function/embed/EmbeddingModel.js";
import { countTokens } from "../../model-function/tokenize-text/countTokens.js";
import { OpenAIApiConfiguration } from "./OpenAIApiConfiguration.js";
import { failedOpenAICallResponseHandler } from "./OpenAIError.js";
import { TikTokenTokenizer } from "./TikTokenTokenizer.js";

export const OPENAI_TEXT_EMBEDDING_MODELS = {
  "text-embedding-ada-002": {
    contextWindowSize: 8192,
    embeddingDimensions: 1536,
    tokenCostInMillicents: 0.01,
  },
};

export type OpenAITextEmbeddingModelType =
  keyof typeof OPENAI_TEXT_EMBEDDING_MODELS;

export const isOpenAIEmbeddingModel = (
  model: string
): model is OpenAITextEmbeddingModelType =>
  model in OPENAI_TEXT_EMBEDDING_MODELS;

export const calculateOpenAIEmbeddingCostInMillicents = ({
  model,
  responses,
}: {
  model: OpenAITextEmbeddingModelType;
  responses: OpenAITextEmbeddingResponse[];
}): number => {
  let amountInMilliseconds = 0;

  for (const response of responses) {
    amountInMilliseconds +=
      response.usage.total_tokens *
      OPENAI_TEXT_EMBEDDING_MODELS[model].tokenCostInMillicents;
  }

  return amountInMilliseconds;
};

export interface OpenAITextEmbeddingModelSettings
  extends EmbeddingModelSettings {
  api?: ApiConfiguration;
  model: OpenAITextEmbeddingModelType;
  isUserIdForwardingEnabled?: boolean;
}

/**
 * Create a text embedding model that calls the OpenAI embedding API.
 *
 * @see https://platform.openai.com/docs/api-reference/embeddings
 *
 * @example
 * const embeddings = await embedMany(
 *   new OpenAITextEmbeddingModel({ model: "text-embedding-ada-002" }),
 *   [
 *     "At first, Nox didn't know what to do with the pup.",
 *     "He keenly observed and absorbed everything around him, from the birds in the sky to the trees in the forest.",
 *   ]
 * );
 */
export class OpenAITextEmbeddingModel
  extends AbstractModel<OpenAITextEmbeddingModelSettings>
  implements EmbeddingModel<string, OpenAITextEmbeddingModelSettings>
{
  constructor(settings: OpenAITextEmbeddingModelSettings) {
    super({ settings });

    this.tokenizer = new TikTokenTokenizer({ model: this.modelName });
    this.contextWindowSize =
      OPENAI_TEXT_EMBEDDING_MODELS[this.modelName].contextWindowSize;

    this.embeddingDimensions =
      OPENAI_TEXT_EMBEDDING_MODELS[this.modelName].embeddingDimensions;
  }

  readonly provider = "openai" as const;
  get modelName() {
    return this.settings.model;
  }

  readonly maxValuesPerCall = 2048;
  readonly isParallizable = true;

  readonly embeddingDimensions: number;

  readonly tokenizer: TikTokenTokenizer;
  readonly contextWindowSize: number;

  async countTokens(input: string) {
    return countTokens(this.tokenizer, input);
  }

  async callAPI(
    texts: Array<string>,
    options?: FunctionOptions
  ): Promise<OpenAITextEmbeddingResponse> {
    return callWithRetryAndThrottle({
      retry: this.settings.api?.retry,
      throttle: this.settings.api?.throttle,
      call: async () =>
        callOpenAITextEmbeddingAPI({
          ...this.settings,
          user: this.settings.isUserIdForwardingEnabled
            ? options?.run?.userId
            : undefined,
          abortSignal: options?.run?.abortSignal,
          input: texts,
        }),
    });
  }

  get settingsForEvent(): Partial<OpenAITextEmbeddingModelSettings> {
    return {};
  }

  async doEmbedValues(texts: string[], options?: FunctionOptions) {
    if (texts.length > this.maxValuesPerCall) {
      throw new Error(
        `The OpenAI embedding API only supports ${this.maxValuesPerCall} texts per API call.`
      );
    }

    const response = await this.callAPI(texts, options);

    return {
      response,
      embeddings: response.data.map((data) => data.embedding),
    };
  }

  withSettings(additionalSettings: OpenAITextEmbeddingModelSettings) {
    return new OpenAITextEmbeddingModel(
      Object.assign({}, this.settings, additionalSettings)
    ) as this;
  }
}

const openAITextEmbeddingResponseSchema = z.object({
  object: z.literal("list"),
  data: z.array(
    z.object({
      object: z.literal("embedding"),
      embedding: z.array(z.number()),
      index: z.number(),
    })
  ),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type OpenAITextEmbeddingResponse = z.infer<
  typeof openAITextEmbeddingResponseSchema
>;

async function callOpenAITextEmbeddingAPI({
  api = new OpenAIApiConfiguration(),
  abortSignal,
  model,
  input,
  user,
}: {
  api?: ApiConfiguration;
  abortSignal?: AbortSignal;
  model: OpenAITextEmbeddingModelType;
  input: Array<string>;
  user?: string;
}): Promise<OpenAITextEmbeddingResponse> {
  return postJsonToApi({
    url: api.assembleUrl("/embeddings"),
    headers: api.headers,
    body: {
      model,
      input,
      user,
    },
    failedResponseHandler: failedOpenAICallResponseHandler,
    successfulResponseHandler: createJsonResponseHandler(
      openAITextEmbeddingResponseSchema
    ),
    abortSignal,
  });
}
