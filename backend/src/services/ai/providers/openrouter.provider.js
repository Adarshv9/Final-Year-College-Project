// ── OpenRouter AI Provider ──
// Single source of truth for the OpenAI-compatible client pointed at OpenRouter.
import OpenAI from 'openai';
import ApiError from '../../../utils/ApiError.js';

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const DEFAULT_TEMPERATURE = 0.2;

let _client = null;

const getClient = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(503, 'OpenRouter API key is not configured', [], false);
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
  return _client;
};

/**
 * Send a chat completion request to OpenRouter.
 * @param {Array}  messages     - OpenAI-format messages array
 * @param {Object} [options]    - Override model, temperature, etc.
 * @returns {Promise<string>}   - Raw text content from the model
 */
export const chatCompletion = async (messages, options = {}) => {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    ...options.extra,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new ApiError(502, 'Empty response from AI provider');
  }

  return content;
};

export default { chatCompletion };
