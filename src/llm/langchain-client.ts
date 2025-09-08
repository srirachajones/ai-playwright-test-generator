import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { Ollama } from '@langchain/ollama';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { LLMConfig } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export class LangChainClient {
  private model: BaseLanguageModel;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = this.createConfig(config);
    this.model = this.initializeModel();
  }

  private createConfig(config?: Partial<LLMConfig>): LLMConfig {
    const provider = config?.provider || (process.env.LLM_PROVIDER as 'openai' | 'anthropic' | 'ollama') || 'openai';
    
    return {
      provider,
      maxRetries: config?.maxRetries || parseInt(process.env.MAX_RETRIES || '3'),
      model: config?.model || this.getDefaultModel(provider),
      apiKey: config?.apiKey || this.getApiKey(provider),
      baseUrl: config?.baseUrl || process.env.OLLAMA_BASE_URL,
    };
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
      case 'anthropic':
        return process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
      case 'ollama':
        return process.env.OLLAMA_MODEL || 'llama2';
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private getApiKey(provider: string): string | undefined {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'ollama':
        return undefined; // Ollama doesn't need API key
      default:
        return undefined;
    }
  }

  private initializeModel(): BaseLanguageModel {
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.apiKey) {
          throw new Error('OPENAI_API_KEY environment variable is required');
        }
        return new ChatOpenAI({
          openAIApiKey: this.config.apiKey,
          modelName: this.config.model,
          temperature: 0.7,
          maxTokens: 2000,
          maxRetries: this.config.maxRetries,
        });

      case 'anthropic':
        if (!this.config.apiKey) {
          throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        return new ChatAnthropic({
          anthropicApiKey: this.config.apiKey,
          modelName: this.config.model,
          temperature: 0.7,
          maxTokens: 2000,
          maxRetries: this.config.maxRetries,
        });

      case 'ollama':
        return new Ollama({
          baseUrl: this.config.baseUrl || 'http://localhost:11434',
          model: this.config.model,
          temperature: 0.7,
        });

      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      const response = await this.model.invoke(messages);
      return response.content as string;
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error(`Failed to generate LLM response: ${error}`);
    }
  }

  async generateWithTemplate(template: PromptTemplate, variables: Record<string, any>): Promise<string> {
    try {
      const chain = new LLMChain({
        llm: this.model,
        prompt: template,
      });

      const response = await chain.call(variables);
      return response.text;
    } catch (error) {
      console.error('LLM chain error:', error);
      throw new Error(`Failed to generate response with template: ${error}`);
    }
  }

  async generateWithRetry(systemPrompt: string, userPrompt: string, maxRetries?: number): Promise<string> {
    const retries = maxRetries || this.config.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.generateResponse(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error as Error;
        console.warn(`LLM attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`LLM failed after ${retries} attempts. Last error: ${lastError!.message}`);
  }

  getModelInfo(): { provider: string; model: string } {
    return {
      provider: this.config.provider,
      model: this.config.model
    };
  }
}

