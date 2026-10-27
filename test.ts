import { fetchProduct, formatPrice } from "./src/idealo";

declare const process: { argv: string[] };

const url = process.argv[2];
fetchProduct(url)
  .then((p) => {
    console.log("Nombre:", p.name);
    console.log("Precio:", p.price !== undefined ? formatPrice(p.price, p.currency) : "no encontrado");
    console.log("Imagen:", p.imageDataUrl ? `${p.imageDataUrl.slice(0, 40)}...` : "no encontrada");
  })
  .catch((e) => console.error("Fallo:", e));