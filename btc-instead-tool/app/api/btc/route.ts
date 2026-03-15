import { NextResponse } from "next/server";

type CoinGeckoHistory = {
  market_data?: {
    current_price?: {
      usd?: number;
    };
  };
};

type CoinGeckoSimplePrice = {
  bitcoin?: {
    usd?: number;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));

  if (!Number.isInteger(year) || year < 2010 || year > new Date().getFullYear()) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const historyDate = `01-01-${year}`;

  try {
    const [historyRes, currentRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${historyDate}&localization=false`,
        { next: { revalidate: 3600 } }
      ),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", {
        next: { revalidate: 120 }
      })
    ]);

    if (!historyRes.ok || !currentRes.ok) {
      return NextResponse.json({ error: "Failed to fetch BTC prices" }, { status: 502 });
    }

    const historyData = (await historyRes.json()) as CoinGeckoHistory;
    const currentData = (await currentRes.json()) as CoinGeckoSimplePrice;

    const priceThen = historyData.market_data?.current_price?.usd;
    const priceNow = currentData.bitcoin?.usd;

    if (!priceThen || !priceNow) {
      return NextResponse.json({ error: "BTC price data unavailable" }, { status: 502 });
    }

    return NextResponse.json({ year, priceThen, priceNow });
  } catch {
    return NextResponse.json({ error: "Unexpected error while fetching data" }, { status: 500 });
  }
}
