import path from 'path';
import getMain from '../config/getMainFolder';
import { get as getManifest, set as setManifest } from './manifest';
import { urlToPath } from './path';
import download from './download';
import { download as downJSON, read as readJSON/* , get as getJSON, edit as editJSON */ } from './json';
import { name, version, resolve, satisfies, isTag } from './spec';
import fs from '../utils/fs';
import { dedupe, equal } from '../utils/array';

function getPackage(url, log) {
  log.addTask({ title: `Download ${url}`, name: url });
  return download(url, urlToPath(url), log[url]);
}

async function has(pkg) {
  const mani = await getManifest();
  return mani.includes(pkg);
}

async function getTarball(pkg) {
  if (!(await has(pkg))) throw new Error(`No such package ${pkg}`);
  const pkgPath = path.join(getMain(), name(pkg));
  const pkgMani = await readJSON(pkgPath);
  if (version(pkg) === null) pkg = `${pkg}@latest`;
  let toGet = resolve(
    version(pkg),
    Object.keys(pkgMani.versions).concat(Object.keys(pkgMani['dist-tags']))
  );
  if (toGet === null) throw new Error(`Cannot find version of ${name(pkg)} that satisfies ${version(pkg)}`);
  if (pkgMani['dist-tags'][toGet]) toGet = pkgMani['dist-tags'][toGet];
  const pkgJson = pkgMani.versions[toGet];
  return urlToPath(pkgJson.dist.tarball);
}

async function addNew(pkg, ll) {
  if (await has(pkg)) throw new Error(`Already have package ${pkg}`);
  ll.addTask({ title: 'Get manifest', name: 'mani' });
  const mani = await getManifest();
  ll.mani.debug('mani', mani.join(', '));
  ll.mani.complete('Manifest found');
  ll.addTask({ title: 'Download package manifest', name: 'pkg' });
  const pkgJson = await downJSON(
    `https://registry.npmjs.org/${name(pkg)}`,
    path.join(getMain(), name(pkg)),
    obj => {
      const newObj = Object.assign({}, obj);
      newObj.versions = {};
      if (isTag(version(pkg))) {
        const ver = newObj['dist-tags'][version(pkg)];
        ll.pkg.debug('isTag:', true, 'resolved to:', ver);
        newObj.versions[ver] = obj.versions[ver];
        mani.push(pkg);
      } else {
        ll.pkg.debug('isTag', false, 'getting versions');
        Object.keys(obj.versions)
          .filter(i => version(pkg) === null || satisfies(version(pkg), i))
          .forEach(i => {
            newObj.versions[i] = obj.versions[i];
            mani.push(`${name(pkg)}@${i}`);
          });
      }
      return newObj;
    }, ll.pkg
  );
  ll.pkg.complete('Package manifest downloaded');
  ll.addTask({ title: 'Write manifest', name: 'wmani' });
  await setManifest(mani);
  ll.wmani.complete('Finished writing manifest');
  ll.addTask({ title: 'Download Tarballs', name: 'down' });
  const tarballs = Object.keys(pkgJson.versions).map(i => pkgJson.versions[i].dist.tarball);
  await Promise.all(tarballs.map(tb => getPackage(tb, ll.down)));
  ll.down.complete('Tarballs downloaded');
  return true;
}

// async function updateTag(taggedPkg) {
//   if (!isTag(version(taggedPkg))) throw new Error(`${taggedPkg} has no tag`);
//   const pkgPath = path.join(getMain(), name(taggedPkg));
//   const curVersion = (await readJSON(pkgPath))['dist-tags'][version(taggedPkg)];
//   const newVersion = (
//     await getJSON(`https://registry.npmjs.org/${name(taggedPkg)}`)
//   )['dist-tags'][version(taggedPkg)];
//   if (newVersion === curVersion) return false;
//   const newJSON = await editJSON(pkgPath, obj => ({
//     'dist-tags': {
//       [version(taggedPkg)]: newVersion,
//       ...obj['dist-tags']
//     },
//     ...obj
//   }));
//   if (Object.keys(newJSON.versions).includes(newVersion)) return true;
//   return addNew(`${name(taggedPkg)}@${newVersion}`);
// }

