/**
 * Static require() calls for bundled PNG sticker assets.
 *
 * Metro bundler requires these paths to remain static.
 */
export const STICKER_IMAGES = {
  cat_sleepy: require('../../../../assets/stickers/cat/sleepy.png'),
  cat_curious: require('../../../../assets/stickers/cat/curious.png'),
  cat_cozy: require('../../../../assets/stickers/cat/cozy.png'),
  school_notebook: require('../../../../assets/stickers/school/notebook.png'),
  school_pencil: require('../../../../assets/stickers/school/pencil.png'),
  school_backpack: require('../../../../assets/stickers/school/backpack.png'),
  summer_sun: require('../../../../assets/stickers/summer/sun.png'),
  summer_wave: require('../../../../assets/stickers/summer/wave.png'),
  summer_ice_cream: require('../../../../assets/stickers/summer/ice-cream.png'),
} as const;

export type StickerImageKey = keyof typeof STICKER_IMAGES;
