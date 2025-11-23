export type DesktopWindowState = 'normal' | 'maximized';

declare global {
  interface Window {
    plannerDesktop?: {
      isDesktop: boolean;
      windowControls?: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        getState: () => Promise<DesktopWindowState>;
        onStateChange: (callback: (state: DesktopWindowState) => void) => () => void;
      };
    };
  }
}

export {}; 
