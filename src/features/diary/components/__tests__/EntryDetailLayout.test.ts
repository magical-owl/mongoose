import {
  ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT,
  getEntryDetailLayoutMetrics,
} from '@/features/diary/components/EntryDetailLayout';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';

function createSticker(overrides: Partial<PlacedSticker> = {}): PlacedSticker {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    stickerId: 'cat-mug',
    category: 'cat',
    x: 120,
    y: 300,
    scale: 2,
    rotation: 0,
    zIndex: 1,
    behindText: false,
    ...overrides,
  };
}

describe('EntryDetailLayout', () => {
  it('uses the full view cover height when editing an entry with a cover photo', () => {
    const metrics = getEntryDetailLayoutMetrics({
      windowWidth: 390,
      windowHeight: 844,
      topInset: 47,
      isEditing: true,
      hasEditCoverPhoto: true,
      hasViewCoverPhoto: false,
      bodyContentHeight: 100,
      displayStickers: [],
      showStickerPicker: false,
      showStickerBounds: false,
      isStickerDragging: false,
    });

    expect(metrics.editCoverExpandedHeight).toBe(ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT);
    expect(metrics.headerOverlayHeight).toBe(ENTRY_DETAIL_VIEW_COVER_EXPANDED_HEIGHT);
    expect(metrics.coverTopOffset).toBe(0);
  });

  it('reserves header and cover space when editing without a cover photo', () => {
    const metrics = getEntryDetailLayoutMetrics({
      windowWidth: 390,
      windowHeight: 844,
      topInset: 47,
      isEditing: true,
      hasEditCoverPhoto: false,
      hasViewCoverPhoto: false,
      bodyContentHeight: 100,
      displayStickers: [],
      showStickerPicker: false,
      showStickerBounds: false,
      isStickerDragging: false,
    });

    expect(metrics.headerOverlayHeight).toBeGreaterThan(metrics.editCoverExpandedHeight);
    expect(metrics.coverTopOffset).toBeGreaterThan(0);
  });

  it('expands the body canvas to include large lower stickers', () => {
    const metrics = getEntryDetailLayoutMetrics({
      windowWidth: 390,
      windowHeight: 844,
      topInset: 47,
      isEditing: true,
      hasEditCoverPhoto: false,
      hasViewCoverPhoto: false,
      bodyContentHeight: 100,
      displayStickers: [createSticker({ y: 900, scale: 2.5 })],
      showStickerPicker: false,
      showStickerBounds: false,
      isStickerDragging: false,
    });

    expect(metrics.bodyCanvasHeight).toBeGreaterThan(900);
  });

  it('only shows body sticker bounds while editing', () => {
    const editingMetrics = getEntryDetailLayoutMetrics({
      windowWidth: 390,
      windowHeight: 844,
      topInset: 47,
      isEditing: true,
      hasEditCoverPhoto: false,
      hasViewCoverPhoto: false,
      bodyContentHeight: 100,
      displayStickers: [],
      showStickerPicker: true,
      showStickerBounds: false,
      isStickerDragging: false,
    });
    const viewMetrics = getEntryDetailLayoutMetrics({
      ...editingMetrics,
      windowWidth: 390,
      windowHeight: 844,
      topInset: 47,
      isEditing: false,
      hasEditCoverPhoto: false,
      hasViewCoverPhoto: true,
      bodyContentHeight: 100,
      displayStickers: [],
      showStickerPicker: true,
      showStickerBounds: false,
      isStickerDragging: false,
    });

    expect(editingMetrics.showBodyStickerBounds).toBe(true);
    expect(viewMetrics.showBodyStickerBounds).toBe(false);
  });
});
