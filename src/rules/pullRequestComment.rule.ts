import { Rule } from './rule.class';
import { RuleResult } from './ruleResult';
import { GitEventEnum } from '../webhook/utils.enum';
import { Webhook } from '../webhook/webhook';
import { RuleDecorator, analyticsDecorator } from './rule.decorator';
import { UsersOptions } from './common.interface';
import { Utils } from './utils';
import { Inject } from '@nestjs/common';
import { Visitor } from 'universal-analytics';

interface PullRequestCommentOptions {
  regexp: string;
  users?: UsersOptions;
}

/**
 * `PullRequestCommentRule` checks the new PR or MR's comment according to a regular expression.
 * @return return a `RuleResult` object
 */
@RuleDecorator('pullRequestComment')
export class PullRequestCommentRule extends Rule {
  options: PullRequestCommentOptions;
  events = [GitEventEnum.NewPRComment];

  constructor(
    @Inject('GoogleAnalytics')
    readonly googleAnalytics: Visitor,
  ) {
    super();
  }

  @analyticsDecorator
  async validate(
    webhook: Webhook,
    ruleConfig: PullRequestCommentRule,
  ): Promise<RuleResult> {
    const ruleResult: RuleResult = new RuleResult(webhook);

    // First, check if rule need to be processed
    if (!Utils.checkUser(webhook, ruleConfig.options.users)) {
      return null;
    }

    const commentDescription = webhook.getCommentDescription();
    const commentRegExp = RegExp(ruleConfig.options.regexp);
    ruleResult.validated = commentRegExp.test(commentDescription);

    ruleResult.data.comment.matches = commentDescription.match(commentRegExp);

    return ruleResult;
  }
}
