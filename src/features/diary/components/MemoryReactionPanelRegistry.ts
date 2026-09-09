type MemoryReactionPanelListener = (activePanelId: string | null) => void;

const listeners = new Set<MemoryReactionPanelListener>();

export function openMemoryReactionPanel(activePanelId: string): void {
  listeners.forEach((listener) => listener(activePanelId));
}

export function closeMemoryReactionPanels(): void {
  listeners.forEach((listener) => listener(null));
}

export function subscribeToMemoryReactionPanelOpen(listener: MemoryReactionPanelListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
