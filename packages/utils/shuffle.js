/**
 *   /\_/\
 *  ( o.o )
 *   > ^ <
 *  /|   |\
 * (_|   |_)
 *
 * alpha
 *
 * Tiny array shuffle utility using the Fisher-Yates algorithm.
 */
export function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}
