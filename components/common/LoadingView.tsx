import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Reusable loading indicator component
 */
export function LoadingView({ 
  message = 'Loading...', 
  size = 'large',
  color = '#ff6b35'
}: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

/**
 * Inline loading indicator (for buttons, etc.)
 */
export function InlineLoading({ color = '#ff6b35' }: { color?: string }) {
  return <ActivityIndicator size="small" color={color} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
});

