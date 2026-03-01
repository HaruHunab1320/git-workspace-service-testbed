// epsilon
function getCozyWelcome(name) {
  if (name) {
    return `Welcome in, ${name}! Grab a warm blanket and make yourself at home.`;
  }
  return 'Welcome in! Grab a warm blanket and make yourself at home.';
}

module.exports = { getCozyWelcome };
