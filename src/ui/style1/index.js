import { UIRegistry } from '../registry.js';
import { style1Events } from './events.js';
import { style1Helpers } from './helpers.js';
import { style1Interactions } from './interactions.js';
import { style1Lifecycle } from './lifecycle.js';
import { style1Presentation } from './presentation.js';
import { style1State } from './state.js';

export const style1 = Object.assign(
  {},
  style1Lifecycle,
  style1Presentation,
  style1Events,
  style1State,
  style1Interactions,
  style1Helpers
);

UIRegistry.register('style1', style1);
