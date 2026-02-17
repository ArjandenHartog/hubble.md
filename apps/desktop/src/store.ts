import { store, type StoreMiddleware } from "@simplestack/store";
import { invoke } from "@tauri-apps/api/core";

type ViewerStatus = "idle" | "loading" | "ready" | "error";

type ViewerState = {
  currentPath: string | null;
  lastOpenedPath: string | null;
  content: string;
  status: ViewerStatus;
  error: string | null;
};

const STORAGE_KEY = "hubble-desktop-viewer";

const persistentStateMiddleware: StoreMiddleware<ViewerState> = () => ({
  set: (next) => (setter) => {
    next((currentState) => {
      const nextState =
        typeof setter === "function" ? setter(currentState) : setter;
      const stateToPersist: ViewerState = {
        ...nextState,
        lastOpenedPath: nextState.currentPath ?? nextState.lastOpenedPath,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      return stateToPersist;
    });
  },
});

function getInitialState(): ViewerState {
  const emptyState: ViewerState = {
    currentPath: null,
    lastOpenedPath: null,
    content: "",
    status: "idle",
    error: null,
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState;

  try {
    const parsed = JSON.parse(raw) as Partial<ViewerState>;
    return {
      ...emptyState,
      ...parsed,
      currentPath: null,
      content: "",
      status: "idle",
      error: null,
    };
  } catch {
    return emptyState;
  }
}

export const viewerStore = store<ViewerState>(getInitialState(), {
  middleware: [persistentStateMiddleware],
});

export async function loadPath(path: string) {
  viewerStore.set((current) => ({ ...current, status: "loading", error: null }));

  try {
    const content = await invoke<string>("read_file_text", { path });
    viewerStore.set((current) => ({
      ...current,
      currentPath: path,
      content,
      status: "ready",
      error: null,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    viewerStore.set((current) => ({
      ...current,
      currentPath: null,
      content: "",
      status: "error",
      error: message,
    }));
  }
}
