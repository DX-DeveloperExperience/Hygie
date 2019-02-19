import { Rule } from './rule.class';
import { RuleResult } from './ruleResult';

export class OneCommitPerPRRule extends Rule {
  validate(): RuleResult {
    const ruleResult: RuleResult = new RuleResult();
    ruleResult.validated =
      this.webhook.getAllCommits().length === 1 ? true : false;
    return ruleResult;
  }
}
