import { useNumber } from '@salla.sa/twilight-theme-engine/hooks';

/**
 * Writes an amount in the store's digit style: Arabic-Indic digits with the Arabic
 * decimal mark when the store has Arabic numbers switched on, as printed, otherwise.
 *
 * The engine's own price lines on the product page print the raw number, so with
 * Arabic numbers on they showed Latin digits while product cards, the cart and the
 * bottom nav showed Arabic ones. Same conversion as the engine's `useMoney`.
 */
export function useStoreDigits() {
  const { useArabicNumerals, toArabic } = useNumber();
  return (amount: number | string | null | undefined): string => {
    if (amount == null) return '';
    return useArabicNumerals ? toArabic(amount).replace('.', '٫') : String(amount);
  };
}
