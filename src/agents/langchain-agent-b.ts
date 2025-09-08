import { TestScenario, ValidatedScenario } from '../types';
import { LangChainClient } from '../llm/langchain-client';
import { AGENT_B_TEMPLATE } from '../llm/prompt-templates';
import { RAGRetriever } from '../rag/retriever';

export class LangChainAgentB {
  private llmClient: LangChainClient;
  private ragRetriever: RAGRetriever;

  constructor(llmClient?: LangChainClient) {
    this.llmClient = llmClient || new LangChainClient();
    this.ragRetriever = new RAGRetriever();
  }

  async validateScenarios(scenarios: TestScenario[]): Promise<ValidatedScenario[]> {
    console.log(`Agent B (${this.llmClient.getModelInfo().provider}): Validating scenarios...`);
    
    const validatedScenarios = await Promise.all(
      scenarios.map(scenario => this.validateScenario(scenario))
    );
    
    console.log(`Agent B: Validated ${validatedScenarios.length} scenarios`);
    return validatedScenarios;
  }

  private async validateScenario(scenario: TestScenario): Promise<ValidatedScenario> {
    try {
      // Use LangChain for intelligent validation
      const validation = await this.performLLMValidation(scenario);
      
      return {
        ...scenario,
        selectors: validation.relevant_selectors || {},
        api_endpoints: validation.relevant_endpoints || [],
        validation_notes: validation.validation_notes || []
      };
      
    } catch (error) {
      console.warn(`LLM validation failed for scenario: ${scenario.title}, using fallback`);
      
      // Fallback to rule-based validation
      return this.performFallbackValidation(scenario);
    }
  }

  private async performLLMValidation(scenario: TestScenario): Promise<any> {
    const kb = this.ragRetriever.getKnowledgeBase();
    
    const response = await this.llmClient.generateWithTemplate(AGENT_B_TEMPLATE, {
      scenario: JSON.stringify(scenario, null, 2),
      selectors: JSON.stringify(kb.selectors, null, 2),
      endpoints: JSON.stringify(kb.endpoints, null, 2)
    });

    // Parse LLM response
    return this.parseValidationResponse(response);
  }

  private parseValidationResponse(response: string): any {
    try {
      const cleanResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const validation = JSON.parse(cleanResponse);
      
      // Ensure required structure
      return {
        relevant_selectors: validation.relevant_selectors || {},
        relevant_endpoints: validation.relevant_endpoints || [],
        validation_notes: validation.validation_notes || [],
        confidence_score: validation.confidence_score || 0.5
      };
      
    } catch (error) {
      console.warn('Failed to parse validation response:', error);
      throw error;
    }
  }

  private performFallbackValidation(scenario: TestScenario): ValidatedScenario {
    // Extract keywords using the existing RAG retriever
    const keywords = this.ragRetriever.extractKeywords(
      `${scenario.title} ${scenario.description} ${scenario.steps.join(' ')}`
    );

    const relevantSelectors = this.ragRetriever.findRelevantSelectors(keywords);
    const relevantEndpoints = this.ragRetriever.findRelevantEndpoints(keywords);
    
    const validationNotes = this.generateValidationNotes(
      scenario, 
      relevantSelectors, 
      relevantEndpoints
    );

    return {
      ...scenario,
      selectors: relevantSelectors,
      api_endpoints: relevantEndpoints,
      validation_notes: validationNotes
    };
  }

  private generateValidationNotes(
    scenario: TestScenario, 
    selectors: Record<string, string>,
    endpoints: string[]
  ): string[] {
    const notes: string[] = [];

    // Validate selector availability
    if (Object.keys(selectors).length === 0) {
      notes.push('WARNING: No matching selectors found - may need to add custom selectors');
    } else {
      notes.push(`Found ${Object.keys(selectors).length} relevant selectors`);
    }

    // Validate API endpoint availability
    if (endpoints.length === 0) {
      notes.push('WARNING: No matching API endpoints found - may need API mocking');
    } else {
      notes.push(`Found ${endpoints.length} relevant API endpoints`);
    }

    // Device-specific validation
    if (scenario.device === 'mobile') {
      notes.push('Mobile-specific: Ensure responsive selectors and touch interactions');
    }

    // Scenario type-specific validation
    if (scenario.type === 'negative') {
      notes.push('Negative test: Ensure error selectors and validation messages are available');
    } else if (scenario.type === 'edge') {
      notes.push('Edge case: Consider network simulation and error handling');
    }

    return notes;
  }
}

