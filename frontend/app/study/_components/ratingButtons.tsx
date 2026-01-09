import { Pressable, StyleSheet, Text, View } from "react-native";

const ratingConfig = {
  again: { label: "Again", time: "1m", tint: "rgba(239, 68, 68, 0.49)" },
  hard: { label: "Hard", time: "8m", tint: "rgba(245, 159, 11, 0.48)" },
  good: { label: "Good", time: "15m", tint: "rgba(34, 197, 94, 0.5)" },
  easy: { label: "Easy", time: "3d", tint: "rgba(59, 131, 246, 0.49)" },
} as const;

type RatingKey = keyof typeof ratingConfig;

export function RatingButtons({
  onRate,
}: {
  onRate: (rating: RatingKey) => void;
}) {
  return (
    <View style={styles.actions}>
      {(
        Object.entries(ratingConfig) as [
          keyof typeof ratingConfig,
          (typeof ratingConfig)[keyof typeof ratingConfig],
        ][]
      ).map(([key, cfg]) => (
        <Pressable
          key={key}
          onPress={() => onRate(key)}
          style={({ pressed }) => [
            styles.rateBtn,
            { backgroundColor: cfg.tint },
            pressed && styles.rateBtnPressed,
          ]}
        >
          <Text style={styles.rateLabel}>{cfg.label}</Text>
          <Text style={styles.rateTime}>{cfg.time}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  rateBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  rateBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  rateLabel: {
    color: "rgba(242,242,247,0.88)",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  rateTime: {
    marginTop: 2,
    color: "rgba(242,242,247,0.55)",
    fontSize: 12,
    fontWeight: "800",
  },
});
