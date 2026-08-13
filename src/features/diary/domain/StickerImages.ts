/**
 * Sticker Image Map
 *
 * Static require() calls for all PNG sticker assets.
 * Metro bundler requires these to be static (no dynamic paths).
 *
 * All images are resized to 180×180px for optimal bundle size.
 */

export const STICKER_IMAGES = {
  // ── Cats ────────────────────────────────────────────────────────────────
  catburnese1: require('../../../../assets/stickers/cats/catburnese1.png'),
  catburnese2: require('../../../../assets/stickers/cats/catburnese2.png'),
  catburnese3: require('../../../../assets/stickers/cats/catburnese3.png'),
  catburnese4: require('../../../../assets/stickers/cats/catburnese4.png'),
  catragdoll1: require('../../../../assets/stickers/cats/catragdoll1.png'),
  catragdoll2: require('../../../../assets/stickers/cats/catragdoll2.png'),
  catragdoll5: require('../../../../assets/stickers/cats/catragdoll5.png'),
  catragdoll6: require('../../../../assets/stickers/cats/catragdoll6.png'),
  catbombay1:  require('../../../../assets/stickers/cats/catbombay1.png'),
  catbombay2:  require('../../../../assets/stickers/cats/catbombay2.png'),
  catbombay3:  require('../../../../assets/stickers/cats/catbombay3.png'),
  catbombay5:  require('../../../../assets/stickers/cats/catbombay5.png'),

  // ── Cute ────────────────────────────────────────────────────────────────
  cute_cloud:     require('../../../../assets/stickers/cute/cloud.png'),
  cute_heart1:    require('../../../../assets/stickers/cute/heart1.png'),
  cute_heart2:    require('../../../../assets/stickers/cute/heart2.png'),
  cute_heart3:    require('../../../../assets/stickers/cute/heart3.png'),
  cute_icecream:  require('../../../../assets/stickers/cute/icecream.png'),
  cute_kuma:      require('../../../../assets/stickers/cute/kuma.png'),
  cute_rabbit:    require('../../../../assets/stickers/cute/rabbit.png'),
  cute_rainbow:   require('../../../../assets/stickers/cute/rainbow.png'),
  cute_star1:     require('../../../../assets/stickers/cute/star1.png'),
  cute_star2:     require('../../../../assets/stickers/cute/star2.png'),
  cute_sunflower: require('../../../../assets/stickers/cute/sunflower.png'),

  // ── Food ────────────────────────────────────────────────────────────────
  food_cupcake1:  require('../../../../assets/stickers/food/cupcake1.png'),
  food_cupcake2:  require('../../../../assets/stickers/food/cupcake2.png'),
  food_cupcake3:  require('../../../../assets/stickers/food/cupcake3.png'),
  food_cupcake4:  require('../../../../assets/stickers/food/cupcake4.png'),
  food_glass1:    require('../../../../assets/stickers/food/glass1.png'),
  food_glass2:    require('../../../../assets/stickers/food/glass2.png'),
  food_icecream1: require('../../../../assets/stickers/food/icecream1.png'),
  food_icecream2: require('../../../../assets/stickers/food/icecream2.png'),
  food_icecream3: require('../../../../assets/stickers/food/icecream3.png'),

  // ── Cake ────────────────────────────────────────────────────────────────
  cake1: require('../../../../assets/stickers/cake/1.png'),
  cake2: require('../../../../assets/stickers/cake/2.png'),
  cake3: require('../../../../assets/stickers/cake/3.png'),
  cake4: require('../../../../assets/stickers/cake/4.png'),

  // ── Cute Bear ───────────────────────────────────────────────────────────
  bear1: require('../../../../assets/stickers/packs/cute_bear/1.png'),
  bear2: require('../../../../assets/stickers/packs/cute_bear/2.png'),
  bear3: require('../../../../assets/stickers/packs/cute_bear/3.png'),
  bear4: require('../../../../assets/stickers/packs/cute_bear/4.png'),
  bear5: require('../../../../assets/stickers/packs/cute_bear/5.png'),
  bear6: require('../../../../assets/stickers/packs/cute_bear/6.png'),

  // ── Emotions ────────────────────────────────────────────────────────────
  emotion1: require('../../../../assets/stickers/packs/emotion/1.png'),
  emotion2: require('../../../../assets/stickers/packs/emotion/2.png'),
  emotion3: require('../../../../assets/stickers/packs/emotion/3.png'),
  emotion4: require('../../../../assets/stickers/packs/emotion/4.png'),
  emotion5: require('../../../../assets/stickers/packs/emotion/5.png'),
  emotion6: require('../../../../assets/stickers/packs/emotion/6.png'),
  emotion7: require('../../../../assets/stickers/packs/emotion/7.png'),
  emotion8: require('../../../../assets/stickers/packs/emotion/8.png'),
  emotion9: require('../../../../assets/stickers/packs/emotion/9.png'),

  // ── Gamer ───────────────────────────────────────────────────────────────
  gamer1: require('../../../../assets/stickers/packs/gamer/1.png'),
  gamer2: require('../../../../assets/stickers/packs/gamer/2.png'),
  gamer3: require('../../../../assets/stickers/packs/gamer/3.png'),
  gamer4: require('../../../../assets/stickers/packs/gamer/4.png'),
  gamer5: require('../../../../assets/stickers/packs/gamer/5.png'),
  gamer6: require('../../../../assets/stickers/packs/gamer/6.png'),
  gamer7: require('../../../../assets/stickers/packs/gamer/7.png'),
  gamer8: require('../../../../assets/stickers/packs/gamer/8.png'),
  gamer9: require('../../../../assets/stickers/packs/gamer/9.png'),

  // ── Pets ────────────────────────────────────────────────────────────────
  pet1: require('../../../../assets/stickers/packs/pet/1.png'),
  pet2: require('../../../../assets/stickers/packs/pet/2.png'),
  pet3: require('../../../../assets/stickers/packs/pet/3.png'),
  pet4: require('../../../../assets/stickers/packs/pet/4.png'),
  pet5: require('../../../../assets/stickers/packs/pet/5.png'),
  pet6: require('../../../../assets/stickers/packs/pet/6.png'),

  // ── Cars ────────────────────────────────────────────────────────────────
  car1: require('../../../../assets/stickers/packs/car/1.png'),
  car2: require('../../../../assets/stickers/packs/car/2.png'),
  car3: require('../../../../assets/stickers/packs/car/3.png'),
  car4: require('../../../../assets/stickers/packs/car/4.png'),
  car5: require('../../../../assets/stickers/packs/car/5.png'),
} as const;

export type StickerImageKey = keyof typeof STICKER_IMAGES;
