import { Injectable, HttpService } from '@nestjs/common';
import { RunnableInterface } from './runnable.interface';
import { LoggerRunnable } from './logger.runnable';
import { Rule } from '../rules/rule.class';
import { WebhookRunnable } from './webhook.runnable';
import { RuleResult } from '../rules/ruleResult';

@Injectable()
export class Runnable {
  constructor(private readonly httpService: HttpService) {}

  getRunnable(name: string): RunnableInterface {
    let runnable: RunnableInterface;
    switch (name) {
      case 'LoggerRunnable':
        runnable = new LoggerRunnable();
        break;
      case 'WebhookRunnable':
        runnable = new WebhookRunnable(this.httpService);
        break;
    }
    return runnable;
  }

  executeRunnableFunctions(ruleResult: RuleResult, rule: Rule): boolean {
    let runnable: RunnableInterface;
    if (ruleResult.validated) {
      rule.onSuccess.forEach(success => {
        runnable = this.getRunnable(success.callback);
        runnable.run(ruleResult, success.args);
      });
      return true;
    } else {
      rule.onError.forEach(error => {
        runnable = this.getRunnable(error.callback);
        runnable.run(ruleResult, error.args);
      });
      return false;
    }
  }
}
