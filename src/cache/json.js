import { r as readFile, w as write } from '../utils/fs';
import fetch from '../utils/fetch';

async function download(url, to, map, log) {
  log.debug('downloading', url, 'to', to);
  log.debug(`Begin fetch of ${url}`);
  const res = await fetch(url);
  log.debug(`Fetched ${url}`);
  const json = await res.json();
  log.debug('json attained');
  log.debug(`Fetched ${url}`);
  log.debug('map start');
  const newJson = map(json);
  log.debug('map done');
  log.debug(`Writing to ${to}`);
  await write(to, JSON.stringify(newJson));
  log.debug(`Wrote to ${to}`);
  return newJson;
}

async function read(p) {
  return JSON.parse(await readFile(p));
}

async function get(url) {
  return (await fetch(url)).json();
}

async function edit(p, map) {
  const data = await read(p);
  const newData = map(data);
  await write(JSON.stringify(newData));
  return newData;
}

export {
  download,
  read,
  get,
  edit
};
