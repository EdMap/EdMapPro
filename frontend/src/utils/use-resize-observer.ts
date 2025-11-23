import { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that uses the ResizeObserver API to track changes in the size of an element.
 *
 * @param {RefObject<HTMLElement | null | undefined>} elRef - Reference to the observed element.
 * @returns {number} - The current width of the observed element.
 *
 * @example
 * // Example of using useResizeObserver with a functional component
 * const ResizableComponent = () => {
 *     const elRef = useRef(null);
 *     const width = useResizeObserver(elRef);
 *
 *     return (
 *         <div ref={elRef}>
 *             Element width: {width}px
 *         </div>
 *     );
 * };
 */
export function useResizeObserver(
    elRef: RefObject<HTMLElement | null | undefined>,
): number {
    const initialSize = window && window.innerWidth

    const [layoutSize, setLayoutSize] = useState<number>(initialSize)

    const observer = useRef(
        new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect
            setLayoutSize(width)
        }),
    )

    useEffect(() => {
        const observerCurrent = observer.current
        let el: HTMLDivElement | HTMLElement | null = null

        if (elRef.current) {
            el = elRef.current
            observerCurrent.observe(elRef.current)
        }

        return () => {
            if (el) {
                observerCurrent.unobserve(el)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elRef.current, observer])

    return layoutSize
}
