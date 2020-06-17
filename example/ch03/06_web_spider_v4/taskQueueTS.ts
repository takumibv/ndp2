"use strict";

type Task = (onDone: () => void) => void;

export default class TaskQueue {
  concurrency: number;
  running: number;
  queue: Task[];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  pushTask(task: Task) {
    this.queue.push(task);
    this.next();
  }

  next() {
    while (this.running < this.concurrency && this.queue.length) {
      const task = this.queue.shift();
      task(() => {
        this.running--;
        this.next();
      });
      this.running++;
    }
  }
};
