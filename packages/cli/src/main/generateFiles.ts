import fs from 'fs-extra';
import nodePath from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
// import { oraPromise } from 'ora';

const execAsync = promisify(exec);
// Define content and path mappings for each keyword
const paths = {
  'src/interfaces/<Keyword>.Interface.ts': `export interface <Keyword>Interface {
    example: string
        // Define properties and methods related to <keyword>
    }`,
  'src/repositories/<Keyword>.repository.ts': `
    import { Repository, ModelFactory } from '@yumm/core';
    import { <Keyword>Interface } from '@interfaces/<Keyword>.Interface';

    // this variable is a temporary fix as ModelFactory will be called twice when running test 
    // if placed in model property it will return a mongoose error indicating duplicate models in db
    const model = ModelFactory<<Keyword>Interface>('<Keyword>', { example: String})


    export default class <Keyword>Repository extends Repository<<Keyword>Interface> {
      protected model = model
    }
    `,
  'src/controllers/<keyword>.controller.ts': `/* eslint-disable no-underscore-dangle */
    // import { Request } from 'express';
    import <Keyword>Service from '@services/<keyword>.service';
    import { <Keyword>Interface } from '@interfaces/<Keyword>.Interface';
    import { Controller } from "@yumm/core";
    // import { OPTIONS } from '@config';
    // import { <keyword>ResponseDTO } from '@dtos/<keyword>.dto';

    class <Keyword>Controller extends Controller<<Keyword>Interface> {
    service = new <Keyword>Service();
    responseDTO = undefined; // <keyword>ResponseDTO.<keyword>;
    }

    export default <Keyword>Controller;`,
  'src/__test__/__fixtures__/<keyword>.ts': `import { faker } from '@faker-js/faker';

    export const invalid<Keyword>Id = faker.database.mongodbObjectId().toString();
    export const valid<Keyword>Id = faker.database.mongodbObjectId().toString();

    export const valid<Keyword> = {
    example: faker.lorem.word()
    };

    export const invalid<Keyword> = {
    examples: faker.lorem.word()
    };

    export const valid<Keyword>UpdateData = {
        example: faker.lorem.word()
    };`,
  'src/__test__/<keyword>.test.ts': [
    `import supertest from 'supertest';
    import { logger } from '@yumm/utils';
    import <Keyword>Service from '@services/<keyword>.service';
    import { App } from "@yumm/core";
    import { appOptions } from "@config";
    import AuthService from '../services/auth.service';
    import { validUser } from './__fixtures__/user';
    import { valid<Keyword>, invalid<Keyword>, valid<Keyword>UpdateData, invalid<Keyword>Id } from './__fixtures__/<keyword>';
    
    logger.silent = true;
    
    const authService = new AuthService();
    const <keyword>Service = new <Keyword>Service();
    const app = App.instance(appOptions);
    
    let authentication: object;
    const baseUrl = '/api/v1/<keywords>';
    // let userId: string;
    let <keyword>Id: string;
    
    beforeEach(async () => {
      jest.clearAllMocks();
      await authService.createUser({ ...validUser });
      const user = await authService.login({ username: validUser.email, password: validUser.password });
      authentication = { Authorization: \`Bearer \${user.token}\` };
      <keyword>Id = (await <keyword>Service.create({ ...valid<Keyword>} as any))._id;

    });
    
    describe(\`\${'<keyword>'.toUpperCase()} ::\`, () => {
      describe(\`POST \${baseUrl} ==========>>>>\`, () => {
        describe('given a valid <keyword> create a <keyword>, ', () => {
          it('should create <keyword> return 200', async () => {
            const { statusCode, body } = await supertest(app)
              .post(baseUrl)
              .set(authentication)
              .send({ ...valid<Keyword> });
    
            //   deepLog(body)
    
            expect(statusCode).toBe(201);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given an invalid <keyword>', () => {
          it('should return 400', async () => {
            const { statusCode, body } = await supertest(app)
              .post(baseUrl)
              .set(authentication)
              .send({ ...invalid<Keyword> });
    
            // deepLog(body);
    
            expect(statusCode).toBe(400);
            expect(body.success).toEqual(false);
          });
        });
      });
      describe(\`GET \${baseUrl} ==========>>>>\`, () => {
        describe('given a valid token and <keywords> exists', () => {
          it('should return 200 and a non empty array', async () => {
            const { statusCode, body } = await supertest(app).get(baseUrl).set(authentication);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given a valid token', () => {
          it('should return 200, and an empty array', async () => {
            const { statusCode, body } = await supertest(app).get(baseUrl).set(authentication);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
      describe(\`GET \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app).get(\`\${baseUrl}/\${<keyword>Id}\`).set(authentication);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given a valid token and an invalid <keyword>Id', () => {
          it('should return 404', async () => {
            const { statusCode, body } = await supertest(app).get(\`\${baseUrl}/\${invalid<Keyword>Id}\`).set(authentication);
    
            expect(statusCode).toBe(404);
            expect(body.success).toEqual(false);
          });
        });
      });
      describe(\`PUT \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should update and return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app)
              .put(\`\${baseUrl}/\${<keyword>Id}\`)
              .set(authentication)
              .send({ ...valid<Keyword>UpdateData });
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
      describe(\`DELETE \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should delete and return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app).delete(\`\${baseUrl}/\${<keyword>Id}\`).set(authentication);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
    });`,
    `
    import supertest from 'supertest';
    import { logger } from '@yumm/utils';
    import <Keyword>Service from '@services/<keyword>.service';
    import { App } from "@yumm/core";
    import { appOptions } from "@config";
    import { valid<Keyword>, invalid<Keyword>, valid<Keyword>UpdateData, invalid<Keyword>Id } from './__fixtures__/<keyword>';
    
    logger.silent = true;
    
    const <keyword>Service = new <Keyword>Service();
    const app =  App.instance(appOptions);
    
    const baseUrl = '/api/v1/<keywords>';
    // let userId: string;
    let <keyword>Id: string;
    
    beforeEach(async () => {
      jest.clearAllMocks();
      <keyword>Id = (await <keyword>Service.create({ ...valid<Keyword>} as any))._id;

    });
    
    describe(\`\${'<keyword>'.toUpperCase()} ::\`, () => {
      describe(\`POST \${baseUrl} ==========>>>>\`, () => {
        describe('given a valid <keyword> create a <keyword>, ', () => {
          it('should create <keyword> return 200', async () => {
            const { statusCode, body } = await supertest(app)
              .post(baseUrl)
              .send({ ...valid<Keyword> });
    
            //   deepLog(body)
    
            expect(statusCode).toBe(201);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given an invalid <keyword>', () => {
          it('should return 400', async () => {
            const { statusCode, body } = await supertest(app)
              .post(baseUrl)
              .send({ ...invalid<Keyword> });
    
            // deepLog(body);
    
            expect(statusCode).toBe(400);
            expect(body.success).toEqual(false);
          });
        });
      });
      describe(\`GET \${baseUrl} ==========>>>>\`, () => {
        describe('given a valid token and <keywords> exists', () => {
          it('should return 200 and a non empty array', async () => {
            const { statusCode, body } = await supertest(app).get(baseUrl);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given a valid token', () => {
          it('should return 200, and an empty array', async () => {
            const { statusCode, body } = await supertest(app).get(baseUrl);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
      describe(\`GET \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app).get(\`\${baseUrl}/\${<keyword>Id}\`);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
    
        describe('given a valid token and an invalid <keyword>Id', () => {
          it('should return 404', async () => {
            const { statusCode, body } = await supertest(app).get(\`\${baseUrl}/\${invalid<Keyword>Id}\`);
    
            expect(statusCode).toBe(404);
            expect(body.success).toEqual(false);
          });
        });
      });
      describe(\`PUT \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should update and return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app)
              .put(\`\${baseUrl}/\${<keyword>Id}\`)
              .send({ ...valid<Keyword>UpdateData });
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
      describe(\`DELETE \${baseUrl}/:<keyword>Id ==========>>>>\`, () => {
        describe('given a valid token a valid <keyword>Id', () => {
          it('should delete and return 200 and a ', async () => {
            const { statusCode, body } = await supertest(app).delete(\`\${baseUrl}/\${<keyword>Id}\`);
    
            expect(statusCode).toBe(200);
            expect(body.success).toEqual(true);
          });
        });
      });
    });`,
  ],
  'src/dtos/<keyword>.dto.ts': `import { body, param } from 'express-validator';

    export const <keyword>RequestDTO = {
      id: [param('<keyword>Id').exists()],
      create: [
        body('example').exists(),
      ],
      update: [
        body('example').exists(),
      ],
    };
    `,
  'src/services/<keyword>.service.ts': `import { <Keyword>Interface } from '@interfaces/<Keyword>.Interface';
    import <Keyword>Repository from '@repositories/<Keyword>.repository';
    import { Service } from "@yumm/core";
    
    class <Keyword>Service extends Service<<Keyword>Interface, <Keyword>Repository> {
      protected repository = new <Keyword>Repository();
    }
    
    export default <Keyword>Service;`,
  'src/routes/<keyword>.route.ts': `/* eslint-disable import/no-unresolved */
    import <Keyword>Controller from '@controllers/<keyword>.controller';
    import { <keyword>RequestDTO } from '@dtos/<keyword>.dto';
    import { Route } from "@yumm/core";
    import { <Keyword>Interface } from '@interfaces/<Keyword>.Interface';
    
    class <Keyword>Route extends Route<<Keyword>Interface> {
      path = '<keywords>'
      controller = new <Keyword>Controller('<keyword>');
      dto = <keyword>RequestDTO;
      initRoutes() {
        this.router.route('/').get(this.controller.get).post(this.validator(this.dto.create), this.controller.create);
        this.router
          .route('/:<keyword>Id')
          .get(this.validator(this.dto.id), this.controller.getOne)
          .put(this.validator(this.dto.update.concat(this.dto.id)), this.controller.update)
          .delete(this.validator(this.dto.id), this.controller.delete);
    
        return this.router;
      }
    }
    export default <Keyword>Route;`,
};

