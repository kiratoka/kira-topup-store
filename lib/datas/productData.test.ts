import { describe, it, expect } from "vitest";
import { productsData, getProductById } from "./productData";

// covers: AC-1 (server resolves canonical price from lib/datas/productData.ts)
// covers: AC-3 (invalid product → undefined, causes 400 in route)

describe("productsData", () => {
  it("contains entries for all six supported games", () => {
    const expectedGames = [
      "genshin-impact",
      "mobile-legends",
      "love-and-deepspace",
      "honkai-star-rail",
      "honkai-impact-3",
      "zenless-zone-zero",
    ];
    for (const gameId of expectedGames) {
      expect(productsData[gameId], `game "${gameId}" should be in catalog`).toBeDefined();
      expect(productsData[gameId].length, `game "${gameId}" should have at least one product`).toBeGreaterThan(0);
    }
  });

  it("every product has a positive integer price (never zero or negative)", () => {
    for (const [gameId, products] of Object.entries(productsData)) {
      for (const product of products) {
        expect(
          product.price,
          `${gameId}/${product.id} price must be a positive integer`
        ).toBeGreaterThan(0);
        expect(Number.isInteger(product.price)).toBe(true);
      }
    }
  });

  it("every product id is unique within its game catalog", () => {
    for (const [gameId, products] of Object.entries(productsData)) {
      const ids = products.map((p) => p.id);
      const unique = new Set(ids);
      expect(unique.size, `duplicate product IDs found in ${gameId}`).toBe(ids.length);
    }
  });

  it("every product carries the correct gameId matching its catalog key", () => {
    for (const [gameId, products] of Object.entries(productsData)) {
      for (const product of products) {
        expect(product.gameId).toBe(gameId);
      }
    }
  });
});

describe("getProductById", () => {
  // AC-1: happy path — returns canonical product with official price
  it("returns the canonical product when both gameId and productId are valid", () => {
    const product = getProductById("genshin-impact", "crystal-300");
    expect(product).toBeDefined();
    expect(product?.id).toBe("crystal-300");
    expect(product?.price).toBe(75000);
    expect(product?.gameId).toBe("genshin-impact");
  });

  it("returns the correct product for mobile-legends diamond-50", () => {
    const product = getProductById("mobile-legends", "diamond-50");
    expect(product).toBeDefined();
    expect(product?.price).toBe(12000);
  });

  it("returns the correct product for honkai-star-rail subscription item", () => {
    const product = getProductById("honkai-star-rail", "hsr-monthly");
    expect(product).toBeDefined();
    expect(product?.type).toBe("subscription");
    expect(product?.price).toBe(75000);
  });

  // AC-3: invalid product ID → undefined (route returns 400)
  it("returns undefined when the productId does not exist in the game catalog", () => {
    const result = getProductById("genshin-impact", "fake-product-xyz");
    expect(result).toBeUndefined();
  });

  it("returns undefined when the gameId does not exist in the catalog", () => {
    const result = getProductById("unknown-game", "crystal-300");
    expect(result).toBeUndefined();
  });

  it("returns undefined when both gameId and productId are unknown", () => {
    const result = getProductById("", "");
    expect(result).toBeUndefined();
  });

  // AC-1: cross-game ID collision — same product ID string in different games
  it("does not confuse products from different games that share an id string", () => {
    // crystal-300 exists in genshin-impact and honkai-impact-3 with different prices
    const genshin = getProductById("genshin-impact", "crystal-300");
    const honkai = getProductById("honkai-impact-3", "crystal-300");
    expect(genshin).toBeDefined();
    expect(honkai).toBeDefined();
    // prices must differ — confirms no cross-game lookup contamination
    expect(genshin?.price).not.toBe(honkai?.price);
    expect(genshin?.gameId).toBe("genshin-impact");
    expect(honkai?.gameId).toBe("honkai-impact-3");
  });

  // AC-1: canonical price is the one in catalog, not any caller-supplied value
  it("always returns the catalog price regardless of any external input", () => {
    const product = getProductById("love-and-deepspace", "crystal-100");
    // catalog price is 10000; no parameter can change this
    expect(product?.price).toBe(10000);
  });

  // Prototype property collision guard
  it("returns undefined without throwing when gameId is a prototype property name", () => {
    expect(getProductById("toString", "crystal-300")).toBeUndefined();
    expect(getProductById("constructor", "crystal-300")).toBeUndefined();
    expect(getProductById("__proto__", "crystal-300")).toBeUndefined();
    expect(getProductById("valueOf", "crystal-300")).toBeUndefined();
  });
});
