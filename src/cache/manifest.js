import path from 'path';
import { r as read, w as write } from '../utils/fs';
import getMain from '../config/getMainFolder';

let cache;
let time = Date.now();
const CACHE_BUST_TIME = 1000 * 60 * 60; // One hour

async function actuallyGet() {
  const maniPath = path.join(getMain(), 'npmo.manifest');
  // console.log('actually getting mani');
  let mani;
  try {
    mani = (await read(maniPath)).split('\n').filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') {
      mani = [];
      await write(maniPath, '');
    } else { throw err; }
  }
  time = Date.now();
  cache = mani;
  return mani;
}

function get() {
  if (cache) {
    if (time + CACHE_BUST_TIME <= Date.now()) {
      return actuallyGet();
    }
    return cache;
  }
  return actuallyGet();
}

function set(newMani) {
  const maniPath = path.join(getMain(), 'npmo.manifest');
  cache = newMani;
  time = Date.now();
  return write(maniPath, newMani.join('\n'));
}

export { set, get };
