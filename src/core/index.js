import { aiClientCore } from './ai/client.js';
import { aiMessageCore } from './ai/messages.js';
import { aiOutputCore } from './ai/output.js';
import { apiProfileCore } from './ai/profiles.js';
import { summarySelectionCore } from './ai/summary-selection.js';
import { postContentCore } from './content/post-format.js';
import { postFetcherCore } from './discourse/post-fetcher.js';
import { topicDataCore } from './discourse/topic-data.js';
import { topicIdentityCore } from './discourse/topic-identity.js';
import { exportCore } from './export.js';
import { renderingCore } from './rendering.js';
import { coreState } from './state.js';

export const Core = Object.assign(
  {},
  coreState,
  apiProfileCore,
  topicIdentityCore,
  aiOutputCore,
  summarySelectionCore,
  aiMessageCore,
  topicDataCore,
  postContentCore,
  postFetcherCore,
  aiClientCore,
  renderingCore,
  exportCore
);
