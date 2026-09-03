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
  winter_snowflake: require('../../../../assets/stickers/winter/snowflake.png'),
  winter_scarf: require('../../../../assets/stickers/winter/scarf.png'),
  winter_snow_globe: require('../../../../assets/stickers/winter/snow-globe.png'),
  spring_blossom: require('../../../../assets/stickers/spring/blossom.png'),
  spring_tulip: require('../../../../assets/stickers/spring/tulip.png'),
  spring_daisy: require('../../../../assets/stickers/spring/daisy.png'),
  fall_leaf: require('../../../../assets/stickers/fall/leaf.png'),
  fall_pumpkin: require('../../../../assets/stickers/fall/pumpkin.png'),
  fall_acorn: require('../../../../assets/stickers/fall/acorn.png'),
  scribble_heart: require('../../../../assets/stickers/scribble/heart.png'),
  scribble_starburst: require('../../../../assets/stickers/scribble/starburst.png'),
  scribble_thought: require('../../../../assets/stickers/scribble/thought.png'),
  scribble_swoosh: require('../../../../assets/stickers/scribble/swoosh.png'),
  scribble_flower: require('../../../../assets/stickers/scribble/flower.png'),
  scribble_tape_note: require('../../../../assets/stickers/scribble/tape-note.png'),
} as const;

export type StickerImageKey = keyof typeof STICKER_IMAGES;
