export interface UserStory {
  description: string;
  acceptance_criteria?: string[];
}

export interface TestScenario {
  title: string;
  type: 'positive' | 'negative' | 'edge' | 'cross-device';
  description: string;
  steps: string[];
  expected_outcome: string;
  device?: 'desktop' | 'mobile' | 'tablet';
}

export interface ValidatedScenario extends TestScenario {
  selectors: Record<string, string>;
  api_endpoints: string[];
  validation_notes: string[];
}

export interface PlaywrightTest {
  filename: string;
  content: string;
}

export interface KnowledgeBase {
  selectors: Record<string, Record<string, string>>;
  endpoints: Record<string, Record<string, string>>;
}

