import { Rule } from './rule.class';
import { RuleResult } from './ruleResult';
import { Webhook } from '../webhook/webhook';
import { GitEventEnum } from '../webhook/utils.enum';

interface IssueTitleOptions {
  regexp: string;
}

export class IssueTitleRule extends Rule {
  name = 'issueTitle';
  options: IssueTitleOptions;

  constructor(webhook: Webhook) {
    super(webhook);
    this.events = new Array();
    this.events.push(GitEventEnum.NewIssue);
  }

  validate(): RuleResult {
    const ruleResult: RuleResult = new RuleResult(
      this.webhook.getGitApiInfos(),
    );
    const titleIssue = this.webhook.getIssueTitle();
    const issueRegExp = RegExp(this.options.regexp);
    ruleResult.validated = issueRegExp.test(titleIssue);

    ruleResult.data = {
      issueTitle: titleIssue,
      issueNumber: this.webhook.getIssueNumber(),
    };
    return ruleResult;
  }
}
