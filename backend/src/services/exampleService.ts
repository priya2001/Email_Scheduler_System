import { logger } from '../utils/logger';

/**
 * Example service demonstrating the service layer pattern
 * Services contain business logic and communicate with external systems
 */
export class ExampleService {
  /**
   * Example method for demonstration
   */
  async doSomething(input: string): Promise<string> {
    logger.debug('ExampleService.doSomething called', { input });

    // Your business logic here
    const result = `Processed: ${input}`;

    return result;
  }
}

export const exampleService = new ExampleService();
