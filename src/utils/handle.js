import ll from 'listr-log';
import output, { ERROR } from './output';

export default function handle(prom) {
  prom.then(() => {
    ll.end();
    process.exit(0);
  }).catch(err => {
    ll.end(err);
    ll.tasks.filter(task => task.isPending()).forEach(task => task.error(err));
    output(ERROR, err.message);
    process.exit(1);
  });
}