async function updateConfig(keyword: any, Keyword: any, remove = false) {
  const file = 'src/config.ts';
  const input = `${Keyword}Route`;
  // const input = `${keyword}s: new ${Keyword}Route(true),`;
  const importLine = `import ${Keyword}Route from '@routes/${keyword}.route';`;
  try {
    const data = await fs.readFile(file, 'utf8');
    let updatedContent: string | NodeJS.ArrayBufferView = data;
    if (remove) {
      updatedContent = data.replace(`${importLine}\n`, '').replace(`${input}`, '');
    } else {
      if (!data.includes(input)) {
        updatedContent = data
          .replace(`routes: [`, `routes: [ ${input},`)
          .replace(`import 'dotenv/config';`, `import 'dotenv/config'; ${importLine}`);
      }
    }
    await fs.writeFile(file, updatedContent, 'utf8');
    return 'Index updated successfully.';
  } catch (error) {
    throw 'Error Updating Index:';
  }
}

async function createFile(filepath: string, content: string | NodeJS.ArrayBufferView) {
  try {
    const exists = await fs.exists(filepath);
    if (!exists) {
      await fs.writeFile(filepath, content);
      return `Created: ${filepath}`;
    }
    return `${filepath} already exists`;
  } catch (error) {
    throw `Error writing file: ${filepath}`;
  }
}

