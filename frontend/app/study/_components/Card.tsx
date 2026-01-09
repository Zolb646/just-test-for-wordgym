import { BlurView } from "@/components/blur-view";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export function Card({ setShowAnswer, showAnswer, card }) {
  const animate = useRef(new Animated.Value(0));

  const interpolateFront = animate.current.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const interpolateBack = animate.current.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const handleFlip = () => setShowAnswer((prev) => !prev);

  useEffect(() => {
    Animated.timing(animate.current, {
      duration: 300,
      toValue: showAnswer ? 180 : 0,
      useNativeDriver: true,
    }).start();
  }, [showAnswer]);

  return (
    <Pressable onPress={handleFlip} style={styles.cardWrap}>
      {({ pressed }) => (
        <>
          <Animated.View
            style={[
              styles.cardFace,
              pressed && styles.facePressed,
              {
                transform: [
                  { perspective: 900 },
                  { rotateY: interpolateFront },
                  ...(pressed ? [{ scale: 0.995 }] : []),
                ],
              },
            ]}
          >
            <BlurView
              intensity={18}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardInner}>
              <Text style={styles.cardWord}>{card.word}</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardFace,
              pressed && styles.facePressed,
              {
                transform: [
                  { perspective: 900 },
                  { rotateY: interpolateBack },
                  ...(pressed ? [{ scale: 0.995 }] : []),
                ],
              },
            ]}
          >
            <BlurView
              intensity={18}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardInner}>
              <Text style={styles.cardWord}>{card.word}</Text>
              <Text style={styles.cardTranslation}>{card.translation}</Text>
            </View>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: { width: "100%", height: "78%" },
  cardPressed: { transform: [{ scale: 0.995 }], opacity: 0.98 },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    backfaceVisibility: "hidden",
  },
  cardInner: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  cardWord: {
    color: "#F2F2F7",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  cardTranslation: {
    color: "rgba(242,242,247,0.70)",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 26,
  },
  cardHint: {
    color: "rgba(242,242,247,0.45)",
    fontSize: 14,
    fontWeight: "800",
  },
  cardHintSub: {
    color: "rgba(242,242,247,0.28)",
    fontSize: 12,
    fontWeight: "700",
  },
  facePressed: {
    opacity: 0.98,
  },
});
