import { LocalStorageKeys } from 'librechat-data-provider';

export function getAppTitle(): string {
  return localStorage.getItem(LocalStorageKeys.APP_TITLE)?.trim() || 'LibreChat';
}

export function getBrandedDocumentTitle(pageTitle?: string | null): string {
  const appTitle = getAppTitle();
  const normalizedPageTitle = pageTitle?.trim();
  if (!normalizedPageTitle || normalizedPageTitle === appTitle) {
    return appTitle;
  }
  return `${normalizedPageTitle} · ${appTitle}`;
}
