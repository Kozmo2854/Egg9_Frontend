import { useRef, useCallback } from 'react';
import { PanResponder, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2; // 20% of screen width
const SWIPE_VELOCITY_THRESHOLD = 0.5; // Quick swipe velocity

const TAB_ORDER = ['/', '/two', '/subscription'];

export function useSwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isNavigating = useRef(false);

  const getCurrentIndex = useCallback(() => {
    if (pathname === '/' || pathname === '/index') return 0;
    if (pathname === '/two') return 1;
    if (pathname === '/subscription') return 2;
    return -1;
  }, [pathname]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to predominantly horizontal swipes
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isSignificant = Math.abs(gestureState.dx) > 20;
        return isHorizontal && isSignificant && !isNavigating.current;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (isNavigating.current) return;
        
        const currentIndex = getCurrentIndex();
        if (currentIndex === -1) return;

        const { dx, vx } = gestureState;
        
        // Check if swipe was fast enough or far enough
        const swipedRight = dx > SWIPE_THRESHOLD || (dx > 50 && vx > SWIPE_VELOCITY_THRESHOLD);
        const swipedLeft = dx < -SWIPE_THRESHOLD || (dx < -50 && vx < -SWIPE_VELOCITY_THRESHOLD);
        
        if (swipedRight && currentIndex > 0) {
          isNavigating.current = true;
          router.push(TAB_ORDER[currentIndex - 1] as any);
          setTimeout(() => { isNavigating.current = false; }, 300);
        } else if (swipedLeft && currentIndex < TAB_ORDER.length - 1) {
          isNavigating.current = true;
          router.push(TAB_ORDER[currentIndex + 1] as any);
          setTimeout(() => { isNavigating.current = false; }, 300);
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
