import { UserStory, TestScenario } from '../types';
import { LangChainClient } from '../llm/langchain-client';
import { AGENT_A_TEMPLATE } from '../llm/prompt-templates';

export class LangChainAgentA {
  private llmClient: LangChainClient;

  constructor(llmClient?: LangChainClient) {
    this.llmClient = llmClient || new LangChainClient();
  }

  async expandUserStory(userStory: UserStory): Promise<TestScenario[]> {
    try {
      console.log(`Agent A (${this.llmClient.getModelInfo().provider}): Generating scenarios...`);
      
      // Generate scenarios using LangChain
      const response = await this.llmClient.generateWithTemplate(AGENT_A_TEMPLATE, {
        userStory: userStory.description
      });

      // Parse JSON response
      const scenarios = this.parseScenarios(response);
      
      console.log(`Agent A: Generated ${scenarios.length} scenarios`);
      return scenarios;
      
    } catch (error) {
      console.error('Agent A failed:', error);
      
      // Fallback to rule-based generation
      console.log('🔄 Falling back to rule-based scenario generation...');
      return this.generateFallbackScenarios(userStory);
    }
  }

  private parseScenarios(response: string): TestScenario[] {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const scenarios = JSON.parse(cleanResponse);
      
      if (!Array.isArray(scenarios)) {
        throw new Error('Response is not an array');
      }

      // Validate each scenario
      return scenarios.map((scenario, index) => this.validateScenario(scenario, index));
      
    } catch (error) {
      console.warn('Failed to parse LLM response:', error);
      console.warn('Raw response:', response);
      throw new Error(`Failed to parse scenarios: ${error}`);
    }
  }

  private validateScenario(scenario: any, index: number): TestScenario {
    const requiredFields = ['title', 'type', 'description', 'steps', 'expected_outcome'];
    const missingFields = requiredFields.filter(field => !scenario[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Scenario ${index} missing fields: ${missingFields.join(', ')}`);
    }

    if (!['positive', 'negative', 'edge', 'cross-device'].includes(scenario.type)) {
      scenario.type = 'positive'; // Default fallback
    }

    if (!Array.isArray(scenario.steps)) {
      scenario.steps = [scenario.steps].filter(Boolean);
    }

    return {
      title: scenario.title,
      type: scenario.type,
      description: scenario.description,
      steps: scenario.steps,
      expected_outcome: scenario.expected_outcome,
      device: scenario.device || (scenario.type === 'cross-device' ? 'mobile' : 'desktop')
    };
  }

  private generateFallbackScenarios(userStory: UserStory): TestScenario[] {
    const baseTitle = this.extractTitle(userStory.description);

    return [
      {
        title: `${baseTitle} - Happy Path`,
        type: 'positive' as const,
        description: `User successfully completes: ${userStory.description}`,
        steps: this.generatePositiveSteps(userStory.description),
        expected_outcome: 'User successfully completes the action with expected results',
        device: 'desktop' as const
      },
      {
        title: `${baseTitle} - Invalid Input`,
        type: 'negative' as const,
        description: `User attempts ${userStory.description} with invalid data`,
        steps: this.generateNegativeSteps(userStory.description),
        expected_outcome: 'System displays appropriate error messages and prevents invalid actions',
        device: 'desktop' as const
      },
      {
        title: `${baseTitle} - Network Error`,
        type: 'edge' as const,
        description: `User attempts ${userStory.description} during network issues`,
        steps: this.generateEdgeCaseSteps(userStory.description),
        expected_outcome: 'System gracefully handles network errors with proper user feedback',
        device: 'desktop' as const
      },
      {
        title: `${baseTitle} - Mobile Experience`,
        type: 'cross-device' as const,
        description: `User completes ${userStory.description} on mobile device`,
        steps: this.generatePositiveSteps(userStory.description),
        expected_outcome: 'Mobile interface provides equivalent functionality with responsive design',
        device: 'mobile' as const
      }
    ];
  }

  private extractTitle(description: string): string {
    const words = description.split(' ');
    const actionWords = words.filter(word => 
      ['sign', 'login', 'request', 'submit', 'create', 'update', 'delete', 'view'].some(action => 
        word.toLowerCase().includes(action)
      )
    );
    return actionWords.length > 0 ? actionWords.join(' ') : words.slice(0, 3).join(' ');
  }

  private generatePositiveSteps(description: string): string[] {
    const steps = ['Navigate to the application'];
    
    if (description.toLowerCase().includes('sign up') || description.toLowerCase().includes('register')) {
      steps.push(
        'Click on sign up/register link',
        'Fill in valid user information',
        'Submit the registration form',
        'Verify email confirmation if required'
      );
    } else if (description.toLowerCase().includes('login') || description.toLowerCase().includes('sign in')) {
      steps.push(
        'Enter valid email/username',
        'Enter correct password',
        'Click login button',
        'Verify successful authentication'
      );
    } else if (description.toLowerCase().includes('credit report')) {
      steps.push(
        'Log in to user account',
        'Navigate to credit report section',
        'Click request credit report button',
        'Complete any required verification',
        'Wait for report generation',
        'Download or view the report'
      );
    } else {
      steps.push(
        'Perform the primary action described',
        'Complete any required form fields',
        'Submit the request',
        'Verify successful completion'
      );
    }
    
    return steps;
  }

  private generateNegativeSteps(description: string): string[] {
    return [
      'Navigate to the application',
      'Attempt to perform action with invalid/missing data',
      'Submit the form/request',
      'Observe error handling and validation messages',
      'Verify system prevents invalid operations'
    ];
  }

  private generateEdgeCaseSteps(description: string): string[] {
    return [
      'Navigate to the application',
      'Begin the intended action',
      'Simulate network interruption or slow connection',
      'Attempt to complete the action',
      'Verify system handles the error gracefully',
      'Test recovery mechanisms'
    ];
  }
}