async function remove(pkg, ll) {
  const noName = !pkg;
  const all = noName ? null : version(pkg) === null;
  ll.addTask({ title: 'Read Data', name: 'data' });
  const mani = await getManifest();
  ll.data.completed('read manifest');
  const pkgPath = noName ? null : path.join(getMain(), name(pkg));
  ll.data.debug('pkgPath', pkgPath);
  const pkgJson = noName ? null : await readJSON(pkgPath);
  ll.data.completed('got packagejson');
  ll.data.complete('Read Data');
  ll.addTask({ title: 'Find Removes', name: 'rem' });
  const toRemove = mani.filter(item => {
    if (noName) return true;
    if (name(pkg) !== name(item)) return false;
    ll.rem.debug('name is the same');
    if (all) return true;
    ll.rem.debug('not all');
    ll.rem.debug(pkgJson['dist-tags'], version(item));
    if (
      isTag(version(pkg)) &&
      (
        (pkgJson['dist-tags'][version(pkg)] === version(item)) ||
        (version(pkg) === version(item))
      )
    ) {
      return true;
    }
    ll.rem.debug('not tag');
    return satisfies(version(pkg), version(item));
  });
  ll.rem.complete('Found packages to remove');
  ll.addTask({ title: 'Set Manifest', name: 'set' });
  await setManifest(noName ? [] : mani.filter(item => !toRemove.includes(item)));
  ll.set.complete('Set new manifest');
  ll.addTask({ title: 'Remove Packages', name: 'rpkgs' });
  if (noName) {
    const rem = await fs.readdir(path.join(getMain(), 'packages'));
    rem.forEach(v => ll.rpkgs.addTask({ title: `Remove ${v}`, name: v }));
    await Promise.all(rem
      .map(p => fs.unlink(path.join(getMain(), 'packages', p)))
      .map((prom, i) => prom
        .then(() => ll.rpkgs[rem[i]].complete('Removed'))));
    ll.rpkgs.complete('All packages removed');
    return true;
  }
  const rem = toRemove.filter(item => !isTag(item));
  rem.forEach(v => ll.rpkgs.addTask({ title: `Remove ${v}`, name: v }));
  await Promise.all(rem
    .map(item => urlToPath(pkgJson
      .versions[version(item)]
      .dist
      .tarball))
    .map(p => [fs.unlink(p), p])
    .map(([prom, p], i) => prom
      .then(() => ll.rpkgs[rem[i]].complete(`Removed ${p}`))));
  ll.rpkgs.complete('Packages removed');
  return true;
}

// async function update(pkg) {
//   const mani = await getManifest();
//   if (version(pkg) === null) pkg = `${name(pkg)}@latest`;
//   const curEntry = mani.filter(item => name(item) === name(pkg));
//   if (curEntry.some(item => isTag(version(item)))) {
//     return updateTag(curEntry
//       .filter(item => version(item) === version(pkg))[0]);
//   }
//   return false;
// }

async function list(pkg) {
  const mani = await getManifest();
  if (pkg) {
    if (version(pkg) === null) {
      return mani.filter(item => name(pkg) === name(item));
    }
    return mani.filter(item => item === pkg);
  }
  return mani;
}

async function verify(fix, ll) {
  ll.addTask({ title: 'Get Manifest', name: 'mani' });
  ll.addTask({ title: 'Get cache list', name: 'cache' });
  const mani = (await getManifest()).filter(item => !isTag(version(item)));
  ll.mani.complete('Manifest read');
  const cached = (await fs.readdir(path.join(getMain(), 'packages')))
    .map(path => path.replace(/-(\d+\.)/, '@$1').replace('.tgz', ''));
  ll.cache.complete('Cache read');
  ll.addTask({ title: 'Verify Cache', name: 'verify' });
  ll.verify.debug('manifest', mani.join(', '));
  ll.verify.debug('cache', cached.join(', '));
  const eq = equal(mani, cached);
  ll.verify.debug('equal?', eq);
  try {
    if (eq === 0) return true;
    if (fix) {
      ll.addTask({ title: 'Fix', name: 'fix' });
      if (eq === 1) {
        await setManifest(dedupe(mani.concat(cached)));
        ll.fix.complete('Set manifest');
        return true;
      }
      if (eq === 2) {
        await setManifest(mani.filter(item => cached.includes(item)));
        await Promise.all(dedupe(mani
          .filter(item => !cached.includes(item)))
          .map(item => addNew(item, ll.fix)));
        ll.fix.complete('Added to cache');
        return true;
      }
      return false;
    }
    if (eq === 2) return 'Manifest has items not in cache';
    if (eq === 1) return 'Cache has items not in manifest';
    return false;
  } finally {
    ll.verify.complete('Verification complete');
  }
}

async function clean(ll) {
  ll.addTask({ title: 'Clear manifest', name: 'mani' });
  await setManifest([]);
  ll.mani.complete('Manifest is now empty');
  ll.addTask({ title: 'Get packages', name: 'pkgs' });
  const packageDir = path.join(getMain(), 'packages');
  const packages = await fs.readdir(packageDir);
  ll.pkgs.complete('Got all packages');
  ll.addTask({ title: 'Delete packages', name: 'del' });
  packages.forEach(pkg => ll.del.addTask({ title: path.basename(pkg), name: pkg }));
  await Promise.all(packages
    .map(pkg => fs.unlink(path.resolve(packageDir, pkg)))
    .map((prom, i) => prom
      .then(() => ll.del[packages[i]].complete('Deleted'))));
  ll.del.complete('All packages deleted');
  return true;
}

export {
  // update,
  remove,
  getTarball,
  has,
  addNew,
  list,
  verify,
  clean
};
