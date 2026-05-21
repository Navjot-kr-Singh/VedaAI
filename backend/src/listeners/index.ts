import { initDbListener } from './db.listener';
import { initLoggerListener } from './logger.listener';
import { initSocketListener } from './socket.listener';

export const initListeners = () => {
  initDbListener();
  initLoggerListener();
  initSocketListener();
};
