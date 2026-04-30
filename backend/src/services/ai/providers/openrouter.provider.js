// Sends AI requests through the OpenRouter provider.


import OpenAI from 'openai';
import ApiError from '../../../utils/ApiError.js';
import logger from '../../../utils/logger.js';

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';


const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_TEMPERATURE = 0.2;

let _client = null;

// Get client.
const getClient = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(503, 'OpenRouter API key is not configured', [], false);
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0
    });
  }
  return _client;
};







// Handle Completion.
export const chatCompletion = async (messages, options = {}) => {
  const client = getClient();
  const model = options.model || DEFAULT_MODEL;

  logger.info(`[AI] Sending request to model: ${model}`);

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      ...options.extra
    });
  } catch (err) {
    if (err?.code === 'ETIMEDOUT' || err?.name === 'APIConnectionTimeoutError' || err?.message?.includes('timeout')) {
      logger.error(`[AI] Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s for model: ${model}`);
      throw new ApiError(504, 'AI provider timed out. Please try again.');
    }
    logger.error(`[AI] Provider error: ${err?.message}`);
    throw new ApiError(502, `AI provider error: ${err?.message}`);
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    logger.error(`[AI] Empty response from model: ${model}`);
    throw new ApiError(502, 'Empty response from AI provider');
  }

  logger.info(`[AI] Response received from model: ${model}`);
  return content;
};

export default { chatCompletion };