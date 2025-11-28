/**
 * Global page entry point
 * 
 * For Custom UI with resolver, we need to export the handler function
 * that processes all resolver calls. The resolver function name in manifest.yml
 * points to this handler.
 */

import { globalPageResolver } from './index';

// Export the resolver definitions handler
// This handler receives calls from Custom UI bridge and routes them to the correct function
export const run = globalPageResolver;

