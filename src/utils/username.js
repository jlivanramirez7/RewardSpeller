/**
 * @file username.js
 * @description Utility module for generating deterministic, kid-friendly usernames.
 * Combines positive adjectives, animal names, and a 3-digit number based on a string hash of the child ID.
 */

const ADJECTIVES = [
  'Captain', 'Cosmic', 'Dizzy', 'Echo', 'Fluffy', 'Gizmo', 'Happy', 
  'Jumping', 'Lucky', 'Mega', 'Nimble', 'Pippy', 'Rocket', 'Sunny', 
  'Turbo', 'Waffles', 'Zippy', 'Brave', 'Clever', 'Swift', 'Bright', 
  'Super', 'Magic', 'Cosmo', 'Buzzy', 'Dandy', 'Frolic', 'Giddy'
];

const ANIMALS = [
  'Bear', 'Cat', 'Dolphin', 'Fox', 'Gecko', 'Koala', 'Lion', 'Monkey', 
  'Otter', 'Panda', 'Penguin', 'Rabbit', 'Tiger', 'Turtle', 'Wolf', 
  'Zebra', 'Falcon', 'Pony', 'Puppy', 'Bunny', 'Hedgehog', 'Cheetah', 
  'Hippo', 'Giraffe', 'Lemur', 'Meerkat', 'Platypus', 'Sloth'
];

/**
 * Generates a deterministic kid-friendly username from a child ID string.
 * If no childId is provided, generates a random username.
 * 
 * @param {string} [childId] - The unique identifier of the child profile (e.g., 'child_1').
 * @returns {string} A kid-friendly username (e.g., 'Captain_Fox_102').
 */
export const generateKidFriendlyName = (childId = '') => {
  let hash = 0;

  if (childId && typeof childId === 'string') {
    for (let i = 0; i < childId.length; i++) {
      hash = childId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
  } else {
    hash = Math.floor(Math.random() * 1000000);
  }

  const adjIndex = hash % ADJECTIVES.length;
  const animIndex = Math.floor(hash / 8) % ANIMALS.length;
  const num = (hash % 900) + 100; // 100-999

  return `${ADJECTIVES[adjIndex]}_${ANIMALS[animIndex]}_${num}`;
};
