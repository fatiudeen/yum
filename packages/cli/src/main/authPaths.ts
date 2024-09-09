const paths = {
  'src/interfaces/Auth.Interface.ts': `
        export interface AuthInterface {
        userId: string;
        expired: boolean;
        isLoggedIn: boolean;
        lastLoggedIn: string;
        token: string;
        }

        export interface OTPInterface {
        userId: string;
        otp?: string;
        expires?: string;
        }`,
  'src/interfaces/User.Interface.ts': `
            export interface UserInterface {
            email: string;
            password: string;
            role: string;
            avatar: string;
            verified: {
                email: Boolean;
            };
            }

        `,
  'src/repositories/Auth.repository.ts': `
        import { Repository, ModelFactory } from '@yumm/core';
        import { AuthInterface, OTPInterface } from '@interfaces/Auth.Interface';
        import { Schema } from 'mongoose';

        // this variable is a temporary fix as ModelFactory will be called twice when running test
        // if placed in model property it will return a mongoose error indicating duplicate models in db
        const authModel = ModelFactory<AuthInterface>('Auth', {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        token: { type: String, required: [true, 'The token is required'] },
        isLoggedIn: { type: Boolean, default: false },
        lastLoggedIn: String,
        expired: { type: Boolean, default: false },
        },);
        const otpModel = ModelFactory<OTPInterface>('OTP', {   
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            otp: String,
            expires: String,
                createdAt: {
                type: Date,
                default: Date.now,
                expires: 300 // TTL index in seconds (5 minutes)
            }
            });

        export class AuthRepository extends Repository<AuthInterface> {
        protected model = authModel;
        }

        export class OTPRepository extends Repository<OTPInterface> {
        protected model = otpModel;
        }

      `,
  'src/repositories/User.repository.ts': `
        import { Repository, ModelFactory } from '@yumm/core';
        import { UserInterface } from '@interfaces/User.Interface';

        // this variable is a temporary fix as ModelFactory will be called twice when running test
        // if placed in model property it will return a mongoose error indicating duplicate models in db
        const model = ModelFactory<UserInterface>('User', {
        email: String,
        password: String,
        role: String,
        avatar: String,
        verified: {
            email: Boolean,
        }
        }
        );

        export default class UserRepository extends Repository<UserInterface> {
        protected model = model;
        }

        `,
  'src/controllers/auth.controller.ts': `/* eslint-disable no-underscore-dangle */
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
