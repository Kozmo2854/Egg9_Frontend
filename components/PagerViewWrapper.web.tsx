// This file is for web - renders children without PagerView
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PagerViewWrapperProps {
  children: React.ReactNode[];
  currentPage: number;
  onPageSelected: (index: number) => void;
  pagerRef: React.RefObject<any>;
}

export function PagerViewWrapper({ children, currentPage }: PagerViewWrapperProps) {
  // Web: Just render the current page
  return (
    <View style={styles.container}>
      {React.Children.toArray(children)[currentPage]}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

