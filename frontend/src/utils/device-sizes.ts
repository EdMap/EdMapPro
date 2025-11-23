/**
 * Object defining device screen sizes for responsive design.
 *
 * @constant
 * @type {Object}
 * @property {number} TABLET - The screen width for tablet devices.
 * @property {number} MOBILE - The screen width for mobile devices.
 * @example
 * const isTablet = window.innerWidth <= DEVICE_SIZE.TABLET;
 * const isMobile = window.innerWidth <= DEVICE_SIZE.MOBILE;
 * console.log(isTablet); // Result: true if the window width is less than or equal to the tablet size.
 * console.log(isMobile); // Result: true if the window width is less than or equal to the mobile size.
 */

export const DEVICE_SIZE = {
    TABLET: 1024,
    MOBILE: 640,
}
