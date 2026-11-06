import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToHash listens to location pathname and hash changes.
 * - When a hash exists, it smoothly scrolls the page to the matching element ID,
 *   retrying if the DOM is still mounting.
 * - When navigating to a new pathname without a hash, it resets scroll position to the top.
 */
const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const scrollToTarget = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return true;
        }
        return false;
      };

      // Attempt immediately
      if (!scrollToTarget()) {
        let attempts = 0;
        const intervalId = setInterval(() => {
          attempts += 1;
          if (scrollToTarget() || attempts >= 15) {
            clearInterval(intervalId);
          }
        }, 50);

        return () => clearInterval(intervalId);
      }
    } else {
      // Standard page navigation without hash: scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
