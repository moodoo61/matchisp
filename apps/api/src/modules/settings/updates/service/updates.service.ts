import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn, execFile } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';

const execFileAsync = promisify(execFile);

export type UpdateCommitInfo = {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
};

export type UpdateStatus = {
  repoRoot: string;
  remoteName: string;
  remoteUrl: string;
  branch: string;
  upstream: string | null;
  currentHash: string;
  currentShortHash: string;
  currentVersion: string;
  remoteHash: string | null;
  remoteShortHash: string | null;
  behindBy: number;
  aheadBy: number;
  updateAvailable: boolean;
  dirty: boolean;
  dirtySummary: string[];
  commits: UpdateCommitInfo[];
  checkedAt: string;
  lastFetchOk: boolean;
  message: string;
};

export type ApplyUpdateResult = {
  success: true;
  previousHash: string;
  currentHash: string;
  currentShortHash: string;
  currentVersion: string;
  pulledCommits: number;
  postUpdateScheduled: boolean;
  message: string;
};

const GIT_TIMEOUT_MS = 120_000;
const POST_UPDATE_DELAY_MS = 3000;

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private busy = false;

  constructor(private readonly audit: AuditService) {}

  async getStatus(options?: { fetch?: boolean }): Promise<UpdateStatus> {
    const repoRoot = await this.resolveRepoRoot();
    await this.assertGitRepo(repoRoot);

    let lastFetchOk = true;
    if (options?.fetch) {
      try {
        await this.git(repoRoot, ['fetch', '--prune', 'origin']);
      } catch (err) {
        lastFetchOk = false;
        this.logger.warn(
          `فشل git fetch: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return this.buildStatus(repoRoot, lastFetchOk, Boolean(options?.fetch));
  }

  async check(actorId: string): Promise<UpdateStatus> {
    const status = await this.getStatus({ fetch: true });
    await this.audit.log({
      actorId,
      action: 'check',
      resource: 'settings.updates',
      resourceId: status.currentShortHash,
      metadata: {
        behindBy: status.behindBy,
        updateAvailable: status.updateAvailable,
        lastFetchOk: status.lastFetchOk,
      },
    });
    return status;
  }

  async apply(actorId: string): Promise<ApplyUpdateResult> {
    if (this.busy) {
      throw new ConflictException('عملية تحديث جارية بالفعل');
    }

    this.busy = true;
    try {
      const before = await this.getStatus({ fetch: true });
      if (!before.lastFetchOk) {
        throw new ServiceUnavailableException(
          'تعذر الاتصال بالمستودع. تحقق من الشبكة أو صلاحية الوصول',
        );
      }
      if (!before.upstream) {
        throw new BadRequestException(
          'الفرع الحالي غير مرتبط بمستودع بعيد',
        );
      }
      if (before.dirty) {
        throw new BadRequestException(
          'توجد تعديلات محلية غير محفوظة. احفظها أو تراجع عنها قبل التحديث',
        );
      }
      if (!before.updateAvailable || before.behindBy <= 0) {
        throw new BadRequestException('لا توجد تحديثات جديدة للتنزيل');
      }
      if (before.aheadBy > 0) {
        throw new BadRequestException(
          'الفرع المحلي متقدّم على المستودع. التحديث التلقائي غير متاح',
        );
      }

      const previousHash = before.currentHash;
      await this.git(before.repoRoot, [
        'pull',
        '--ff-only',
        '--no-rebase',
        'origin',
        before.branch,
      ]);

      const after = await this.buildStatus(before.repoRoot, true, false);
      this.schedulePostUpdate(before.repoRoot);

      await this.audit.log({
        actorId,
        action: 'apply',
        resource: 'settings.updates',
        resourceId: after.currentShortHash,
        metadata: {
          previousHash,
          currentHash: after.currentHash,
          pulledCommits: before.behindBy,
        },
      });

      return {
        success: true,
        previousHash,
        currentHash: after.currentHash,
        currentShortHash: after.currentShortHash,
        currentVersion: after.currentVersion,
        pulledCommits: before.behindBy,
        postUpdateScheduled: true,
        message:
          'تم تنزيل التحديث. جارٍ تثبيت الاعتماديات وإعادة تشغيل الخدمات خلال ثوانٍ',
      };
    } finally {
      this.busy = false;
    }
  }

  private schedulePostUpdate(repoRoot: string) {
    const script = join(repoRoot, 'scripts', 'apply-system-update.sh');
    if (!existsSync(script)) {
      this.logger.warn(`سكربت ما بعد التحديث غير موجود: ${script}`);
      return;
    }

    setTimeout(() => {
      this.logger.warn(`تشغيل ما بعد التحديث: ${script}`);
      try {
        const child = spawn('bash', [script], {
          cwd: repoRoot,
          detached: true,
          stdio: 'ignore',
          env: process.env,
        });
        child.on('error', (err) => {
          this.logger.error(`فشل تشغيل سكربت التحديث: ${err.message}`);
        });
        child.unref();
      } catch (err) {
        this.logger.error(
          `فشل إطلاق سكربت التحديث: ${err instanceof Error ? err.message : err}`,
        );
      }
    }, POST_UPDATE_DELAY_MS);
  }

  private async buildStatus(
    repoRoot: string,
    lastFetchOk: boolean,
    didFetch: boolean,
  ): Promise<UpdateStatus> {
    const branch = (await this.git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    const currentHash = (await this.git(repoRoot, ['rev-parse', 'HEAD'])).trim();
    const currentShortHash = currentHash.slice(0, 7);
    const currentVersion = await this.describeVersion(repoRoot);

    let remoteName = 'origin';
    let remoteUrl = '';
    try {
      remoteUrl = this.sanitizeRemoteUrl(
        (await this.git(repoRoot, ['remote', 'get-url', 'origin'])).trim(),
      );
    } catch {
      remoteUrl = '';
      remoteName = '';
    }

    let upstream: string | null = null;
    try {
      upstream = (
        await this.git(repoRoot, [
          'rev-parse',
          '--abbrev-ref',
          '--symbolic-full-name',
          '@{u}',
        ])
      ).trim();
    } catch {
      upstream = remoteName && branch ? `${remoteName}/${branch}` : null;
    }

    let remoteHash: string | null = null;
    let behindBy = 0;
    let aheadBy = 0;
    let commits: UpdateCommitInfo[] = [];

    if (upstream) {
      try {
        remoteHash = (await this.git(repoRoot, ['rev-parse', upstream])).trim();
        const counts = (
          await this.git(repoRoot, [
            'rev-list',
            '--left-right',
            '--count',
            `HEAD...${upstream}`,
          ])
        )
          .trim()
          .split(/\s+/);
        aheadBy = Number(counts[0] || 0);
        behindBy = Number(counts[1] || 0);
        if (behindBy > 0) {
          commits = await this.listCommits(repoRoot, `HEAD..${upstream}`, 30);
        }
      } catch (err) {
        this.logger.warn(
          `تعذر مقارنة الفرع البعيد: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    const dirtySummary = await this.listDirty(repoRoot);
    const updateAvailable = behindBy > 0 && aheadBy === 0;

    let message = 'النظام محدّث لآخر نسخة في المستودع';
    if (!lastFetchOk && didFetch) {
      message = 'تعذر جلب آخر حالة من المستودع — تُعرض الحالة المحلية';
    } else if (dirtySummary.length) {
      message = 'توجد تعديلات محلية — أصلحها قبل تنزيل التحديثات';
    } else if (aheadBy > 0 && behindBy > 0) {
      message = 'الفرع متباعد عن المستودع (محلي متقدّم ومتأخّر معاً)';
    } else if (aheadBy > 0) {
      message = 'الفرع المحلي متقدّم على المستودع';
    } else if (behindBy > 0) {
      message = `يتوفر ${behindBy} تحديث${behindBy === 1 ? '' : 'ات'} جديدة`;
    } else if (!upstream) {
      message = 'لا يوجد فرع بعيد مرتبط';
    }

    return {
      repoRoot,
      remoteName: remoteName || '—',
      remoteUrl: remoteUrl || '—',
      branch,
      upstream,
      currentHash,
      currentShortHash,
      currentVersion,
      remoteHash,
      remoteShortHash: remoteHash ? remoteHash.slice(0, 7) : null,
      behindBy,
      aheadBy,
      updateAvailable,
      dirty: dirtySummary.length > 0,
      dirtySummary,
      commits,
      checkedAt: new Date().toISOString(),
      lastFetchOk,
      message,
    };
  }

  private async listCommits(
    repoRoot: string,
    range: string,
    limit: number,
  ): Promise<UpdateCommitInfo[]> {
    const format = ['%H', '%h', '%s', '%an', '%cI'].join('%x1f');
    const stdout = await this.git(repoRoot, [
      'log',
      `--max-count=${limit}`,
      `--pretty=format:${format}`,
      range,
    ]);
    if (!stdout.trim()) return [];
    return stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [hash, shortHash, subject, author, date] = line.split('\x1f');
        return {
          hash: hash || '',
          shortHash: shortHash || '',
          subject: subject || '',
          author: author || '',
          date: date || '',
        };
      })
      .filter((item) => item.hash);
  }

  private async listDirty(repoRoot: string): Promise<string[]> {
    const stdout = await this.git(repoRoot, [
      'status',
      '--porcelain=v1',
      '-uall',
    ]);
    return stdout
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .slice(0, 40);
  }

  private async describeVersion(repoRoot: string): Promise<string> {
    try {
      return (
        await this.git(repoRoot, [
          'describe',
          '--tags',
          '--always',
          '--dirty',
        ])
      ).trim();
    } catch {
      return (
        await this.git(repoRoot, ['rev-parse', '--short', 'HEAD'])
      ).trim();
    }
  }

  private sanitizeRemoteUrl(url: string): string {
    return url.replace(/\/\/([^/@]+)@/, '//***@');
  }

  private async resolveRepoRoot(): Promise<string> {
    const fromEnv =
      process.env.UPDATE_REPO_ROOT?.trim() ||
      process.env.PROJECT_ROOT?.trim();
    if (fromEnv && existsSync(join(fromEnv, '.git'))) {
      return fromEnv;
    }

    const candidates = [
      process.cwd(),
      join(process.cwd(), '..'),
      join(process.cwd(), '../..'),
      '/opt/match',
    ];
    for (const candidate of candidates) {
      try {
        const root = (
          await this.git(candidate, ['rev-parse', '--show-toplevel'])
        ).trim();
        if (root && existsSync(join(root, '.git'))) return root;
      } catch {
        /* try next */
      }
    }
    throw new InternalServerErrorException(
      'تعذر تحديد مجلد المستودع. اضبط UPDATE_REPO_ROOT',
    );
  }

  private async assertGitRepo(repoRoot: string) {
    if (!existsSync(join(repoRoot, '.git'))) {
      throw new InternalServerErrorException(
        `المجلد ليس مستودع Git: ${repoRoot}`,
      );
    }
  }

  private async git(cwd: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          LANG: 'C.UTF-8',
        },
      });
      return stdout;
    } catch (err) {
      const detail =
        err instanceof Error
          ? (
              err as Error & {
                stderr?: string;
              }
            ).stderr || err.message
          : String(err);
      throw new InternalServerErrorException(
        `فشل أمر git ${args[0] ?? ''}: ${String(detail).trim().slice(0, 400)}`,
      );
    }
  }
}
