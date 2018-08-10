import { writeStream } from '../utils/fs';
import fetch from '../utils/fetch';

export default async function download(url, to, log) {
  log.debug(`Create stream to ${to}`);
  const out = await writeStream(to, log);
  log.debug('Made stream');
  log.debug(`Fetching ${url}`);
  const res = await fetch(url, log.fetch);
  log.debug('Fetched');
  const result = await new Promise((rs, rj) => res
    .body
    .on('end', rs)
    .on('error', rj)
    .pipe(out));
  log.complete('Download complete');
  return result;
}
