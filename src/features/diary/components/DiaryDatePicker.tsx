import { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";

/** Change this one value to compare the five date-control directions. */
export const DATE_PICKER_VARIANT = 4 as 1 | 2 | 3 | 4 | 5;

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  label?: string;
  variant?: 'default' | 'entryHero';
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiaryDatePicker({
  value,
  onChange,
  maximumDate,
  label = "",
  variant = 'default',
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (date) onChange(date);
  };

  const dateText =
    DATE_PICKER_VARIANT === 3 ? shortDate(value) : formatDate(value);
  const icon = (
    <Ionicons name="calendar-outline" size={20} color={theme.colors.tint} />
  );
  const common = {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  };
  const accessibilityLabel = label ? `${label}: ${dateText}` : dateText;
  const entryHeroTextColor = theme.colors.stickerControlText;

  if (variant === 'entryHero') {
    return (
      <View style={styles.entryHeroWrap}>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={styles.entryHeroButton}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.entryHeroDateLeft}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.tint} />
            <Text preset="bodySmall" style={[styles.entryHeroDateText, { color: entryHeroTextColor }]}>
              {dateText}
            </Text>
          </View>
          <View style={[styles.entryHeroChevron, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="chevron-down" size={17} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {open && (
          <View style={[styles.nativePicker, common]}>
            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.done, { backgroundColor: theme.colors.tint }]}
              >
                <Text preset="label" style={{ color: theme.colors.background }}>
                  Done
                </Text>
              </TouchableOpacity>
            )}
            <DateTimePicker
              value={value}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleChange}
              maximumDate={maximumDate}
              style={{
                width: "100%",
                height: Platform.OS === "ios" ? 150 : undefined,
              }}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {DATE_PICKER_VARIANT === 1 && (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.outline, common]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <View>
            {icon}
            <Text
              preset="caption"
              color="textSecondary"
              style={styles.microLabel}
            >
              {label.toUpperCase()}
            </Text>
          </View>
          <Text preset="bodySmall" color="text">
            {dateText}
          </Text>
          <Text color="textSecondary">⌄</Text>
        </TouchableOpacity>
      )}
      {DATE_PICKER_VARIANT === 2 && (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.pill, { backgroundColor: theme.colors.tint + "14" }]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {icon}
          <Text preset="bodySmall" color="tint">
            {dateText}
          </Text>
          <Text color="tint">⌄</Text>
        </TouchableOpacity>
      )}
      {DATE_PICKER_VARIANT === 3 && (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.calendarCard, common]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <View
            style={[styles.dayBlock, { backgroundColor: theme.colors.tint }]}
          >
            <Text style={[styles.dayNumber, { color: theme.colors.background }]}>{value.getDate()}</Text>
            <Text style={[styles.dayMonth, { color: theme.colors.background }]}>
              {value
                .toLocaleDateString("en-US", { month: "short" })
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.dateCopy}>
            <Text preset="caption" color="textSecondary">
              {label}
            </Text>
            <Text preset="bodySmall" color="text">
              {dateText}
            </Text>
          </View>
          {icon}
        </TouchableOpacity>
      )}
      {DATE_PICKER_VARIANT === 4 && (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={styles.underline}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Text preset="caption" color="textSecondary">
            {label}
          </Text>
          <View style={styles.underlineValue}>
            <Text preset="bodySmall" color="text">
              {dateText}
            </Text>
            {icon}
          </View>
        </TouchableOpacity>
      )}
      {DATE_PICKER_VARIANT === 5 && (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.split, common]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.splitDate}>
            <Text style={[styles.splitDay, { color: theme.colors.tint }]}>
              {value.toLocaleDateString("en-US", { weekday: "short" })}
            </Text>
            <Text preset="bodySmall" color="text">
              {shortDate(value)}
            </Text>
          </View>
          <View
            style={[
              styles.changeBadge,
              { backgroundColor: theme.colors.tint + "18" },
            ]}
          >
            <Text preset="caption" color="tint">
              Change
            </Text>
          </View>
        </TouchableOpacity>
      )}
      {open && (
        <View style={[styles.nativePicker, common]}>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={[styles.done, { backgroundColor: theme.colors.tint }]}
            >
              <Text preset="label" style={{ color: theme.colors.background }}>
                Done
              </Text>
            </TouchableOpacity>
          )}
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            maximumDate={maximumDate}
            style={{
              width: "100%",
              height: Platform.OS === "ios" ? 150 : undefined,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4, marginTop: 0 },
  entryHeroWrap: {
    marginTop: 18,
    marginBottom: 14,
  },
  entryHeroButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  entryHeroDateLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 8,
  },
  entryHeroDateText: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
  },
  entryHeroChevron: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  microLabel: { fontSize: 9, fontWeight: "700", marginTop: 2 },
  pill: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  calendarCard: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayBlock: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: { fontSize: 20, fontWeight: "700" },
  dayMonth: { fontSize: 9, fontWeight: "700" },
  dateCopy: { flex: 1, gap: 2 },
  underline: { minHeight: 40, paddingVertical: 0 },
  underlineValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  split: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  splitDate: { flexDirection: "row", alignItems: "center", gap: 12 },
  splitDay: { fontWeight: "700" },
  changeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  nativePicker: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },
  done: { alignItems: "center", padding: 9 },
});
