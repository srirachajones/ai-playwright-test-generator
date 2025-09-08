import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBase } from '../types';

export class RAGRetriever {
  private kb: KnowledgeBase;

  constructor() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase(): void {
    const selectorsPath = path.join(__dirname, '../../kb/selectors/common.json');
    const endpointsPath = path.join(__dirname, '../../kb/apis/endpoints.json');
    
    this.kb = {
      selectors: JSON.parse(fs.readFileSync(selectorsPath, 'utf-8')),
      endpoints: JSON.parse(fs.readFileSync(endpointsPath, 'utf-8'))
    };
  }

  findRelevantSelectors(keywords: string[]): Record<string, string> {
    const relevant: Record<string, string> = {};
    
    for (const keyword of keywords) {
      for (const [category, selectors] of Object.entries(this.kb.selectors)) {
        for (const [name, selector] of Object.entries(selectors)) {
          if (name.includes(keyword.toLowerCase()) || 
              category.includes(keyword.toLowerCase()) ||
              keyword.toLowerCase().includes(name) ||
              keyword.toLowerCase().includes(category)) {
            relevant[`${category}.${name}`] = selector;
          }
        }
      }
    }
    
    return relevant;
  }

  findRelevantEndpoints(keywords: string[]): string[] {
    const relevant: string[] = [];
    
    for (const keyword of keywords) {
      for (const [category, endpoints] of Object.entries(this.kb.endpoints)) {
        for (const [name, endpoint] of Object.entries(endpoints)) {
          if (name.includes(keyword.toLowerCase()) || 
              category.includes(keyword.toLowerCase()) ||
              keyword.toLowerCase().includes(name) ||
              keyword.toLowerCase().includes(category)) {
            relevant.push(`${category}.${name}: ${endpoint}`);
          }
        }
      }
    }
    
    return relevant;
  }

  extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'user', 'should', 'can', 'will'];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.kb;
  }
}
