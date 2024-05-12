import { program } from 'commander';
import { createProject } from './main/setup';
import { fixLint, removeCrud, newCrud } from './main/generateFiles';

const ver = process.env.npm_package_version || '0.0.1';

program.version(ver);

program.command('create-app').arguments('<project-name>').action(createProject);
program.command('fix').action(fixLint);
program.command('rm').arguments('<keyword>').action(removeCrud);

program.command('new-crud').arguments('<keyword>').action(newCrud);

program.parse(process.argv);
