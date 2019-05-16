import { Injectable, HttpService } from '@nestjs/common';
import { NestSchedule, Cron } from '@dxdeveloperexperience/nest-schedule';
import { logger } from '../logger/logger.service';
import { Utils } from '../utils/utils';
import { CronStandardClass } from './cron.interface';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { Webhook } from '../webhook/webhook';
import { RulesService } from '../rules/rules.service';
import { safeLoad } from 'js-yaml';
import { RemoteConfigUtils } from '../remote-config/utils';
import { checkCronExpression } from './utils';
import { GitTypeEnum } from '../webhook/utils.enum';
import { DataAccessService } from '../data_access/dataAccess.service';

@Injectable()
export class Schedule extends NestSchedule {
  readonly id: string;
  readonly remoteEnvs: string;
  readonly remoteRepository: string;
  readonly webhook: Webhook;

  readonly cron: CronStandardClass;

  constructor(
    private readonly githubService: GithubService,
    private readonly gitlabService: GitlabService,
    private readonly rulesService: RulesService,
    private readonly httpService: HttpService,
    private readonly dataAccess: DataAccessService,
    cron: CronStandardClass,
    remoteRepository: string,
  ) {
    super();
    this.id = Utils.generateUniqueId();
    this.cron = cron;
    logger.info(`Schedule ${this.id} (${cron.filename}) created.`);

    this.remoteEnvs = Utils.getRepositoryFullName(this.cron.projectURL);
    this.remoteRepository = remoteRepository;

    // Init Webhook
    this.webhook = new Webhook(this.gitlabService, this.githubService);
    this.webhook.setCronWebhook(cron);
  }

  /**
   * Set the Gitlab projectId if undefined
   */
  async setGitlabProjectId(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (
        this.webhook.gitType === GitTypeEnum.Gitlab &&
        typeof this.webhook.projectId === 'undefined'
      ) {
        const urlApi: string = this.gitlabService.urlApi;
        let url = `${urlApi}/projects/${Utils.getRepositoryFullName(
          this.cron.projectURL,
        )}`;
        url = url.replace(/\/([^\/]*)$/, '%2F' + '$1');
        logger.error(url);
        const gitlabProjectId = await this.httpService
          .get(url)
          .toPromise()
          .then(response => {
            return response.data.id;
          });
        this.webhook.projectId = gitlabProjectId;
        logger.error('projectId: ' + gitlabProjectId);
      }
      resolve();
    });
  }

  @Cron('0 0 6-20/1 * * *', {
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    tz: 'Europe/Paris',
  })
  async cronJob() {
    try {
      this.githubService.setEnvironmentVariables(this.remoteEnvs);
      this.gitlabService.setEnvironmentVariables(this.remoteEnvs);
    } catch (e) {
      logger.error(e);
      logger.error('There is no config.env file for the current git project');
    }

    await this.setGitlabProjectId();

    logger.info(`${this.id}: downloading ${this.cron.filename}...`);

    try {
      await RemoteConfigUtils.downloadRulesFile(
        this.dataAccess,
        this.httpService,
        this.cron.projectURL,
        this.cron.filename,
      ).catch(e => {
        throw e;
      });
    } catch (e) {
      logger.error(e);
    }

    logger.info(`${this.cron.filename} downloaded. Processing...`);

    // Update CRON Expression if defined in the rules-cron file
    const fs = require('fs-extra');
    const options = safeLoad(
      fs.readFileSync(
        this.remoteRepository + '/' + this.cron.filename,
        'utf-8',
      ),
    ).options;
    if (typeof options !== 'undefined') {
      const cronExpression = options.cron;
      if (typeof cronExpression !== 'undefined') {
        if (checkCronExpression(cronExpression)) {
          this.updateCron(cronExpression);
        }
      }
    }

    // Testing rules
    await this.rulesService.testRules(
      this.webhook,
      this.remoteRepository,
      this.cron.filename,
    );
  }
}
