import type { DiaryEntry, DiaryPhoto, ManualMood } from '@/features/diary/domain/DiaryEntry';
import type { DiaryBodyFontFamily, DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import type { Template } from '@/features/diary/domain/Template';
import type { Journal } from '@/features/journal/domain/Journal';
import type { Profile } from '@/features/profile/domain/Profile';
import type { TimeFormat } from '@/stores/useAppStore';
import { APP_IDENTITY } from '@/config/appIdentity';
import { premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { DiaryPaperBackgroundPickerModal } from '@/features/diary/components/DiaryPaperBackgroundPickerModal';
import { EntryMetadataModal } from '@/features/diary/components/EntryMetadataModal';
import { EntryReflectionsModal } from '@/features/diary/components/EntryReflectionsModal';
import { RichTextFormattingDrawer, type RichTextFormatItem } from '@/features/diary/components/RichTextFormattingDrawer';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { TemplatePickerModal } from '@/features/diary/components/TemplatePickerModal';

interface EntryDetailModalsProps {
  readonly entry: DiaryEntry;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly timeFormat: TimeFormat;
  readonly journals: readonly Journal[];
  readonly availableTags: readonly string[];
  readonly isEditing: boolean;
  readonly formatItems: readonly RichTextFormatItem[];
  readonly showFormattingTools: boolean;
  readonly showStickerPicker: boolean;
  readonly showTemplatePicker: boolean;
  readonly showPaperBackgroundPicker: boolean;
  readonly showPremiumModal: boolean;
  readonly showReflections: boolean;
  readonly showEntryMetadata: boolean;
  readonly editBodyFontFamily: DiaryBodyFontFamily;
  readonly editBodyTextColor: DiaryBodyTextColor | undefined;
  readonly selectedPaperBackgroundId: string;
  readonly editMoods: readonly ManualMood[];
  readonly selectedJournalIds: readonly string[];
  readonly selectedTags: readonly string[];
  readonly onDismissFormattingTools: () => void;
  readonly onSelectFormat: (kind: RichTextFormatItem['kind']) => void;
  readonly onSelectFontFamily: (fontFamily: DiaryBodyFontFamily) => void;
  readonly onSelectTextColor: (textColor: DiaryBodyTextColor | undefined) => void;
  readonly onCloseStickerPicker: () => void;
  readonly onSelectSticker: (stickerId: string, category: string) => void;
  readonly onRequestPremium: () => void;
  readonly onCloseTemplatePicker: () => void;
  readonly onSelectTemplate: (template: Template) => void;
  readonly onSelectPaperBackground: (paperBackgroundId: string) => void;
  readonly onDismissPaperBackgroundPicker: () => void;
  readonly onClosePremiumModal: () => void;
  readonly onDismissReflections: () => void;
  readonly onAddReflection: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
  readonly onDeleteReflection: (entryId: string, reflectionId: string) => void;
  readonly onToggleReflectionMemoryReaction: (entryId: string, reflectionId: string, reaction: MemoryReaction) => Promise<boolean>;
  readonly onDismissEntryMetadata: () => void;
  readonly onChangeMoods: (moods: ManualMood[]) => void;
  readonly onChangeJournalIds: (journalIds: string[]) => void;
  readonly onChangeTags: (tags: string[]) => void;
}

export function EntryDetailModals({
  entry,
  profile,
  timeFormat,
  journals,
  availableTags,
  isEditing,
  formatItems,
  showFormattingTools,
  showStickerPicker,
  showTemplatePicker,
  showPaperBackgroundPicker,
  showPremiumModal,
  showReflections,
  showEntryMetadata,
  editBodyFontFamily,
  editBodyTextColor,
  selectedPaperBackgroundId,
  editMoods,
  selectedJournalIds,
  selectedTags,
  onDismissFormattingTools,
  onSelectFormat,
  onSelectFontFamily,
  onSelectTextColor,
  onCloseStickerPicker,
  onSelectSticker,
  onRequestPremium,
  onCloseTemplatePicker,
  onSelectTemplate,
  onSelectPaperBackground,
  onDismissPaperBackgroundPicker,
  onClosePremiumModal,
  onDismissReflections,
  onAddReflection,
  onDeleteReflection,
  onToggleReflectionMemoryReaction,
  onDismissEntryMetadata,
  onChangeMoods,
  onChangeJournalIds,
  onChangeTags,
}: EntryDetailModalsProps) {
  const t = useTranslation();

  return (
    <>
      <RichTextFormattingDrawer
        visible={isEditing && showFormattingTools}
        onDismiss={onDismissFormattingTools}
        items={formatItems}
        onSelect={onSelectFormat}
        selectedFontFamily={editBodyFontFamily}
        selectedTextColor={editBodyTextColor}
        onSelectFontFamily={onSelectFontFamily}
        onSelectTextColor={onSelectTextColor}
      />
      <StickerPickerModal
        visible={showStickerPicker}
        onClose={onCloseStickerPicker}
        onSelectSticker={onSelectSticker}
        onRequestPremium={onRequestPremium}
      />
      <TemplatePickerModal
        visible={showTemplatePicker}
        onClose={onCloseTemplatePicker}
        onSelectTemplate={onSelectTemplate}
      />
      <DiaryPaperBackgroundPickerModal
        visible={showPaperBackgroundPicker}
        selectedPaperBackgroundId={selectedPaperBackgroundId}
        onSelect={onSelectPaperBackground}
        onDismiss={onDismissPaperBackgroundPicker}
      />
      <PaywallModal
        visible={showPremiumModal}
        onClose={onClosePremiumModal}
        appName={APP_IDENTITY.codename}
        title={premiumPaywallTitle(t)}
        subtitle={t('premiumPaywallSubtitle')}
        features={[
          t('premiumPaywallFeatureEntries'),
          t('premiumPaywallFeatureStickers'),
          t('premiumPaywallFeatureInsights'),
          t('premiumPaywallFeatureThemes'),
          t('premiumPaywallFeatureOffline'),
        ]}
      />
      <EntryReflectionsModal
        visible={showReflections}
        onDismiss={onDismissReflections}
        entry={entry}
        profile={profile}
        timeFormat={timeFormat}
        onAddReflection={onAddReflection}
        onDeleteReflection={onDeleteReflection}
        onToggleReflectionMemoryReaction={onToggleReflectionMemoryReaction}
      />
      <EntryMetadataModal
        visible={showEntryMetadata}
        onDismiss={onDismissEntryMetadata}
        moods={editMoods}
        onChangeMoods={onChangeMoods}
        selectedJournalIds={selectedJournalIds}
        journals={journals}
        onChangeJournalIds={onChangeJournalIds}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onChangeTags={onChangeTags}
      />
    </>
  );
}
