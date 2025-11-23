export const isDesktopApp = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.plannerDesktop?.isDesktop);
};

export const desktopWindowControls = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.plannerDesktop?.windowControls;
};
