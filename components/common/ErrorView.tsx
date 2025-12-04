import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  compact?: boolean;
}

/**
 * Reusable error display component
 * Shows error message with optional retry button
 */
export function ErrorView({ message, onRetry, icon = 'alert-circle-outline', compact = false }: ErrorViewProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <MaterialCommunityIcons name={icon} size={20} color="#e53e3e" />
        <Text style={styles.compactText}>{message}</Text>
        {onRetry && (
          <Button mode="text" onPress={onRetry} compact>
            Retry
          </Button>
        )}
      </View>
    );
  }

  return (
    <Surface style={styles.container} elevation={0}>
      <MaterialCommunityIcons name={icon} size={48} color="#e53e3e" />
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button 
          mode="contained" 
          onPress={onRetry}
          style={styles.button}
          buttonColor="#ff6b35"
        >
          Try Again
        </Button>
      )}
    </Surface>
  );
}

/**
 * Network error specific view
 */
export function NetworkErrorView({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorView
      icon="wifi-off"
      message="Unable to connect. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

/**
 * Empty state view (no data)
 */
export function EmptyView({ message, icon = 'inbox-outline' }: { message: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <Surface style={styles.container} elevation={0}>
      <MaterialCommunityIcons name={icon} size={48} color="#a0aec0" />
      <Text style={styles.emptyMessage}>{message}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    minWidth: 150,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    gap: 8,
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    color: '#e53e3e',
  },
});

