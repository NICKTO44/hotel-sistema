import { useState, useEffect } from 'react';
import { useSettings } from './useSettings';

// Cache global de tasas para no repetir la llamada en cada componente
let cachedRates: Record<string, number> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

// Moneda base del sistema — los precios están guardados en PEN
const BASE_CURRENCY = 'PEN';

const FALLBACK_RATES: Record<string, number> = {
    PEN: 1,
    USD: 0.27,
    EUR: 0.25,
    GBP: 0.21,
    MXN: 4.60,
    COP: 1050,
    ARS: 280,
    CLP: 260,
};

export const useCurrency = () => {
    const { data: settings } = useSettings();
    const [rates, setRates] = useState<Record<string, number>>(cachedRates);
    const [ratesLoading, setRatesLoading] = useState(false);

    const currencyCode = settings?.currency || 'PEN';
    const currencySymbol = settings?.currencySymbol || 'S/';

    useEffect(() => {
        const now = Date.now();
        // Usar caché si es reciente
        if (Object.keys(cachedRates).length > 0 && now - cacheTimestamp < CACHE_TTL) {
            setRates(cachedRates);
            return;
        }

        setRatesLoading(true);
        fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`)
            .then(r => r.json())
            .then(data => {
                if (data.rates) {
                    cachedRates = data.rates;
                    cacheTimestamp = Date.now();
                    setRates(data.rates);
                }
            })
            .catch(() => {
                // Fallback si no hay conexión
                cachedRates = FALLBACK_RATES;
                setRates(FALLBACK_RATES);
            })
            .finally(() => setRatesLoading(false));
    }, []);

    // Convierte un monto desde PEN a la moneda configurada en Settings
    const convert = (amountInPEN: number): number => {
        if (currencyCode === BASE_CURRENCY) return amountInPEN;
        const rate = rates[currencyCode];
        if (!rate) return amountInPEN;
        return amountInPEN * rate;
    };

    // Formatea con símbolo y decimales apropiados
    const formatCurrency = (amountInPEN: number): string => {
        const converted = convert(amountInPEN);

        // Monedas con valores grandes — sin decimales
        const noDecimals = ['COP', 'ARS', 'CLP'];
        const decimals = noDecimals.includes(currencyCode) ? 0 : 2;

        const formatted = converted.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });

        return `${currencySymbol}${formatted}`;
    };

    return {
        currencySymbol,
        currencyCode,
        formatCurrency,
        convert,
        ratesLoading,
        rates,
    };
};