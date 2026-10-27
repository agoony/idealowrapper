import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyAction,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
} from "@elgato/streamdeck";

import { fetchProduct, formatPrice, HttpError, isIdealoUrl, ProductInfo } from "../idealo";

type Settings = {
	url?: string;
	refreshMinutes?: string;
};

const MIN_MINUTES = 1;

@action({ UUID: "com.jordi-bargans.idealowrapper.product" })
export class IdealoProduct extends SingletonAction<Settings> {
	private timers = new Map<string, NodeJS.Timeout>();
	private cache = new Map<string, ProductInfo>();

	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (!ev.action.isKey()) return;
		await this.start(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (!ev.action.isKey()) return;
		this.cache.delete(ev.action.id);
		await this.start(ev.action, ev.payload.settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.stop(ev.action.id);
		this.cache.delete(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { url } = ev.payload.settings;
		if (isIdealoUrl(url)) {
			await streamDeck.system.openUrl(url);
		} else {
			await ev.action.showAlert();
		}
	}

	private async start(action: KeyAction<Settings>, settings: Settings): Promise<void> {
		this.stop(action.id);

		const url = settings.url;
		if (!isIdealoUrl(url)) {
			await action.setTitle("Configura\nla URL");
			return;
		}

		const minutes = Math.max(MIN_MINUTES, Number(settings.refreshMinutes) || 60);
		await this.refresh(action, url);
		this.timers.set(
			action.id,
			setInterval(() => void this.refresh(action, url), minutes * 60_000),
		);
	}

	private stop(id: string): void {
		const t = this.timers.get(id);
		if (t) clearInterval(t);
		this.timers.delete(id);
	}

	private async refresh(action: KeyAction<Settings>, url: string): Promise<void> {
		try {
			const info = await fetchProduct(url);
			const previous = this.cache.get(action.id);
			this.cache.set(action.id, info);
			if (info.imageDataUrl) await action.setImage(info.imageDataUrl);
			await action.setTitle(info.price !== undefined ? formatPrice(info.price, info.currency) : "s/p");
			if (
				previous?.price !== undefined &&
				info.price !== undefined &&
				(previous.price !== info.price || previous.currency !== info.currency)
			) {
				await action.showAlert();
			}
		} catch (err) {
			streamDeck.logger.error("Idealo:", err);
			await action.showAlert();
			// Si ya había un precio mostrado, se conserva el último conocido.
			if (!this.cache.has(action.id)) {
				await action.setTitle(err instanceof HttpError ? `Error\n${err.status}` : "Error");
			}
		}
	}
}
