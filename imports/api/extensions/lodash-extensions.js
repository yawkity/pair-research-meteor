import { _ } from 'lodash';

/**
 * Creates a sorted frequency array that counts the occurrences of elements in an array.
 * @external '_'
 * @param {Array} array The array to be counted.
 * @returns {Array} Returns the sorted frequency array,
 * @example
 * // returns [[1, 3], [2, 1]]
 * _.frequencyPairs([1, 1, 2, 1]);
 */
_.frequencyPairs = (array) => {
  return _.sortBy(_.toPairs(_.countBy(array)), pair => -pair[1]);
};