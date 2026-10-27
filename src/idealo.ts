export interface ProductInfo {
	name?: string;
	price?: number;
	currency: string;
	imageDataUrl?: string;
}

export class HttpError extends Error {
	constructor(public readonly status: number) {
		super(`HTTP ${status}`);
	}
}

// Solo dominios de Idealo: evita que el botón abra o descargue URLs arbitrarias.
const ALLOWED_HOST = /(^|\.)idealo\.(es|de|fr|it|at|co\.uk|com)$/i;

export function isIdealoUrl(raw: string | undefined): raw is string {
	if (!raw) return false;
	try {
		const u = new URL(raw);
		return u.protocol === "https:" && ALLOWED_HOST.test(u.hostname);
	} catch {
		return false;
	}
}

const HEADERS: Record<string, string> = {
	"User-Agent": "StreamDeckIdealoPlugin/1.0 (uso personal)",
	Accept: "text/html,application/xhtml+xml",
	"Accept-Language": "es-ES,es;q=0.9",
};

/** Devuelve los nodos JSON-LD de tipo Product de la página. */
function jsonLdProducts(html: string): any[] {
	const out: any[] = [];
	const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) {
		try {
			const data = JSON.parse(m[1]);
			const stack: any[] = Array.isArray(data) ? [...data] : [data];
			while (stack.length) {
				const n = stack.pop();
				if (!n || typeof n !== "object") continue;
				if (Array.isArray(n["@graph"])) stack.push(...n["@graph"]);
				const t = n["@type"];
				if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) out.push(n);
			}
		} catch {
			// JSON-LD inválido: se ignora
		}
	}
	return out;
}

function meta(html: string, prop: string): string | undefined {
	const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
	return re.exec(html)?.[1];
}

async function toDataUrl(src: string): Promise<string | undefined> {
	try {
		const res = await fetch(new URL(src, "https://www.idealo.es"), {
			headers: { "User-Agent": HEADERS["User-Agent"] },
			signal: AbortSignal.timeout(15_000),
		});
		if (!res.ok) return undefined;
		const type = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
		const buf = Buffer.from(await res.arrayBuffer());
		return `data:${type};base64,${buf.toString("base64")}`;
	} catch {
		return undefined;
	}
}

export async function fetchProduct(url: string): Promise<ProductInfo> {
	const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) });
	if (!res.ok) throw new HttpError(res.status);
	const html = await res.text();

	const product = jsonLdProducts(html)[0];
	const offer = [product?.offers].flat().filter(Boolean)[0];
	const rawPrice = offer?.lowPrice ?? offer?.price;
	const price = rawPrice !== undefined ? parseFloat(String(rawPrice)) : undefined;

	const imgField = [product?.image].flat()[0];
	const imageUrl: string | undefined =
		(typeof imgField === "string" ? imgField : imgField?.url) ?? meta(html, "og:image");

	return {
		name: product?.name ?? meta(html, "og:title"),
		price: price !== undefined && Number.isFinite(price) ? price : undefined,
		currency: offer?.priceCurrency ?? "EUR",
		imageDataUrl: imageUrl ? await toDataUrl(imageUrl) : undefined,
	};
}

export function formatPrice(price: number, currency: string): string {
	return new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency,
		maximumFractionDigits: price % 1 === 0 ? 0 : 2,
	}).format(price);
}