async function removeFile(filePath: fs.PathLike) {
  try {
    await fs.unlink(filePath);
    return `Removed ${filePath}`;
  } catch (error: any) {
    throw `Error removing ${filePath}:`;
  }
}

// function getAllFilesInDir(ignore: string[] = []) {
//   if (!Array.isArray(ignore)) {
//     console.error(`Error:`, 'ignore must be an array');
//   }
//   const dirPath = 'src/api/v1/models';
//   try {
//     // Read the directory
//     const files = fs.readdirSync(dirPath);

//     // Filter out directories, leaving only files
//     const fileNames = files
//       .filter((file) => fs.statSync(nodePath.join(dirPath, file)).isFile())
//       .map((file) => file.split('.')[0])
//       .filter((file) => !ignore.includes(file));

//     return fileNames;
//   } catch (error) {
//     console.error('Error reading directory:', error);
//     return [];
//   }
// }

export const newCrud = async (keyword: string, option: any) => {
  const ora = await import('ora');

  const spinner = ora.default(`creating crud: ${keyword}`).start();
  try {
    const packagePath = nodePath.join(process.cwd(), 'yummConfig.json');
    const exists = await fs.exists(packagePath);
    if (!exists) {
      spinner.info('yumm project not found');
      spinner.info('to create a yumm project run: npx @yumm/cli create-app name-of-project');
      spinner.fail('Invalid Yumm project');
      return;
    }
    keyword = keyword.toLowerCase();
    // if (keyword === 'auth' || keyword === 'authentication') throw new Error('auth is a reserved keyword');

    const keywords = pluralize(keyword);
    const Keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    // const Keywords = pluralize(Keyword); No usage for now

    let _paths = '';
    var info;
    for await (const [path, content] of Object.entries(paths)) {
      const _path = path.replace('<keyword>', keyword).replace('<Keyword>', Keyword);
      if (Array.isArray(content)) {
        const idx = option.useAuth ? 0 : 1;

        info = await createFile(
          _path,
          content[idx]
            .replaceAll('<keyword>', keyword)
            .replaceAll('<Keyword>', Keyword)
            .replaceAll('<keywords>', keywords),
        );
        spinner.info(info);
        spinner.info(info);
      } else {
        info = await createFile(
          _path,
          content.replaceAll('<keyword>', keyword).replaceAll('<Keyword>', Keyword).replaceAll('<keywords>', keywords),
        );
        spinner.info(info);
      }
      _paths = `${_paths} ${_path}`;
    }
    info = await updateConfig(keyword, Keyword);
    spinner.info(info);

    // eslint-disable-next-line no-unused-vars
    const cmd = await execAsync(`npm run prettier -- ${_paths} src/config.ts`);

    spinner.info(` ${keyword} Files Formatted`);
    spinner.succeed('done');
  } catch (err: any) {
    err.stderr ? (err = err.stderr) : err;
    spinner.info(err);
    spinner.fail('Error creating Crud');
  }
};

