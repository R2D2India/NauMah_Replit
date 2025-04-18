/**
 * Utility to prevent default scroll behavior
 * This module adds event listeners to prevent unwanted scrolling when clicking buttons
 */

/**
 * Prevents default behavior for button clicks and form submissions that might cause unwanted scrolling
 */
export function setupScrollBehavior() {
  // Handle button clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button') as HTMLButtonElement | null;
    
    // If it's a button without type or with type="button"
    if (button && (!button.type || button.type === 'button')) {
      // Prevent default behavior only if it doesn't have href or download attributes
      if (!button.hasAttribute('href') && !button.hasAttribute('download')) {
        e.preventDefault();
      }
    }
  });

  // Handle form submissions 
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    // Allow forms to submit normally if they have an action attribute
    if (!form.hasAttribute('action')) {
      e.preventDefault();
    }
  });
}

/**
 * Scrolls the page to the top
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Scrolls to a specific element
 */
export function scrollToElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Scrolls to an element referenced by a ref
 */
export function scrollToRef(ref: React.RefObject<HTMLElement>) {
  if (ref.current) {
    ref.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}