/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

type Listener<T> = (state: T) => void;

export class Store<T> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState = (): T => {
    return this.state;
  };

  setState = (next: Partial<T> | ((curr: T) => Partial<T>)) => {
    const partial = typeof next === 'function' ? next(this.state) : next;
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  };

  subscribe = (listener: Listener<T>) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export function useStore<T>(store: Store<T>): T {
  const [state, setState] = useState<T>(store.getState());

  useEffect(() => {
    setState(store.getState());
    return store.subscribe((newState) => {
      setState(newState);
    });
  }, [store]);

  return state;
}
