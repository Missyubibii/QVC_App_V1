import { useLogStore } from './logStore';

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

export const enableConsoleCapture = () => {
    if (!__DEV__) return; // Chỉ chạy ở Dev/Staging

    console.log = (...args) => {
        originalLog(...args);
        useLogStore.getState().addLog('INFO', args.map(a => String(a)).join(' '));
    };

    console.warn = (...args) => {
        originalWarn(...args);
        useLogStore.getState().addLog('WARN', args.map(a => String(a)).join(' '));
    };

    console.error = (...args) => {
        originalError(...args);
        useLogStore.getState().addLog('ERROR', args.map(a => String(a)).join(' '));
    };
};
