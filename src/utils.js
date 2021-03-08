export function rndId(entropy = 32) {
  const chars = "EHJKRWXY79"; // Uppercase letters and numbers except those that are possible to confuse when reading (A4 B8 G6 I1L O0Q S5 UV Z2) or listening (BDPT3 CZ FS MN).
  let ret = "";
  while (entropy >= 0) {
    ret += chars[Math.floor(Math.random() * chars.length)];
    entropy -= Math.log2(chars.length);
  }
  return ret;
}
