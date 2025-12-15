import { computed, signal } from '@angular/core';

export class AppStore {
  readonly counter = signal(0);
  readonly double = computed(() => this.counter() * 2);
  inc() {
    this.counter.update((v: number) => v + 1);
  }
  reset() {
    this.counter.set(0);
  }
}
