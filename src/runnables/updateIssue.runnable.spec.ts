import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitTypeEnum } from '../webhook/utils.enum';
import { CallbackType } from './runnables.service';
import { RuleResult } from '../rules/ruleResult';
import { GitApiInfos } from '../git/gitApiInfos';
import { MockGitlabService, MockGithubService } from '../__mocks__/mocks';
import { UpdateIssueRunnable } from './updateIssue.runnable';

describe('RunnableService', () => {
  let app: TestingModule;

  let githubService: GithubService;
  let gitlabService: GitlabService;

  let updateIssueRunnable: UpdateIssueRunnable;

  let args: any;
  let ruleResultIssueTitle: RuleResult;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        UpdateIssueRunnable,
        { provide: GitlabService, useClass: MockGitlabService },
        { provide: GithubService, useClass: MockGithubService },
      ],
    }).compile();

    githubService = app.get(GithubService);
    gitlabService = app.get(GitlabService);
    updateIssueRunnable = app.get(UpdateIssueRunnable);

    const myGitApiInfos = new GitApiInfos();
    myGitApiInfos.repositoryFullName = 'bastienterrier/test_webhook';
    myGitApiInfos.git = GitTypeEnum.Undefined;

    args = { state: 'close' };

    // ruleResultIssueTitle initialisation
    ruleResultIssueTitle = new RuleResult(myGitApiInfos);
    ruleResultIssueTitle.validated = false;
    ruleResultIssueTitle.data = {
      issueNumber: 22,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateIssue Runnable', () => {
    it('should not call the updateIssue Github nor Gitlab service', () => {
      updateIssueRunnable.run(CallbackType.Both, ruleResultIssueTitle, args);
      expect(githubService.updateIssue).not.toBeCalled();
      expect(gitlabService.updateIssue).not.toBeCalled();
    });
  });
  describe('updateIssue Runnable', () => {
    it('should call the updateIssue Github service', () => {
      ruleResultIssueTitle.gitApiInfos.git = GitTypeEnum.Github;
      updateIssueRunnable.run(CallbackType.Both, ruleResultIssueTitle, args);

      expect(githubService.updateIssue).toBeCalled();
      expect(gitlabService.updateIssue).not.toBeCalled();
    });
  });
  describe('updateIssue Runnable', () => {
    it('should call the updateIssue Gitlab service', () => {
      ruleResultIssueTitle.gitApiInfos.git = GitTypeEnum.Gitlab;
      updateIssueRunnable.run(CallbackType.Both, ruleResultIssueTitle, args);

      expect(githubService.updateIssue).not.toBeCalled();
      expect(gitlabService.updateIssue).toBeCalled();
    });
  });
});
