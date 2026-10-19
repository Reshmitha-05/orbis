import { GitHubRepo } from '../types/github';
import {
  QualityAnalysisResult,
  QualityCheck,
  CategoryScore,
  QualityGrade,
} from '../types/quality';
import { GitHubApi, GitHubApiError } from './githubApi';

interface RepoFilesInspection {
  rootFiles: string[];
  githubFiles: string[];
  readmeText: string | null;
  readmeSize: number;
  hasGithubWorkflows: boolean;
  canInspectContents: boolean;
}

export class QualityEngine {
  /**
   * Deterministically analyze a GitHub repository based on live API inspection.
   */
  static async evaluateRepository(owner: string, repoName: string): Promise<QualityAnalysisResult> {
    // 1. Fetch Repository Metadata
    const repo = await GitHubApi.getRepo(owner, repoName);

    // 2. Inspect root contents & .github contents
    const inspection = await this.inspectRepositoryStructure(owner, repoName);

    // 3. Compute checks with documented deterministic weights
    const checks = this.runDeterministicChecks(repo, inspection);

    // 4. Calculate category scores and overall grade
    return this.aggregateResults(repo, checks);
  }

  /**
   * Safe structure inspection with graceful fallback if contents API is blocked or rate-limited
   */
  private static async inspectRepositoryStructure(owner: string, repoName: string): Promise<RepoFilesInspection> {
    let rootFiles: string[] = [];
    let githubFiles: string[] = [];
    let readmeText: string | null = null;
    let readmeSize = 0;
    let hasGithubWorkflows = false;
    let canInspectContents = true;

    try {
      const rootItems = await GitHubApi.getRepoContents(owner, repoName, '');
      rootFiles = rootItems.map((item) => item.name.toLowerCase());

      // Check if .github exists and inspect workflows
      const hasGithubDir = rootItems.some(
        (item) => item.name.toLowerCase() === '.github' && item.type === 'dir'
      );

      if (hasGithubDir) {
        try {
          const ghItems = await GitHubApi.getRepoContents(owner, repoName, '.github');
          githubFiles = ghItems.map((item) => item.name.toLowerCase());

          const hasWorkflowsDir = ghItems.some(
            (item) => item.name.toLowerCase() === 'workflows' && item.type === 'dir'
          );

          if (hasWorkflowsDir) {
            const workflowItems = await GitHubApi.getRepoContents(owner, repoName, '.github/workflows');
            hasGithubWorkflows = workflowItems.some(
              (wf) => wf.name.endsWith('.yml') || wf.name.endsWith('.yaml')
            );
          }
        } catch {
          // If .github subpath fails, continue gracefully
        }
      }
    } catch (e) {
      // If root contents cannot be read (e.g. rate limit or large repository), note that structure could not be fully inspected
      if (e instanceof GitHubApiError && (e.status === 403 || e.status === 404)) {
        canInspectContents = false;
      }
    }

    // Inspect README
    try {
      const readme = await GitHubApi.getRepoReadme(owner, repoName);
      if (readme) {
        readmeSize = readme.size;
        if (readme.content) {
          try {
            readmeText = atob(readme.content.replace(/\s/g, ''));
          } catch {
            readmeText = null;
          }
        }
      }
    } catch {
      // no readme or rate limited
    }

    return {
      rootFiles,
      githubFiles,
      readmeText,
      readmeSize,
      hasGithubWorkflows,
      canInspectContents,
    };
  }

  /**
   * Deterministic Evaluation Logic
   */
  public static runDeterministicChecks(repo: GitHubRepo, insp: RepoFilesInspection): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const { rootFiles, githubFiles, readmeText, readmeSize, hasGithubWorkflows, canInspectContents } = insp;

    // ==========================================
    // 1. Documentation & Architecture (Max: 18 pts)
    // ==========================================
    const hasReadmeFile = rootFiles.some((f) => f.startsWith('readme')) || readmeSize > 0;
    checks.push({
      id: 'doc-readme-presence',
      category: 'documentation',
      title: 'README Specification',
      weight: 8,
      earnedPoints: hasReadmeFile ? 8 : 0,
      status: hasReadmeFile ? 'passed' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasReadmeFile
        ? `README file identified (${readmeSize > 0 ? `${Math.round(readmeSize / 1024)} KB` : 'detected at root'})`
        : canInspectContents
        ? 'No README file identified in repository root'
        : 'Contents API inaccessible; README presence unconfirmed',
      explanation: 'The README is the primary entry point for prospective users, reviewers, and contributors.',
      recommendation: 'Add a comprehensive README.md detailing project goals, architecture, and usage.',
      remediationLink: `https://github.com/${repo.full_name}/new/${repo.default_branch}?filename=README.md`,
      isVerifiable: canInspectContents || hasReadmeFile,
    });

