import chalk from 'chalk';
import util from 'util';

function format(obj) {
  if (typeof obj === 'string') return obj;
  if (!obj.color) return obj.message;
  return chalk[obj.color](obj.message);
}

export default function output(pre, ...message) {
  process.stdout.write(format(pre));
  process.stdout.write(util.format(...message));
  process.stdout.write('\n');
}

const ERROR = {
  message: 'ERROR: ',
  color: 'red'
};

const SUCCESS = {
  message: 'Success: ',
  color: 'green'
};

const OUTPUT = {
  message: ''
};

export { ERROR, SUCCESS, OUTPUT };
