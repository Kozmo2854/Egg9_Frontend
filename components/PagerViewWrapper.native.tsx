// This file is for native (iOS/Android) - uses PagerView for gallery swipe
import React from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';

interface PagerViewWrapperProps {
  children: React.ReactNode[];
  currentPage: number;
  onPageSelected: (index: number) => void;
  pagerRef: React.RefObject<PagerView>;
}

export function PagerViewWrapper({ children, currentPage, onPageSelected, pagerRef }: PagerViewWrapperProps) {
  const handlePageSelected = (e: any) => {
    onPageSelected(e.nativeEvent.position);
  };

  return (
    <PagerView
      ref={pagerRef}
      style={styles.container}
      initialPage={currentPage}
      onPageSelected={handlePageSelected}
      overdrag={true}
      offscreenPageLimit={2}
    >
      {React.Children.map(children, (child, index) => (
        <View key={index} style={styles.page} collapsable={false}>
          {child}
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});