    const isSubstantiveReadme = readmeSize > 500 || (readmeText && readmeText.length > 400);
    checks.push({
      id: 'doc-readme-depth',
      category: 'documentation',
      title: 'Documentation Depth & Clarity',
      weight: 6,
      earnedPoints: isSubstantiveReadme ? 6 : hasReadmeFile ? 2 : 0,
      status: isSubstantiveReadme ? 'passed' : hasReadmeFile ? 'partial' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: isSubstantiveReadme
        ? `Substantive documentation provided (${readmeSize > 0 ? `${readmeSize} bytes` : '> 400 characters'})`
        : hasReadmeFile
        ? `Minimal README content detected (${readmeSize} bytes)`
        : 'README absent',
      explanation: 'Brief or single-line READMEs leave developers guessing how the project functions or how to run it.',
      recommendation: 'Expand README with background context, architecture diagrams, prerequisites, and API references.',
      remediationLink: `https://github.com/${repo.full_name}`,
      isVerifiable: hasReadmeFile,
    });

    const textToScan = (readmeText || '').toLowerCase();
    const hasSetupInstructions =
      textToScan.includes('install') ||
      textToScan.includes('getting started') ||
      textToScan.includes('quick start') ||
      textToScan.includes('npm run') ||
      textToScan.includes('yarn') ||
      textToScan.includes('pnpm') ||
      textToScan.includes('cargo') ||
      textToScan.includes('docker') ||
      textToScan.includes('pip install') ||
      textToScan.includes('clone');

    checks.push({
      id: 'doc-setup-guide',
      category: 'documentation',
      title: 'Setup & Installation Instructions',
      weight: 4,
      earnedPoints: hasSetupInstructions ? 4 : isSubstantiveReadme ? 1 : 0,
      status: hasSetupInstructions ? 'passed' : isSubstantiveReadme ? 'partial' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasSetupInstructions
        ? 'Explicit installation/setup instructions detected in README text'
        : isSubstantiveReadme
        ? 'README present but lacks explicit "Installation" or "Quickstart" keywords'
        : 'Setup guide absent',
      explanation: 'Actionable setup commands empower developers to reproduce and run the project locally without roadblocks.',
      recommendation: 'Include a clean code snippet demonstrating local installation and execution steps.',
      remediationLink: `https://github.com/${repo.full_name}`,
      isVerifiable: hasReadmeFile,
    });

    // ==========================================
    // 2. Open-Source Licensing (Max: 14 pts)
    // ==========================================
    const hasSpdxLicense = Boolean(repo.license && repo.license.spdx_id && repo.license.spdx_id !== 'NOASSERTION');
    const hasLicenseFile = rootFiles.some((f) => f.includes('license') || f.includes('copying'));

    checks.push({
      id: 'license-verification',
      category: 'licensing',
      title: 'Open-Source License Governance',
      weight: 14,
      earnedPoints: hasSpdxLicense ? 14 : hasLicenseFile ? 7 : 0,
      status: hasSpdxLicense ? 'passed' : hasLicenseFile ? 'partial' : 'failed',
      evidence: hasSpdxLicense
        ? `Recognized SPDX License: ${repo.license?.name} (${repo.license?.spdx_id})`
        : hasLicenseFile
        ? 'License file detected, but lacked standard machine-readable SPDX identifier'
        : 'No open-source license identified. Default copyright prohibits reproduction.',
      explanation: 'Without a clear open-source license, others cannot legally use, modify, or distribute your code.',
      recommendation: 'Adopt an approved OSI license (e.g. MIT, Apache-2.0, or AGPLv3) to clarify community rights.',
      remediationLink: 'https://choosealicense.com',
      isVerifiable: true,
    });

    // ==========================================
    // 3. Continuous Integration & Workflows (Max: 16 pts)
    // ==========================================
    const hasCiInRoot = rootFiles.some(
      (f) =>
        f.includes('travis') ||
        f.includes('circleci') ||
        f.includes('azure-pipelines') ||
        f.includes('.gitlab-ci') ||
        f.includes('jenkins')
    );
    const hasCi = hasGithubWorkflows || hasCiInRoot;

