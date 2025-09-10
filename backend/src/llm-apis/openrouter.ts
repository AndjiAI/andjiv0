import { models } from '@andji/common/old-constants'
import { isExplicitlyDefinedModel } from '@andji/common/util/model-utils'
import { env } from '@andji/internal/env'
import { createOpenRouter } from '@andji/internal/openrouter-ai-sdk'

import type { Model } from '@andji/common/old-constants'

// Provider routing documentation: https://openrouter.ai/docs/features/provider-routing
const providerOrder = {
  [models.openrouter_claude_sonnet_4]: [
    'Google',
    'Anthropic',
    'Amazon Bedrock',
  ],
  [models.openrouter_claude_opus_4]: ['Google', 'Anthropic'],
} as const

export function openRouterLanguageModel(model: Model) {
  const extraBody: Record<string, any> = {
    transforms: ['middle-out'],
  }

  // Set allow_fallbacks based on whether model is explicitly defined
  const isExplicitlyDefined = isExplicitlyDefinedModel(model)

  extraBody.provider = {
    order: providerOrder[model as keyof typeof providerOrder],
    allow_fallbacks: !isExplicitlyDefined,
  }

  return createOpenRouter({
    apiKey: env.OPEN_ROUTER_API_KEY,
    headers: {
      'HTTP-Referer': 'https://andji.com',
      'X-Title': 'andji',
    },
    extraBody,
  }).languageModel(model, {
    usage: { include: true },
    logprobs: true,
  })
}
