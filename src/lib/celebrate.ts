// A tiny event bus so any screen can trigger the "+XP" celebration toast.

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