    checks.push({
      id: 'ci-pipeline',
      category: 'ci_cd',
      title: 'Automated CI/CD Pipeline',
      weight: 16,
      earnedPoints: hasCi ? 16 : 0,
      status: hasCi ? 'passed' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasGithubWorkflows
        ? 'Active GitHub Actions workflows detected in .github/workflows/'
        : hasCiInRoot
        ? 'Third-party CI configuration detected in root'
        : canInspectContents
        ? 'No CI workflows found (.github/workflows, Travis, CircleCI, etc.)'
        : 'CI workflow directory could not be inspected',
      explanation: 'Continuous integration guarantees automated validation of pull requests, lints, and builds.',
      recommendation: 'Create a GitHub Actions workflow (.github/workflows/ci.yml) to run test and build pipelines automatically.',
      remediationLink: `https://github.com/${repo.full_name}/new/${repo.default_branch}?filename=.github/workflows/ci.yml`,
      isVerifiable: canInspectContents,
    });

    // ==========================================
    // 4. Automated Testing Infrastructure (Max: 14 pts)
    // ==========================================
    const testDirsOrFiles = [
      'test',
      'tests',
      'spec',
      'specs',
      '__tests__',
      'vitest.config.ts',
      'vitest.config.js',
      'jest.config.js',
      'jest.config.ts',
      'pytest.ini',
      'setup.cfg',
      '.rspec',
      'cargo.toml',
    ];
    const hasTestArtifacts = rootFiles.some((f) => testDirsOrFiles.includes(f) || f.includes('test'));

    checks.push({
      id: 'testing-infrastructure',
      category: 'testing',
      title: 'Automated Test Infrastructure',
      weight: 14,
      earnedPoints: hasTestArtifacts ? 14 : 0,
      status: hasTestArtifacts ? 'passed' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasTestArtifacts
        ? 'Dedicated test directory or test configuration identified in root files'
        : canInspectContents
        ? 'No top-level test directory or test configuration found'
        : 'File tree inaccessible; tests could not be verified',
      explanation: 'Automated tests catch regressions before they reach production and assure contributors of code stability.',
      recommendation: 'Add unit and integration tests (e.g. Vitest, Jest, Pytest, Go tests) to verify critical functions.',
      remediationLink: `https://github.com/${repo.full_name}`,
      isVerifiable: canInspectContents,
    });

    // ==========================================
    // 5. Community & Contribution Standards (Max: 12 pts)
    // ==========================================
    const hasContributing =
      rootFiles.some((f) => f.includes('contributing')) ||
      githubFiles.some((f) => f.includes('contributing'));

    checks.push({
      id: 'community-contributing',
      category: 'community',
      title: 'Contribution Guidelines (CONTRIBUTING.md)',
      weight: 7,
      earnedPoints: hasContributing ? 7 : 0,
      status: hasContributing ? 'passed' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasContributing
        ? 'CONTRIBUTING guidelines found in repository or .github directory'
        : canInspectContents
        ? 'No CONTRIBUTING.md file found'
        : 'Contribution guideline availability could not be verified',
      explanation: 'Clear contribution guides set conventions for issues, PR format, coding style, and git branching.',
      recommendation: 'Provide CONTRIBUTING.md with instructions on setting up a dev environment and submitting PRs.',
      remediationLink: `https://github.com/${repo.full_name}/new/${repo.default_branch}?filename=CONTRIBUTING.md`,
      isVerifiable: canInspectContents,
    });

    const hasCodeOfConduct =
      rootFiles.some((f) => f.includes('code_of_conduct') || f.includes('conduct')) ||
      githubFiles.some((f) => f.includes('code_of_conduct') || f.includes('conduct'));

    checks.push({
      id: 'community-code-of-conduct',
      category: 'community',
      title: 'Code of Conduct (CODE_OF_CONDUCT.md)',
      weight: 5,
      earnedPoints: hasCodeOfConduct ? 5 : 0,
      status: hasCodeOfConduct ? 'passed' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasCodeOfConduct
        ? 'Code of Conduct file detected in repository structure'
        : canInspectContents
        ? 'No CODE_OF_CONDUCT.md file found'
        : 'Code of conduct availability could not be verified',
      explanation: 'A code of conduct establishes standard safety expectations for maintainers and new contributors.',
      recommendation: 'Adopt the Contributor Covenant to foster an inclusive, welcoming community.',
      remediationLink: `https://github.com/${repo.full_name}/new/${repo.default_branch}?filename=CODE_OF_CONDUCT.md`,
      isVerifiable: canInspectContents,
    });

