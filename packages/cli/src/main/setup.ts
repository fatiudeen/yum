#!/usr/bin/env node

import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';
const requireJSON5 = require('require-json5');

const FOLDERS = ['src/routers', 'src/controllers', 'src/services', 'src/repositories', 'src/dtos', 'src/__tests__'];
const packagesToInstall = ['yumm'];
const depsPackagesToInstall = [
  'ts-node',
  'tsc-alias',
  'tsconfig-paths',
  'typescript',
  'eslint',
  'eslint-config-airbnb-base',
  'eslint-config-prettier',
  'eslint-import-resolver-typescript',
  'eslint-plugin-prettier',
  'nodemon',
];

const index = `
import {App} from 'yumm'
import {PORT,DB_URI } from '@config'

const app = new App();

app.listen(<number>(<unknown>PORT), DB_URI);`;

const config = `
import { config } from 'dotenv';

config();


export const {
  PORT,
  DB_URI,
  JWT_KEY,
  JWT_TIMEOUT,
  REFRESH_JWT_KEY,
  REFRESH_JWT_TIMEOUT,
  GOOGLE_API_CLIENT_ID,
  GOOGLE_API_CLIENT_SECRET,
  GOOGLE_API_REDIRECT,
  API_HOST,
  FRONTEND_GOOGLE_LOGIN_URI,
  MAIL_SENDER_NAME,
  MAIL_SENDER_EMAIL,
  MAIL_TOKEN,
  SEEDER_EMAIL,
  SEEDER_PASSWORD,
  DOCS_URL,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  PAYSTACK_SECRET,
  MULTER_STORAGE_PATH,
  NODE_ENV,
  REDIS_URI,
  ODDS_JAM_API_KEY,
} = <Record<string, string>>process.env;
`;

export async function createProject(projectName: string) {
  console.log('setting up your project...');

  await fs.ensureDir(projectName);
  process.chdir(projectName);

  for await (const folder of FOLDERS) {
    await fs.ensureDir(folder);
  }
  await fs.writeFile('src/index.ts', index);
  await fs.writeFile('src/config.ts', config);

  execSync('npm init -y');
  execSync('npx tsc --init');
  updateTsConfig();
  createNodemonJson();
  createYummConfigJson();
  createYummConfigJson();
  createEslintJson();

  execSync(`npm install ${packagesToInstall.join(' ')}`);
  execSync(`npm install -D ${depsPackagesToInstall.join(' ')}`);
  console.log('...done');
}

async function updateTsConfig() {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsConfig = requireJSON5(tsConfigPath);

  const paths = {
    '@routes/*': ['src/routes/*'],
    '@services/*': ['src/services/*'],
    '@controllers/*': ['src/controllers/*'],
    '@middlewares/*': ['src/middlewares/*'],
    '@dtos/*': ['src/dtos/*'],
    '@interfaces/*': ['src/interfaces/*'],
    '@events/*': ['src/events/*'],
    '@repositories/*': ['src/repositories/*'],
    '@config': ['src/config.ts'],
  };
  const tscAlias = {
    verbose: false,
    resolveFullPaths: true,
  };
  const tsNode = {
    transpileOnly: true,
    cache: true,
    preload: true,
    require: ['tsconfig-paths/register'],
  };

  tsConfig.compilerOptions.target = 'es6';
  tsConfig.compilerOptions.module = 'commonjs';
  tsConfig.compilerOptions.rootDir = './src';
  tsConfig.compilerOptions.baseUrl = './';
  tsConfig.compilerOptions.outDir = './dist';
  tsConfig.compilerOptions.strict = true;
  tsConfig.compilerOptions.paths = paths;
  tsConfig.compilerOptions['ts-node'] = tsNode;
  tsConfig.compilerOptions['tsc-alias'] = tscAlias;

  await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
}

async function createNodemonJson() {
  const conf = {
    watch: ['src', '.env'],
    ext: 'js,ts,json',
    ignore: ['src/**/*.{spec,test}.ts'],
    exec: 'ts-node --files ./src/index.ts  ',
  };
  const packagePath = path.join(process.cwd(), 'nodemon.json');
  await fs.writeFile(packagePath, JSON.stringify(conf, null, 2));
}
async function createEslintJson() {
  const conf = {
    env: {
      browser: true,
      es2021: true,
      jest: true,
    },
    extends: ['airbnb-base', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
      'lines-between-class-members': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      'implicit-arrow-linebreak': 'off',
      'max-classes-per-file': 'off',
      'function-paren-newline': 'off',
      'operator-linebreak': 'off',
      'arrow-body-style': 'off',
      'no-unused-expressions': 'off',
      'prefer-destructuring': 'off',
      'no-param-reassign': 'off',
      'keyword-spacing': 'off',
      'class-methods-use-this': 'off',
      'no-undef': 'off',
      'no-underscore-dangle': 'off',
      ' no-restricted-syntax': 'off',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': 'off',
      'prettier/prettier': ['error'],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.ts', '.tsx'],
          moduleDirectory: ['src', 'node_modules'],
        },
      },
    },
  };
  const packagePath = path.join(process.cwd(), '.eslintrc.json');
  await fs.writeFile(packagePath, JSON.stringify(conf, null, 2));
}

async function createYummConfigJson() {
  const conf = {
    USE_ADMIN_SEED: true,
    USE_SMTP: true,
    USE_S3: true,
    USE_SOCKETS: true,
    USE_AUTH_SESSIONS: true,
    USE_REFRESH_TOKEN: true,
    USE_MULTER: true,
    USE_DIGITALOCEAN_SPACE: true,
    USE_MULTER_DISK_STORAGE: false,
    USE_OAUTH_GOOGLE: false,
    USE_OAUTH_FACEBOOK: false,
    USE_OAUTH_APPLE: false,
    USE_PAYSTACK: false,
    USE_ANALYTICS: false,
    USE_REDIS: false,
    USE_DATABASE: 'mongodb',
  };
  const packagePath = path.join(process.cwd(), 'yummConfig.json');
  await fs.writeFile(packagePath, JSON.stringify(conf, null, 2));
}

async function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const payload = requireJSON5(packagePath);

  const script = {
    test: 'cross-env NODE_ENV=test TS_NODE_FILES=true AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 jest --detectOpenHandles --debug --coverage --updateSnapshot --forceExit',
    dev: 'cross-env NODE_ENV=development TS_NODE_FILES=true AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 nodemon src/index.ts',
    build: 'tsc -p . && tsc-alias',
    start: 'node index.js',
    'check-types': 'tsc --noEmit',
    lint: 'eslint --fix "**/*.ts" --quiet',
    prepare: 'husky',
    prettier: 'prettier --write',
    crud: 'node generateFiles.js --',
  };

  payload.scripts = script;

  await fs.writeFile(payload, JSON.stringify(payload, null, 2));
}
