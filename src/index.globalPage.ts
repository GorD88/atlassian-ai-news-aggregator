/**
 * Global page entry point
 */

import { globalPageResolver } from './index';

// Export the resolver handler function
export const run = globalPageResolver['global-page-handler'];

