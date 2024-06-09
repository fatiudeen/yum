#!/usr/bin/env node

import { program } from 'commander';
import { createProject } from './main/setup';
import { removeCrud, newCrud } from './main/generateFiles';

const ver = process.env.npm_package_version || '0.0.1';

program.version(ver);

program.command('create-app').arguments('<project-name>').action(createProject);
// program.command('fix').action(fixLint);
program.command('rm-crud').arguments('<keyword>').action(removeCrud);

program.command('create-crud').arguments('<keyword>').option('--use-auth').action(newCrud);

program.parse(process.argv);
