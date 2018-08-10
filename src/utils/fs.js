import fs from 'fs';
import pify from 'pify';
import path from 'path';
import makeDir from 'make-dir';

const pfs = pify(fs);

export default pfs;

export const mkdirp = makeDir;

export async function w(p, contents) {
  try {
    await pfs.writeFile(p, contents);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    await mkdirp(path.dirname(p));
    await pfs.writeFile(p, contents);
    return true;
  }
}

export async function writeStream(p, log) {
  log.debug('creating write stream', p);
  try {
    await pfs.access(p);
  } catch (err) {
    log.failure('error encountered', err.code);
    if (err.code !== 'ENOENT') throw err;
    log.debug('error was not found, creating');
    await w(p, '');
    log.debug('created', p);
  }
  log.debug('found', p);
  return fs.createWriteStream(p);
}

export const r = p => pfs.readFile(p, 'utf8');
