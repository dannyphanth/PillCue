import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
  title: string;
  message: string;
};

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dce4dc",
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18231d",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#55665b",
  },
});
