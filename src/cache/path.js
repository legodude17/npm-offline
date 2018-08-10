import path from 'path';
import URL from 'url';
import getMain from '../config/getMainFolder';

function tgz(url) {
  const paths = URL.parse(url).pathname.split('/');
  return paths[paths.length - 1];
}

function urlToPath(url) {
  return path.join(getMain(), 'packages', tgz(url));
}

export { urlToPath }; // eslint-disable-line import/prefer-default-export