    // ==========================================
    // 6. Dependency & Lockfile Reproducibility (Max: 14 pts)
    // ==========================================
    const lockfiles = [
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'cargo.lock',
      'poetry.lock',
      'go.sum',
      'gemfile.lock',
      'composer.lock',
    ];
    const manifests = [
      'package.json',
      'cargo.toml',
      'pyproject.toml',
      'requirements.txt',
      'go.mod',
      'gemfile',
      'pom.xml',
      'build.gradle',
      'cmakelists.txt',
      'makefile',
    ];

    const hasLockfile = rootFiles.some((f) => lockfiles.includes(f));
    const hasManifest = rootFiles.some((f) => manifests.includes(f));

    checks.push({
      id: 'dependency-reproducibility',
      category: 'dependencies',
      title: 'Dependency Manifest & Deterministic Lockfile',
      weight: 14,
      earnedPoints: hasLockfile ? 14 : hasManifest ? 8 : 0,
      status: hasLockfile ? 'passed' : hasManifest ? 'partial' : canInspectContents ? 'failed' : 'unverifiable',
      evidence: hasLockfile
        ? 'Deterministic lockfile detected (ensures reproducible installs)'
        : hasManifest
        ? 'Dependency manifest detected without lockfile; builds may experience version drift'
        : canInspectContents
        ? 'No dependency manifest or lockfile found in root directory'
        : 'Dependency files could not be inspected',
      explanation: 'Lockfiles pin exact transitive dependencies, preventing breaking updates from silently crashing builds.',
      recommendation: 'Commit your package manager lockfile (package-lock.json, pnpm-lock.yaml, Cargo.lock, etc.) to version control.',
      remediationLink: `https://github.com/${repo.full_name}`,
      isVerifiable: canInspectContents,
    });

    // ==========================================
    // 7. Maintenance & Hygiene Signals (Max: 12 pts)
    // ==========================================
    const lastPushedDate = new Date(repo.pushed_at || repo.updated_at);
    const monthsSincePushed = (Date.now() - lastPushedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.5);
    const isActivelyMaintained = monthsSincePushed <= 6 && !repo.archived;

    checks.push({
      id: 'maint-recency',
      category: 'maintenance',
      title: 'Active Maintenance Cadence',
      weight: 5,
      earnedPoints: repo.archived ? 0 : isActivelyMaintained ? 5 : monthsSincePushed <= 12 ? 2 : 0,
      status: repo.archived ? 'failed' : isActivelyMaintained ? 'passed' : monthsSincePushed <= 12 ? 'partial' : 'failed',
      evidence: repo.archived
        ? 'Repository is explicitly marked as archived (read-only)'
        : `Last code push was ${Math.round(monthsSincePushed)} month(s) ago (${new Date(repo.pushed_at).toLocaleDateString()})`,
      explanation: 'Recent commits demonstrate active triage, responsiveness to security vulnerabilities, and bug fixes.',
      recommendation: repo.archived ? 'Repository is archived.' : 'Keep dependencies fresh and respond to periodic issues.',
      remediationLink: `https://github.com/${repo.full_name}/commits`,
      isVerifiable: true,
    });

    const hasDescription = Boolean(repo.description && repo.description.trim().length > 10);
    const hasTopics = Boolean(repo.topics && repo.topics.length > 0);

    checks.push({
      id: 'maint-discoverability',
      category: 'maintenance',
      title: 'Repository Metadata & Topics',
      weight: 4,
      earnedPoints: hasDescription && hasTopics ? 4 : hasDescription || hasTopics ? 2 : 0,
      status: hasDescription && hasTopics ? 'passed' : hasDescription || hasTopics ? 'partial' : 'failed',
      evidence: hasDescription && hasTopics
        ? `Description configured and ${repo.topics?.length} topic tag(s) defined`
        : hasDescription
        ? 'Description provided, but no topic tags defined'
        : 'Missing concise description or discoverability topic tags',
      explanation: 'Descriptions and topic tags allow developers and search engines to discover and evaluate the project.',
      recommendation: 'Configure a concise description and at least 3 relevant topic tags in repository settings.',
      remediationLink: `https://github.com/${repo.full_name}`,
      isVerifiable: true,
    });

