import fs from '../utils/fs';
import defaults from './defaults';
import types from './types';
import getMain from './getMainFolder';

export default async function load() {
  const mainConfig = await fs.readFile(`${getMain()}rc`);
  const config = Object.assign({}, defaults, mainConfig);
  Object.keys(config).forEach(i => { config[i] = types[i](config[i]); });
  return config;
}
