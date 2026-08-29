// useDocumentTitle.js
import { useEffect } from 'react';
import { getBrandedDocumentTitle } from '~/utils';

// function useDocumentTitle(title, prevailOnUnmount = false) {
// const defaultTitle = useRef(document.title);
function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = getBrandedDocumentTitle(title);
  }, [title]);

  // useEffect(
  //   () => () => {
  //     if (!prevailOnUnmount) {
  //       document.title = defaultTitle.current;
  //     }
  //   }, []
  // );
}

export default useDocumentTitle;
