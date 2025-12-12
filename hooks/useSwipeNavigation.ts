import { useRef } from 'react';
import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TAB_ORDER = ['/(tabs)', '/(tabs)/two', '/(tabs)/subscription'];
const SWIPE_THRESHOLD = 50;

export function useSwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentIndex = () => {
    if (pathname === '/' || pathname === '/index') return 0;
    if (pathname === '/two') return 1;
    if (pathname === '/subscription') return 2;
    return -1;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        const currentIndex = getCurrentIndex();
        if (currentIndex === -1) return;

        if (gestureState.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          // Swipe right - go to previous tab
          router.push(TAB_ORDER[currentIndex - 1] as any);
        } else if (gestureState.dx < -SWIPE_THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
          // Swipe left - go to next tab
          router.push(TAB_ORDER[currentIndex + 1] as any);
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}

