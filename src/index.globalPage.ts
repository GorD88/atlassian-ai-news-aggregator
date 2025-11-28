/**
 * Global page entry point
 */

import { globalPage } from './index';

export const run = globalPage['global-page-handler'] || globalPage;