    checks.push({
      id: 'maint-issue-tracking',
      category: 'maintenance',
      title: 'Issue Tracker Governance',
      weight: 3,
      earnedPoints: repo.has_issues ? 3 : 0,
      status: repo.has_issues ? 'passed' : 'failed',
      evidence: repo.has_issues
        ? `Public GitHub Issues enabled (${repo.open_issues_count} open issue(s))`
        : 'Issue tracker is disabled on this repository',
      explanation: 'An open issue tracker allows users to report bugs, request features, and discuss technical debt.',
      recommendation: 'Enable Issues in repository Settings -> Features.',
      remediationLink: `https://github.com/${repo.full_name}/settings`,
      isVerifiable: true,
    });

    return checks;
  }

  /**
   * Aggregate checks into category scores and overall grade
   */
  public static aggregateResults(repo: GitHubRepo, checks: QualityCheck[]): QualityAnalysisResult {
    const categoryConfigs: Array<{
      category: 'documentation' | 'licensing' | 'ci_cd' | 'testing' | 'community' | 'dependencies' | 'maintenance';
      title: string;
      maxWeight: number;
    }> = [
      { category: 'documentation', title: 'Documentation & Architecture', maxWeight: 18 },
      { category: 'licensing', title: 'Open-Source Licensing', maxWeight: 14 },
      { category: 'ci_cd', title: 'Continuous Integration & Workflows', maxWeight: 16 },
      { category: 'testing', title: 'Automated Testing Infrastructure', maxWeight: 14 },
      { category: 'community', title: 'Community & Contribution Hygiene', maxWeight: 12 },
      { category: 'dependencies', title: 'Dependency & Lockfile Integrity', maxWeight: 14 },
      { category: 'maintenance', title: 'Maintenance & Hygiene Signals', maxWeight: 12 },
    ];

    const categories: CategoryScore[] = categoryConfigs.map((cfg) => {
      const catChecks = checks.filter((c) => c.category === cfg.category);
      const earned = catChecks.reduce((sum, c) => sum + c.earnedPoints, 0);
      const passed = catChecks.filter((c) => c.status === 'passed').length;
      return {
        category: cfg.category,
        title: cfg.title,
        maxWeight: cfg.maxWeight,
        earnedScore: earned,
        percentage: Math.round((earned / cfg.maxWeight) * 100),
        checkCount: catChecks.length,
        passedCount: passed,
      };
    });

    const totalEarned = checks.reduce((sum, c) => sum + c.earnedPoints, 0);
    const overallScore = Math.min(100, Math.max(0, Math.round(totalEarned)));

    let grade: QualityGrade = 'D';
    let gradeDescription = '';

    if (overallScore >= 90) {
      grade = 'A+';
      gradeDescription = 'Exemplary open-source standard with comprehensive documentation, automated CI test suites, and transparent governance.';
    } else if (overallScore >= 80) {
      grade = 'A';
      gradeDescription = 'High quality codebase exhibiting solid engineering discipline, testing, and modern release automation.';
    } else if (overallScore >= 70) {
      grade = 'B';
      gradeDescription = 'Good foundation with active development, but has clear opportunities for CI workflows or contribution guidelines.';
    } else if (overallScore >= 55) {
      grade = 'C';
      gradeDescription = 'Moderate hygiene; core code present, but missing important operational infrastructure such as tests or CI.';
    } else {
      grade = 'D';
      gradeDescription = 'Needs attention; lacks foundational documentation, open-source licensing, or automated testing infrastructure.';
    }

    const passedChecks = checks.filter((c) => c.status === 'passed').length;
    const failedChecks = checks.filter((c) => c.status === 'failed').length;
    const unverifiableChecks = checks.filter((c) => c.status === 'unverifiable').length;

    return {
      repoFullName: repo.full_name,
      repoName: repo.name,
      owner: repo.owner.login,
      assessedAt: new Date().toISOString(),
      overallScore,
      grade,
      gradeDescription,
      categories,
      checks,
      summary: {
        passedChecks,
        failedChecks,
        unverifiableChecks,
        totalChecks: checks.length,
      },
      repoMetadata: {
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        language: repo.language,
        defaultBranch: repo.default_branch,
        licenseName: repo.license?.name || null,
        lastPushed: repo.pushed_at || repo.updated_at,
        isArchived: repo.archived,
      },
      isDemoData: false,
    };
  }
}
