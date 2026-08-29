import { LocalStorageKeys } from 'librechat-data-provider';
import { getAppTitle, getBrandedDocumentTitle } from './documentTitle';

describe('documentTitle', () => {
  beforeEach(() => localStorage.clear());

  it('uses the persisted site title', () => {
    localStorage.setItem(LocalStorageKeys.APP_TITLE, 'Lock AI Hub');
    expect(getAppTitle()).toBe('Lock AI Hub');
    expect(getBrandedDocumentTitle()).toBe('Lock AI Hub');
  });

  it('keeps the brand visible for conversation titles', () => {
    localStorage.setItem(LocalStorageKeys.APP_TITLE, 'Lock AI Hub');
    expect(getBrandedDocumentTitle('GPU debugging')).toBe('GPU debugging · Lock AI Hub');
  });

  it('does not duplicate the brand', () => {
    localStorage.setItem(LocalStorageKeys.APP_TITLE, 'Lock AI Hub');
    expect(getBrandedDocumentTitle('Lock AI Hub')).toBe('Lock AI Hub');
  });
});