export const removeCrud = async (keyword: string) => {
  const ora = await import('ora');

  const spinner = ora.default(`creating crud: ${keyword}`).start();
  try {
    keyword = keyword.toLowerCase();
    const Keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    for (const path of Object.keys(paths)) {
      const info = await removeFile(path.replace('<keyword>', keyword).replace('<Keyword>', Keyword));
      spinner.info(info);
    }
    updateConfig(keyword, Keyword, true);
    await execAsync(`npm run prettier -- src/config.ts`);

    spinner.info('Formatting Files');

    spinner.succeed(`Crud Removed`);
  } catch (err: any) {
    err.stderr ? (err = err.stderr) : err;
    spinner.info(err);
    spinner.fail('Error Removing Crud');
  }
};

// export const fixLint = () => {
//   const ignoreFiles = ['IdPlugin, AuthSession'];

//   for (const file of getAllFilesInDir(ignoreFiles)) {
//     // eslint-disable-next-line no-unused-vars
//     exec(`npm run crud new -- ${file}`, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error Fixing File: ${error}`);
//         return;
//       }
//       console.log(`Files Fixed: ${stdout}`);
//     });
//   }
// };
function pluralize(word: string): string {
  // Define irregular plurals
  const irregulars: Record<string, string> = {
    child: 'children',
    person: 'people',
    man: 'men',
    woman: 'women',
    foot: 'feet',
    tooth: 'teeth',
    goose: 'geese',
    mouse: 'mice',
    ox: 'oxen',
    deer: 'deer',
    sheep: 'sheep',
    // Add more irregular plurals as needed
  };

  // Check if the word is an irregular plural
  if (irregulars[word.toLowerCase()]) {
    return irregulars[word.toLowerCase()];
  }

  // Check for common English plural rules
  if (word.endsWith('s') || word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es'; // Add 'es' for words ending in 's', 'ch', 'sh', 'x', or 'z'
  } else if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies'; // Change 'y' to 'ies' if preceded by a consonant
  } else {
    return word + 's'; // Add 's' for regular plurals
  }
}

export const createAuth = async () => {};

// type ORA = typeof import("ora", { with: { "resolution-mode": "import" } })

// const runCommand = async (command: string, ora: any) => {
//   // const ora = await import('ora');

//   const spinner = ora.default({ text: `creating crud:`, discardStdin: false }).start();

//   try {
//     const { stdout, stderr } = exec(command);

//     const stdoutStream = readline.createInterface({
//       input: stdout!,
//       output: process.stdout,
//     });

//     stdoutStream.on('line', (line) => {
//       // spinner.info(`STDOUT: ${line}`);
//       // spinner.clear();

//       // spinner.text = `STDOUT: ${line}`;
//       console.log(`STDOUT: ${line}`);
//     });

//     const stderrStream = readline.createInterface({
//       input: stderr!,
//       output: process.stderr,
//     });
//     // spinner.prefixText = 'TEST-PREFIX: ';
//     stderrStream.on('line', (line) => {
//       // spinner.info(`STDERR: ${line}`);
//       spinner.clear();
//       spinner.text = `STDERR: ${line}`;
//     });

//     await new Promise((resolve) => {
//       stdoutStream.on('close', resolve);
//       stderrStream.on('close', resolve);
//     });

//     spinner.fail('ended');
//     console.log(`Command executed successfully.`);
//   } catch (error) {
//     console.error(`Error executing command: ${error}`);
//   }
// };
