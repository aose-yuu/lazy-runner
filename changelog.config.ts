import type { ChangelogConfig } from 'changelogen';

export default {
  repo: 'github:aose-yuu/lazy-runner',
  output: 'CHANGELOG.md',
  hideAuthorEmail: true,
  types: {
    feat: { title: 'Features', semver: 'minor' },
    fix: { title: 'Fixes', semver: 'patch' },
    perf: { title: 'Performance', semver: 'patch' },
    refactor: { title: 'Refactors', semver: 'patch' },
    chore: { title: 'Chores' },
    docs: { title: 'Documentation', semver: 'patch' },
    build: { title: 'Build', semver: 'patch' },
    ci: { title: 'CI', semver: 'patch' },
    test: { title: 'Tests', semver: 'patch' }
  },
  scopeMap: {
    cli: 'CLI',
    worker: 'Worker',
    pid: 'PID Store'
  }
} satisfies Partial<ChangelogConfig>;
