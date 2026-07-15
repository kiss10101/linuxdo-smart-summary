import './ui/style1/index.js';
import './ui/style2.js';
import { startUserscript } from './app/bootstrap.js';

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startUserscript, { once: true });
} else {
  startUserscript();
}
