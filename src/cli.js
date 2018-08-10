import ll from 'listr-log';
import yargs from 'yargs';
import * as npmo from '.';
import handle from './utils/handle';


function handler(func) {
  return (argv) => {
    if (!argv.silent) ll.start();
    handle(func(argv));
  };
}

const args = yargs // eslint-disable-line no-unused-vars
  .boolean('silent')
  .describe('silent', 'do not output')
  .command(
    'start [port]', 'start the server', () => {},
    handler(argv => npmo.start(argv.port))
  )
  .command('stop', 'stop the server', () => {}, handler(npmo.stop))
  .command(
    'add <package>', 'add package to the cache', () => {},
    handler(argv => npmo.add(argv.package))
  )
  // .command(
  //   'update [package]', 'update package in cache, default is all', () => {},
  //   handler(argv => npmo.update(argv.package))
  // )
  .command(
    'remove [package]', 'remove package from cache, default is all', () => {},
    handler(argv => npmo.remove(argv.package))
  )
  .command(
    'enable', 'set npm registry to this one', () => {},
    handler(npmo.enable)
  )
  .command(
    'disable', 'set npm registry back to default', () => {},
    handler(npmo.disable)
  )
  .command(
    'cache [verify] [clean] [list]', 'cache-based commands',
    yargs => yargs
      .command(
        'verify', 'verify the cache', yargs => yargs
          .boolean('fix')
          .describe('fix', 'fix cache automatically'),
        handler(argv => npmo.cache.verify(argv.fix))
      )
      .command(
        'clean', 'clean the cache', () => {},
        handler(npmo.cache.clean)
      )
      .command(
        'list', 'list all packages in cache', () => {},
        handler(npmo.cache.list)
      ),
    argv => (
      npmo.cache[argv._[0]] ?
        npmo.cache[argv._[0]](argv) :
        process.stdout.write('Please enter one of: verify, clean, list.\n'))
  )

  .help('help')
  .help('h')
  .recommendCommands()
  .demandCommand(1, 1, 'Expected command', 'Too many commands')
  .argv;
