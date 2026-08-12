const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      // React Native Animated and PanResponder keep imperative native handles in refs.
      'react-hooks/refs': 'off',
    },
  },
];
