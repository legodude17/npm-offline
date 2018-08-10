import os from 'os';
import path from 'path';

export default function getMainFolder() {
  const user = os.userInfo();
  const home = user.homedir;
  return path.join(home, '.npmo');
}
