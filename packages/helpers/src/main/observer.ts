/* eslint-disable no-empty-function */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-use-before-define */

import { logger } from '@yumm/utils';

/* eslint-disable no-useless-constructor */
class Observer {
  static _instance: Observer;
  observers: Record<string, Array<Function>> = {};
  private constructor() {}
  add(event: string, fn: Function) {
    if (this.observers[event]) {
      this.observers[event].push(fn);
    } else {
      this.observers = { [event]: [fn] };
    }
  }

  run(event: string, data: any) {
    this.observers[event].forEach((fn, idx) => {
      fn(data)
        .then(logger.info(`observer event: ${event} of ${idx} completed`))
        .catch((error: any) => {
          logger.error([`observer event error: ${event}`, error]);
        });
    });
  }
  static instance() {
    if (Observer._instance) {
      return Observer._instance;
    }
    Observer._instance = new Observer();
    return Observer._instance;
  }
}
export default Observer.instance;
