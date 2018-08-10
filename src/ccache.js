import ll from 'listr-log';
import { verify, clean, list } from './cache';
import output, { ERROR, SUCCESS, OUTPUT } from './utils/output';

export default {
  verify: fix => verify(fix, ll)
    .then(res => {
      if (ll.renderer && ll.renderer._id) ll.pause(); // HACK: Need to do this until ll.isEnabled is made
      if (res === true) output(SUCCESS, 'Cache verified');
      else output(ERROR, res);
    }),
  clean: () => clean(ll)
    .then(() => {
      if (ll.renderer && ll.renderer._id) ll.pause(); // HACK: Need to do this until ll.isEnabled is made
      output(SUCCESS, 'Cache cleaned');
    }),
  list: () => list()
    .then(pkgs => {
      output(SUCCESS, 'Cached Packages:');
      output(OUTPUT, pkgs.map(str => `\t${str}`).join('\n'));
    })
};
