import streamDeck from "@elgato/streamdeck";
import { IdealoProduct } from "./actions/idealo-product";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");



streamDeck.actions.registerAction(new IdealoProduct());
streamDeck.connect();