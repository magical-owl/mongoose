module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@app': './app',
            '@features': './src/features',
            '@shared': './src/shared',
            '@services': './src/services',
            '@repositories': './src/repositories',
            '@api': './src/api',
            '@ai': './src/ai',
            '@stores': './src/stores',
            '@hooks': './src/hooks',
            '@providers': './src/providers',
            '@theme': './src/theme',
            '@config': './src/config',
            '@constants': './src/constants',
            '@database': './src/database',
            '@utils': './src/utils',
            '@tests': './tests',
          },
        },
      ],
    ],
  };
};