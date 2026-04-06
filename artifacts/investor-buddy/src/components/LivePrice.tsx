import { useEffect, useRef, useState } from "react";
import { useGetBatchQuotes } from "@workspace/api-client-react";

interface LiveQuote {
  available: boolean;
  ticker: string;
  price?: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

export function LivePriceCell({
  ticker,
  fallbackPrice,
  quotes,
}: {
  ticker: string;
  fallbackPrice: number;
  quotes: Record<string, LiveQuote>;
}) {
  const quote = quotes[ticker];

  if (!quote || !quote.available || quote.price == null) {
    return (
      <span className="font-mono font-semibold tabular-nums">
        ${fallbackPrice.toFixed(2)}
      </span>
    );
  }

  const up = (quote.change ?? 0) >= 0;
  const changeColor = up ? "text-emerald-600" : "text-red-600";
  const arrow = up ? "▲" : "▼";

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="font-mono font-bold tabular-nums text-foreground">
        ${quote.price.toFixed(2)}
      </span>
      <span className={`text-[10px] font-semibold tabular-nums leading-none ${changeColor}`}>
        {arrow} {Math.abs(quote.change ?? 0).toFixed(2)} ({Math.abs(quote.changePercent ?? 0).toFixed(2)}%)
      </span>
    </span>
  );
}

export function useLivePrices(tickers: string[], enabled = true) {
  const tickerKey = [...tickers].sort().join(",");
  const prevKeyRef = useRef("");
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (tickerKey !== prevKeyRef.current) {
      prevKeyRef.current = tickerKey;
      setShouldFetch(true);
    }
  }, [tickerKey]);

  const { data: quotes = {}, isLoading } = useGetBatchQuotes(
    { tickers },
    {
      query: {
        enabled: enabled && tickers.length > 0,
        queryKey: ["getBatchQuotes", tickerKey],
        staleTime: 55_000,
        refetchInterval: 60_000,
      },
    }
  );

  return { quotes: quotes as Record<string, LiveQuote>, isLoading };
}

export function LiveTimestamp({ quotes }: { quotes: Record<string, LiveQuote> }) {
  const firstQuote = Object.values(quotes).find(q => q.available && q.timestamp);
  if (!firstQuote?.timestamp) return null;
  const time = new Date(firstQuote.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="text-[10px] text-muted-foreground">
      Live · {time}
    </span>
  );
}
