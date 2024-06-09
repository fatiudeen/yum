#!/usr/bin/env node

import fs from 'fs-extra';
import { exec } from 'child_process';

import { promisify } from 'util';
import path from 'path';
const requireJSON5 = require('require-json5');

const FOLDERS = [
  'src/routes',
  'src/controllers',
  'src/services',
  'src/interfaces',
  'src/repositories',
  'src/dtos',
  'src/__test__',
  'src/__test__/__fixtures__',
  'src/__test__/__mocks__',
  'src/__test__/__utils__',
];
const packagesToInstall = [
  'yumm',
  'mongoose',
  'winston',
  'nodemailer',
  'multer',
  '@aws-sdk/client-s3',
  'multer-s3',
  'aws-sdk',
  'axios',
];
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
  '@typescript-eslint/eslint-plugin',
  'nodemon',
  'cross-env',
  'supertest',
  'ts-jest',
  'jest',
  '@types/supertest',
  '@types/jest',
  '@faker-js/faker',
  'mongodb-memory-server',
];

const env = `
PORT=5000
DB_URI='mongodb://localhost:27017'
JWT_TIMEOUT=24h
JWT_KEY='secret'
`;

const index = `
import {App, optionsValidation} from '@yumm/core'
import { PORT, DB_URI, appOptions } from '@config';

optionsValidation()


const app = new App(appOptions);

app.listen(<number>(<unknown>PORT), DB_URI);`;

const prettier = `
{
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "all",
  "singleQuote": true,
  "semi": true,
  "printWidth": 120
}
`;

const config = `
import 'dotenv/config';

export const appOptions = {
  routes: [],
  middlewares: []
}

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

const jest = `
// /** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const pathsToModuleNameMapper = require('ts-jest').pathsToModuleNameMapper;
const requireJSON5 = require('require-json5');

const tsconfig = requireJSON5('./tsconfig.json')
const compilerOptions = tsconfig.compilerOptions;

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: 'tsconfig.test.json',
        cache: true,
        // diagnostics: false,
        transpileOnly: true,
      },
    ],
  },
  verbose: true,
  clearMocks: true,
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  modulePathIgnorePatterns: [
    './src/__test__/__mocks__',
    './src/__test__/__utils__',
    './dist',
    './node_modules',
  ],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  setupFilesAfterEnv: [
    './src/__test__/__mocks__/mockDb.ts',
    './src/__test__/__mocks__/googleapisMock.ts',
    './src/__test__/__mocks__/mailMock.ts',
  ],
  // coverageThreshold: { global: { lines: 70 } },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
};
`;

const mockDb = `
/* eslint-disable no-restricted-syntax */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JWT_KEY } from '@config';

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_KEY;

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 10000);

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for await (const collection of collections) {
    await collection.deleteMany({});
  }
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
});

jest.setTimeout(30000);

`;

const mockMail = `
import { SMTPMailer } from '@yumm/helpers';

const data = {
  status: 201,
  id: '<20220612040030.590cb653cdd3359f@sandboxe356c98d9eb1425087f300dd7df32c68.mailgun.org>',
  message: 'Queued. Thank you.',
} as any;

var opts: any
// export default jest.spyOn(new SMTPMailer(opts)!, 'send').mockResolvedValue(data);
export default jest.spyOn({ nothing: ()=> {return undefined}}, 'nothing')

`;

const mockGoogleApis = `
// const googleapisMock: any = jest.createMockFromModule('googleapis');

export default jest.mock('googleapis', () => {
  const googleApisMock = {
    google: {
      // Mock implementation can include any desired behavior
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          generateAuthUrl: jest.fn(() => 'mocked-auth-url'),
          getToken: jest.fn(() => ({ tokens: { access_token: 'mocked-access-token' } })),
        })),
      },

      oauth2: {
        userinfo: {
          v2: {
            me: {
              get: jest.fn().mockResolvedValue({
                data: {
                  email: 'mocked-email@example.com',
                  id: 'mocked-user-id',
                  given_name: 'John',
                  family_name: 'Doe',
                  picture: 'mocked-avatar-url',
                },
              }),
            },
          },
        },
      },
    },
  };
  return googleApisMock;
});

`;

const testTsConfig = `
{
  "extends": "./tsconfig.json",
}
`;

export async function createProject(projectName: string) {
  const ora = await import('ora');
  const execAsync = promisify(exec);

  const spinner = ora.default('setting up your project').start();

  try {
    await fs.ensureDir(projectName);
    process.chdir(projectName);

    for await (const folder of FOLDERS) {
      await fs.ensureDir(folder);
    }
    await fs.writeFile('src/index.ts', index);
    await fs.writeFile('src/config.ts', config);
    await fs.writeFile('.env.dev', env);
    await fs.writeFile('.env.test', env);
    await fs.writeFile('.prettierrc', prettier);
    await fs.writeFile('jest.config.js', jest);
    await fs.writeFile('tsconfig.test.json', testTsConfig);
    await fs.writeFile('src/__test__/__mocks__/mockDb.ts', mockDb);
    await fs.writeFile('src/__test__/__mocks__/mailMock.ts', mockMail);
    // await fs.writeFile('src/__test__/__mocks__/googleapisMock.ts', mockGoogleApis);

    await execAsync('npm init -y');
    await execAsync('npx tsc --init');
    await updateTsConfig();
    spinner.text = 'configured ts-config';
    await createNodemonJson();
    spinner.text = 'configured nodemon';
    await createYummConfigJson();
    spinner.text = 'setup yummConfig';
    await createEslintJson();
    spinner.text = 'setup ESlint';
    await updatePackageJson();
    spinner.text = 'installing dependencies';

    await execAsync(`npm install --silent ${packagesToInstall.join(' ')}`);
    await execAsync(`npm install -D --silent ${depsPackagesToInstall.join(' ')}`);
    spinner.succeed('done');
  } catch (err) {
    console.log(err);
    spinner.fail('error while creating project');
  }
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
  tsConfig['ts-node'] = tsNode;
  tsConfig['tsc-alias'] = tscAlias;

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
    USE_ADMIN_SEED: false,
    USE_SMTP: false,
    USE_S3: false,
    USE_SOCKETS: false,
    USE_AUTH_SESSIONS: false,
    USE_REFRESH_TOKEN: false,
    USE_MULTER: false,
    USE_DIGITALOCEAN_SPACE: false,
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
    'test:debug':
      'cross-env NODE_ENV=test TS_NODE_FILES=true AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 jest --detectOpenHandles --coverage --updateSnapshot --forceExit',
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

  await fs.writeFile(packagePath, JSON.stringify(payload, null, 2));
}
