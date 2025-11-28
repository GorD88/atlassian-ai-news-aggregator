/**
 * Confluence API types
 */

export interface ConfluencePage {
  id: string;
  title: string;
  space: {
    key: string;
  };
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version: {
    number: number;
  };
  _links: {
    webui: string;
  };
}

export interface CreatePageRequest {
  title: string;
  space: {
    key: string;
  };
  type: string;
  body: {
    storage: {
      value: string;
      representation: string;
    };
  };
  ancestors?: Array<{ id: string }>;
}

export interface UpdatePageRequest extends CreatePageRequest {
  version: {
    number: number;
  };
}

