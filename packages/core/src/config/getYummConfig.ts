import fs from 'fs';
import path from 'path';

// Utils shamefully stolen from
// https://github.com/dominictarr/rc/blob/master/lib/utils.js

function find(...args: string[]) {
  const rel = path.join.apply(null, [].slice.call(args));
  return findStartingWith(path.dirname(require.main?.filename || module.filename), rel);
}

function findStartingWith(start: string, rel: string) {
  const file = path.join(start, rel);
  try {
    fs.statSync(file);
    return file;
  } catch (err) {
    // They are equal for root dir
    if (path.dirname(start) !== start) {
      return findStartingWith(path.dirname(start), rel);
    }
  }
}

function parse(content: string) {
  if (/^\s*{/.test(content)) {
    return JSON.parse(content);
  }
  return undefined;
}

function file(...args: any[]) {
  const nonNullArgs = [].slice.call(args).filter((arg: null) => arg != null);

  // path.join breaks if it's a not a string, so just skip this.
  for (let i = 0; i < nonNullArgs.length; i++) {
    if (typeof nonNullArgs[i] !== 'string') {
      return;
    }
  }

  const file = path.join.apply(null, nonNullArgs);
  try {
    return fs.readFileSync(file, 'utf-8');
  } catch (err) {
    return undefined;
  }
}

function json(...args: (string | undefined)[]) {
  const content = file.apply(null, args);
  return content ? parse(content) : null;
}

// Find the rc file path
const rcPath = find('yummConfig.json');
// Or
// const rcPath = find('/.config', '.projectrc');

// Read the contents as json
export const yummConfig = json(rcPath);
export const ROOT_PATH = path.dirname(rcPath!);
