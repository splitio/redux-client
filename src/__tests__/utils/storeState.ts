/** Constants */
import { ON, OFF, CONTROL } from '../../constants';
import { ISplitState } from '../../types';

export const SPLIT_1 = 'split_1';
export const SPLIT_2 = 'split_2';
export const SPLIT_INVALID = 'split_invalid';
export const USER_1 = 'user_1';
export const USER_2 = 'user_2';
export const USER_INVALID = 'user_invalid';

export const STATE_READY: { splitio: ISplitState } = {
  splitio: {
    isReady: true,
    isTimedout: false,
    lastUpdate: 1192838123,
    treatments: {
      [SPLIT_1]: {
        [USER_1]: { treatment: ON, config: null },
      },
      [SPLIT_2]: {
        [USER_1]: { treatment: OFF, config: null },
      },
    },
  },
};

export const STATE_INITIAL: { splitio: ISplitState } = {
  splitio: {
    isReady: false,
    isTimedout: false,
    lastUpdate: 0,
    treatments: {
    },
  },
};
