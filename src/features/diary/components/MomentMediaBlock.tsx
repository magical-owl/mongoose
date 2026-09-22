import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { DiaryPhoto, MomentPhotoLayout } from '@/features/diary/domain/DiaryEntry';

import { MomentPhotoGrid } from './MomentPhotoGrid';

interface MomentMediaBlockProps {
  readonly photos: readonly DiaryPhoto[];
  readonly layout?: MomentPhotoLayout;
  readonly editable?: boolean;
  readonly compact?: boolean;
  readonly previewable?: boolean;
  readonly bleedHorizontal?: number;
  readonly flushBottom?: boolean;
  readonly onChangeLayout?: (layout: MomentPhotoLayout) => void;
  readonly onAddPhoto?: () => void;
  readonly onRemovePhoto?: (photoId: string) => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function MomentMediaBlock({
  photos,
  layout,
  editable = false,
  compact = false,
  previewable = false,
  bleedHorizontal = 0,
  flushBottom = false,
  onChangeLayout,
  onAddPhoto,
  onRemovePhoto,
  style,
  testID = 'moment-media-block',
}: MomentMediaBlockProps): React.JSX.Element | null {
  if (!editable && photos.length === 0) return null;

  return (
    <MomentPhotoGrid
      photos={photos}
      editable={editable}
      layout={layout}
      compact={compact}
      previewable={previewable}
      onChangeLayout={onChangeLayout}
      onAddPhoto={onAddPhoto}
      onRemovePhoto={onRemovePhoto}
      style={[
        bleedHorizontal > 0 ? {
          marginHorizontal: -bleedHorizontal,
          marginTop: -bleedHorizontal,
        } : undefined,
        flushBottom && styles.flushBottom,
        style,
      ]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  flushBottom: {
    marginBottom: 0,
  },
});
