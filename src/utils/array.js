function dedupe(arr) {
  return arr.reduce((acc, v) => acc.concat(v), []);
}

function group(arr, num) {
  const res = [];
  const temp = [];
  for (const v of arr) {
    temp.push(v);
    if (temp.length === num) {
      res.push(temp.slice());
      temp.length = 0;
    }
  }
  return res;
}

function equal(arr1, arr2) {
  const diff1 = arr1.filter(v => !arr2.includes(v));
  const diff2 = arr2.filter(v => !arr1.includes(v));
  if (diff1.length === 0) {
    if (diff2.length === 0) {
      return 0;
    }
    return 1;
  }
  return 2;
}

export { dedupe, group, equal };
