const { cp, mkdir, readdir, rm } = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(projectRoot, '_site');
const packageRoot = path.join(projectRoot, 'node_modules', 'heic-to');
const ignoredEntries = new Set([
  '.codex',
  '.git',
  '.github',
  '.gitignore',
  '.prettierignore',
  '.prettierrc.json',
  'AGENTS.md',
  'README.md',
  '_site',
  'eslint.config.js',
  'node_modules',
  'package-lock.json',
  'package.json',
  'scripts',
]);

const buildSite = async () => {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const entries = await readdir(projectRoot, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => !ignoredEntries.has(entry.name))
      .map((entry) =>
        cp(
          path.join(projectRoot, entry.name),
          path.join(outputDirectory, entry.name),
          { recursive: true }
        )
      )
  );

  const vendorDirectory = path.join(outputDirectory, 'heic-to-jpeg', 'vendor');
  await mkdir(vendorDirectory, { recursive: true });
  await Promise.all([
    cp(
      path.join(packageRoot, 'dist', 'iife', 'heic-to.js'),
      path.join(vendorDirectory, 'heic-to.js')
    ),
    cp(
      path.join(packageRoot, 'LICENSE'),
      path.join(vendorDirectory, 'LICENSE')
    ),
  ]);
};

buildSite().catch((error) => {
  console.error('サイトをビルドできませんでした。', error);
  process.exitCode = 1;
});
