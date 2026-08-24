import { useState, useCallback, useRef } from 'react';

/**
 * Lightweight Non-Destructive Editor Undo/Redo Hook
 * Stores JSON diff/snapshots of tracks and clips without heavy audio buffers
 */
export const useEditorHistory = (initialState) => {
  const [present, setPresent] = useState(initialState);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Max history depth to prevent memory bloat
  const MAX_HISTORY = 25;

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  /**
   * Set new state and push previous to history
   */
  const setProjectState = useCallback((nextStateOrFn, recordHistory = true) => {
    setPresent((currentPresent) => {
      const nextState = typeof nextStateOrFn === 'function' ? nextStateOrFn(currentPresent) : nextStateOrFn;

      if (recordHistory) {
        setPast((prevPast) => {
          const updated = [...prevPast, currentPresent];
          if (updated.length > MAX_HISTORY) updated.shift();
          return updated;
        });
        setFuture([]); // Clear redo tree on new action
      }

      return nextState;
    });
  }, []);

  /**
   * Undo previous action
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;

    setPast((prevPast) => {
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);
      return newPast;
    });
  }, [past, present]);

  /**
   * Redo previously undone action
   */
  const redo = useCallback(() => {
    if (future.length === 0) return;

    setFuture((prevFuture) => {
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, present]);
      setPresent(next);
      return newFuture;
    });
  }, [future, present]);

  return {
    project: present,
    setProject: setProjectState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
