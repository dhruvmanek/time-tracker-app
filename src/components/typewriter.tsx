// Text that types itself out, with a light vibration tick as it goes.
// The full text is laid out from the start (the untyped part is invisible),
// so nothing jumps around while it types.

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, type StyleProp, type TextStyle } from 'react-native';

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Milliseconds per character. */
  speed?: number;
  /** Wait this long before starting. */
  delay?: number;
  /** Vibrate while typing. */
  haptics?: boolean;
  onDone?: () => void;
};

/** Restarts from the beginning whenever the text changes. */
export function Typewriter(props: Props) {
  return <TypewriterInner key={props.text} {...props} />;
}

function TypewriterInner({ text, style, speed = 26, delay = 0, haptics = true, onDone }: Props) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let n = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        n += 1;
        setCount(n);
        // A tick every couple of letters feels like typing without buzzing constantly.
        if (haptics && Platform.OS !== 'web' && n % 2 === 0 && text[n - 1] !== ' ') {
          Haptics.selectionAsync();
        }
        if (n >= text.length) {
          clearInterval(interval);
          doneRef.current?.();
        }
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay, haptics]);

  return (
    <Text style={style} accessibilityLabel={text}>
      {text.slice(0, count)}
      <Text style={{ color: 'transparent' }}>{text.slice(count)}</Text>
    </Text>
  );
}
