import semver from 'semver';

function name(pkg) {
  return pkg.split('@')[0];
}

function isTag(version) {
  return semver.valid(version) === null && encodeURIComponent(version) === version;
}

function version(pkg) {
  const ver = pkg.split('@')[1];
  if (isTag(ver)) return ver;
  return semver.valid(ver);
}

function resolve(version, versions) {
  if (isTag(version)) return versions.includes(version) ? version : null;
  console.log(versions);
  return semver.maxSatisfying(versions.filter(item => !isTag(item)), version);
}

function satisfies(range, version) {
  return semver.satisfies(version, range);
}

export {
  name,
  version,
  isTag,
  resolve,
  satisfies
};
