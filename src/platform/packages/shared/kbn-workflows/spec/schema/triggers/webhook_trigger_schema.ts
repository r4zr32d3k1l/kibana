/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { z } from '@kbn/zod/v4';

/**
 * Authentication for the webhook trigger.
 *  - `apiKey` — reuses the existing workflows API key mechanism (no secrets in YAML).
 *  - `basic`  — username/password inline in the YAML (insecure; no secrets store yet).
 *  - `none`   — anyone with the URL can execute.
 */
export const WebhookTriggerAuthSchema = z.union([
  z.object({ type: z.literal('apiKey') }),
  z.object({
    type: z.literal('basic'),
    username: z.string(),
    password: z.string(),
  }),
  z.object({ type: z.literal('none') }),
]);

/**
 * JSON-Schema-style declaration of the payload the webhook accepts. Mirrors the
 * `inputs` block used by the manual trigger so `{{ inputs.* }}` references resolve.
 */
export const WebhookTriggerInputsSchema = z.object({
  properties: z.record(
    z.string(),
    z
      .object({
        type: z.string(),
        required: z.boolean().optional(),
      })
      .passthrough()
  ),
});

/**
 * Webhook trigger — runs a workflow when an HTTP request hits the workflow's
 * public execute endpoint (GET or POST).
 */
export const WebhookTriggerSchema = z.object({
  type: z.literal('webhook'),
  auth: WebhookTriggerAuthSchema.optional(),
  inputs: WebhookTriggerInputsSchema.optional(),
});
