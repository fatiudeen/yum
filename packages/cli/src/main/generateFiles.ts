import fs from 'fs-extra';
import nodePath from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

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
    
    export default class <Keyword>Repository extends Repository<<Keyword>Interface> {
      protected model = ModelFactory('<Keyword>', { example: String})
    }
    `,
  'src/controllers/<keyword>.controller.ts': `/* eslint-disable no-underscore-dangle */
    // import { Request } from 'express';
    import <Keyword>Service from '@services/<keyword>.service';
    import { <Keyword>Interface } from '@interfaces/<Keyword>.Interface';
    import Controller from '@controllers/controller';
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
    example: faker.random.word()
    };

    export const invalid<Keyword> = {
    examples: faker.random.word()
    };

    export const valid<Keyword>UpdateData = {
        example: faker.random.word()
    };`,
  'src/__test__/<keyword>.test.ts': `import supertest from 'supertest';
    import { logger } from '@utils/logger';
    import <Keyword>Service from '@services/<keyword>.service';
    import App from '../app';
    import AuthService from '../services/auth.service';
    import { validUser } from './__fixtures__/user';
    import { valid<Keyword>, invalid<Keyword>, valid<Keyword>UpdateData, invalid<Keyword>Id } from './__fixtures__/<keyword>';
    
    logger.silent = true;
    
    const authService = new AuthService();
    const <keyword>Service = new <Keyword>Service();
    const app = new App().instance();
    
    let authentication: object;
    const baseUrl = '/api/v1/<keyword>s';
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
        describe('given a valid token and <keyword>s exists', () => {
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
    import Service from '@services/service';
    
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

async function updateAppTs(keyword: any, Keyword: any, remove = false) {
  const file = 'src/index.ts';
  const input = `new ${Keyword}Route(true),`;
  // const input = `${keyword}s: new ${Keyword}Route(true),`;
  const importLine = `import ${Keyword}Route from '@routes/${keyword}.route';`;
  try {
    const data = await fs.readFile(file, 'utf8');
    let updatedContent: string | NodeJS.ArrayBufferView;
    if (remove) {
      updatedContent = data.replace(`${input}\n`, '').replace(`${importLine}\n`, '');
    } else {
      updatedContent = data
        .replace(`routes: [`, `routes: [ ${input},`)
        .replace(`import { PORT, DB_URI } from '@config';`, `import { PORT, DB_URI } from '@config'; ${importLine}`);
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
    console.log(`Removed ${filePath}`);
  } catch (error: any) {
    console.error(`Error removing ${filePath}:`, error.message);
  }
}

function getAllFilesInDir(ignore: string[] = []) {
  if (!Array.isArray(ignore)) {
    console.error(`Error:`, 'ignore must be an array');
  }
  const dirPath = 'src/api/v1/models';
  try {
    // Read the directory
    const files = fs.readdirSync(dirPath);

    // Filter out directories, leaving only files
    const fileNames = files
      .filter((file) => fs.statSync(nodePath.join(dirPath, file)).isFile())
      .map((file) => file.split('.')[0])
      .filter((file) => !ignore.includes(file));

    return fileNames;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

export const newCrud = async (keyword: string) => {
  try {
    const packagePath = nodePath.join(process.cwd(), 'yummConfig.json');
    const exists = fs.exists(packagePath);
    if (!exists) {
      console.log('Invalid Yumm Project');
    }
    keyword = keyword.toLowerCase();
    const Keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    let _paths = '';
    for await (const [path, content] of Object.entries(paths)) {
      const _path = path.replace('<keyword>', keyword).replace('<Keyword>', Keyword);
      await createFile(_path, content.replaceAll('<keyword>', keyword).replaceAll('<Keyword>', Keyword));
      _paths = `${_paths} ${_path}`;
    }
    await updateAppTs(keyword, Keyword);

    // eslint-disable-next-line no-unused-vars
    const { stdout, stderr } = await execAsync(`npm run prettier -- ${_paths} src/index.ts`);
    if (stderr) {
      console.error(`Error Formatting Files`);
      return;
    }
    console.log(`Files Formatted`);
  } catch (err: any) {
    console.log(`Error Caught`);

    err.stderr ? (err = err.stderr) : err;

    console.error(err);
  }
};

export const removeCrud = async (keyword: string) => {
  keyword = keyword.toLowerCase();
  const Keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  for (const path of Object.keys(paths)) {
    await removeFile(path.replace('<keyword>', keyword).replace('<Keyword>', Keyword));
  }
  updateAppTs(keyword, Keyword, true);
  // eslint-disable-next-line no-unused-vars
  const { stdout, stderr } = await execAsync(`npm run prettier -- src/app.ts`);
  if (stderr) {
    console.error(`Error Formatting Files`);
    return;
  }
  console.log(`Files Formatted: ${stdout}`);
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
