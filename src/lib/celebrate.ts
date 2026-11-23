// A tiny event bus: the reward screen tells Home to give Tikko a little hop.

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function celebrate(message: string) {
  listeners.forEach((l) => l(message));
}

export function onCelebrate(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
