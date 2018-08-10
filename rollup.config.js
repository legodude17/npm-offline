import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import module from 'module';

const builtin = module.builtinModules;

export default {
  input: ['src/index.js', 'src/server/index.js', 'src/cli.js', 'src/cache/index.js'],
  // input: 'src/index.js',
  output: {
    dir: 'dist/',
    // file: 'dist/bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    babel(),
    commonjs()
  ],
  experimentalCodeSplitting: true,
  external: ['make-fetch-happen', 'listr-log', 'make-dir', 'pify', 'semver', 'yargs', 'chalk'].concat(builtin)
  // treeshake: {
  //   pureExternalModules: true
  // }
};
