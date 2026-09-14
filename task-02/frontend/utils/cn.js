/**
 * Simple class name utility for conditionally combining Tailwind CSS class strings
 * @param  {...any} classes 
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default cn;
