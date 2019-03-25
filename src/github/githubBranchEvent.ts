import { GithubRepository } from './github.interface';

/**
 * GithubBranchEvent dto
 */
export interface GithubBranchEvent {
  ref_type: string;
  ref: string;
  repository: GithubRepository;
}
