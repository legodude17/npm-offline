import mfs from 'make-fetch-happen';
import path from 'path';
import getMain from '../config/getMainFolder';

const fetch = mfs.defaults({ cache: path.join(getMain(), 'fetch-cache') });

export default function (url, log) {
  return fetch(url, {
    onRetry: () => {
      log.debug('Retrying...');
    }
  });
}
