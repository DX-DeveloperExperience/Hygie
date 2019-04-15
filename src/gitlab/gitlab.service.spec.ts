import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/common';
import { MockHttpService, MockObservable } from '../__mocks__/mocks';
import { GitApiInfos } from '../git/gitApiInfos';
import { GitCommitStatusInfos } from '../git/gitCommitStatusInfos';
import { CommitStatusEnum } from '../webhook/utils.enum';
import { GitIssueInfos, IssuePRStateEnum } from '../git/gitIssueInfos';
import {
  GitPRInfos,
  GitCommentPRInfos,
  GitMergePRInfos,
  PRMethodsEnum,
} from '../git/gitPRInfos';
import { Observable } from 'rxjs';
import { GitlabService } from './gitlab.service';
import { GitFileInfos } from '../git/gitFileInfos';

require('dotenv').config({ path: 'config.env' });

describe('Gitlab Service', () => {
  let app: TestingModule;
  let gitlabService: GitlabService;
  let httpService: HttpService;
  let observable: Observable<any>;

  let gitApiInfos: GitApiInfos;
  let gitCommitStatusInfos: GitCommitStatusInfos;

  let expectedConfig: any = {};

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        { provide: HttpService, useClass: MockHttpService },
        { provide: Observable, useClass: MockObservable },
        GitlabService,
      ],
    }).compile();

    gitlabService = app.get(GitlabService);
    httpService = app.get(HttpService);
    observable = app.get(Observable);

    gitApiInfos = new GitApiInfos();
    gitApiInfos.projectId = '1';

    gitlabService.setToken('0123456789abcdef');
    gitlabService.setUrlApi('https://gitlab.com/api/v4');

    expectedConfig = {
      headers: {
        'PRIVATE-TOKEN': gitlabService.token,
      },
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCommitStatus', () => {
    it('should emit a POST request with specific params', () => {
      gitCommitStatusInfos = new GitCommitStatusInfos();
      gitCommitStatusInfos.commitSha = '1';
      gitCommitStatusInfos.commitStatus = CommitStatusEnum.Success;
      gitCommitStatusInfos.descriptionMessage = 'Well done';
      gitCommitStatusInfos.targetUrl = 'https://www.zenika.com';

      gitlabService.updateCommitStatus(gitApiInfos, gitCommitStatusInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/statuses/1`;

      expectedConfig.params = {
        state: 'success',
        target_url: 'https://www.zenika.com',
        description: 'Well done',
      };

      expect(httpService.post).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('addIssueComment', () => {
    it('should emit a POST request with specific params', () => {
      const gitIssueInfos = new GitIssueInfos();
      gitIssueInfos.number = '1';
      gitIssueInfos.comment = 'my comment';

      gitlabService.addIssueComment(gitApiInfos, gitIssueInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/issues/1/notes`;

      expectedConfig.params = {
        body: 'my comment',
      };

      expect(httpService.post).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('updateIssue', () => {
    it('should emit a PUT request with specific params', () => {
      const gitIssueInfos = new GitIssueInfos();
      gitIssueInfos.number = '1';
      gitIssueInfos.state = IssuePRStateEnum.Close;

      gitlabService.updateIssue(gitApiInfos, gitIssueInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/issues/1`;

      expectedConfig.params = {
        state_event: 'close',
      };

      expect(httpService.put).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });

    it('should emit a PUT request with specific params', () => {
      const gitIssueInfos = new GitIssueInfos();
      gitIssueInfos.number = '1';
      gitIssueInfos.state = IssuePRStateEnum.Open;

      gitlabService.updateIssue(gitApiInfos, gitIssueInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/issues/1`;

      expectedConfig.params = {
        state_event: 'reopen',
      };

      expect(httpService.put).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('addPRComment', () => {
    it('should emit a POST request with specific params', () => {
      const gitCommentPRInfos = new GitCommentPRInfos();
      gitCommentPRInfos.number = '1';
      gitCommentPRInfos.comment = 'my comment';

      gitlabService.addPRComment(gitApiInfos, gitCommentPRInfos);

      const expectedUrl = `${
        gitlabService.urlApi
      }/projects/1/merge_requests/1/notes`;

      expectedConfig.params = {
        body: 'my comment',
      };

      expect(httpService.post).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('createPullRequest', () => {
    it('should emit a POST request with specific params', () => {
      const gitCreatePRInfos = new GitPRInfos();
      gitCreatePRInfos.title = 'my PR';
      gitCreatePRInfos.description = 'my desc';
      gitCreatePRInfos.source = 'develop';
      gitCreatePRInfos.target = 'master';

      gitlabService.createPullRequest(gitApiInfos, gitCreatePRInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/merge_requests`;

      expectedConfig.params = {
        title: 'my PR',
        description: 'my desc',
        source_branch: 'develop',
        target_branch: 'master',
      };

      expect(httpService.post).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('createIssue', () => {
    it('should emit a POST request with specific params', () => {
      const gitIssueInfos = new GitIssueInfos();
      gitIssueInfos.title = 'my new issue';
      gitIssueInfos.description = 'my desc';
      gitIssueInfos.labels = ['good first issue', 'rules'];

      gitlabService.createIssue(gitApiInfos, gitIssueInfos);

      const expectedUrl = `${gitlabService.urlApi}/projects/1/issues`;

      expectedConfig.params = {
        title: 'my new issue',
        description: 'my desc',
        labels: 'good first issue,rules',
      };

      expect(httpService.post).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('deleteBranch', () => {
    it('should emit a DELETE request with specific params', () => {
      gitlabService.deleteBranch(gitApiInfos, 'feature/test');

      const expectedUrl = `${
        gitlabService.urlApi
      }/projects/1/repository/branches/feature%2Ftest`;

      expect(httpService.delete).toBeCalledWith(expectedUrl, {
        headers: expectedConfig.headers,
      });
    });
  });

  describe('deleteFile', () => {
    it('should emit a DELETE request with specific params', () => {
      const gitFileInfos = new GitFileInfos();
      gitFileInfos.fileBranch = 'master';
      gitFileInfos.filePath = 'file/to/delete.txt';
      gitFileInfos.commitMessage = 'delete file';
      gitlabService.deleteFile(gitApiInfos, gitFileInfos);

      const expectedUrl = `${
        gitlabService.urlApi
      }/projects/1/repository/files/file%2Fto%2Fdelete.txt`;

      expectedConfig.params = {
        branch: 'master',
        commit_message: 'delete file',
      };

      expect(httpService.delete).toBeCalledWith(expectedUrl, expectedConfig);
    });
  });

  describe('mergePullRequest', () => {
    it('should emit a PUT request with specific params', () => {
      const gitMergePRInfos = new GitMergePRInfos();
      gitMergePRInfos.number = 42;
      gitMergePRInfos.commitTitle = 'commit title';
      gitMergePRInfos.commitMessage = 'commit message';
      gitMergePRInfos.method = PRMethodsEnum.Squash;

      gitlabService.mergePullRequest(gitApiInfos, gitMergePRInfos);

      const expectedUrl = `${
        gitlabService.urlApi
      }/projects/1/merge_requests/42/merge`;

      expectedConfig.params = {
        squash: true,
        merge_commit_message: 'commit message',
        squash_commit_message: 'commit message',
      };

      expect(httpService.put).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  describe('updatePullRequest', () => {
    it('should emit a PUT request with specific params', () => {
      const gitPRInfos = new GitPRInfos();
      gitPRInfos.number = 42;
      gitPRInfos.title = 'pr title';
      gitPRInfos.description = 'pr description';
      gitPRInfos.target = 'master';
      gitPRInfos.state = IssuePRStateEnum.Close;

      gitlabService.updatePullRequest(gitApiInfos, gitPRInfos);

      const expectedUrl = `${
        gitlabService.urlApi
      }/projects/1/merge_requests/42`;

      expectedConfig.params = {
        title: 'pr title',
        description: 'pr description',
        state_event: 'close',
        target_branch: 'master',
      };

      expect(httpService.put).toBeCalledWith(expectedUrl, {}, expectedConfig);
    });
  });

  // TESTS BEFORE

  describe('setToken', () => {
    it('should set the token', () => {
      gitlabService.setToken('azertyuiop');
      expect(gitlabService.token).toBe('azertyuiop');
    });
  });

  describe('setUrlApi', () => {
    it('should set the url of the API', () => {
      gitlabService.setUrlApi('https://githubapi.com');
      expect(gitlabService.urlApi).toBe('https://githubapi.com');
    });
  });

  describe('setEnvironmentVariables', () => {
    it('should set the token and urlApi', () => {
      const fs = require('fs');
      jest.mock('fs');

      fs.readFileSync.mockReturnValue(
        `gitApi=https://mygitapi.com
      gitToken=qsdfghjklm`,
      );

      gitlabService.setEnvironmentVariables('myFilePath');

      expect(gitlabService.token).toBe('qsdfghjklm');
      expect(gitlabService.urlApi).toBe('https://mygitapi.com');
    });
  });
});
