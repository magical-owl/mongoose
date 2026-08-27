import { useCallback, useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

type UseScrollCollapseOptions = {
  onScrollBeginDrag?: () => void;
};

export function useScrollCollapse(options: UseScrollCollapseOptions = {}) {
  const { onScrollBeginDrag } = options;
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollOffsetYRef = useRef(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextScrollY = event.nativeEvent.contentOffset.y;
    scrollOffsetYRef.current = nextScrollY;
    scrollY.setValue(nextScrollY);
  }, [scrollY]);

  const handleScrollBeginDrag = useCallback(() => {
    onScrollBeginDrag?.();
  }, [onScrollBeginDrag]);

  const resetScrollCollapse = useCallback(() => {
    scrollOffsetYRef.current = 0;
    scrollY.setValue(0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [scrollY]);

  return {
    scrollRef,
    scrollY,
    scrollOffsetYRef,
    handleScroll,
    handleScrollBeginDrag,
    resetScrollCollapse,
  };
}
