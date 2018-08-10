import ll from 'listr-log';
import { remove as r, addNew/* , update as u */ } from './cache';
import cache from './ccache';

function add(pkg) {
  return addNew(pkg, ll);
}

function start() {
  return false;
}

function remove(pkg) {
  return r(pkg, ll);
}

function enable() {
  return false;
}

function stop() {
  return false;
}

// function update(pkg) {
//   return u(pkg, ll);
// }

function disable() {
  return false;
}

export {
  add,
  start,
  stop,
  enable,
  disable,
  // update,
  remove,
  cache
};
