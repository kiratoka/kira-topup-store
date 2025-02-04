import { GameInfo } from "../types";

export const games = [
  {
    name: "Mobile Legends: Bang Bang",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/MLBB-2025-tiles-178x178.jpg",
    link: "/topup/mobile-legends",
  },
  {
    name: "Honkai Star Rail",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/hsr_tile.jpg",
    link: "/topup/honkai-star-rail",
  },
  {
    name: "Genshin Impact",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/genshinimpact_tile.jpg",
    link: "/topup/genshin-impact",
  },
  {
    name: "Honkai Impact 3",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/honkai_new_tile.png",
    link: "/topup/honkai-impact-3",
  },
  {
    name: "Love and Deepspace",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/love_and_deepspace_tile_178x178.jpg",
    link: "/topup/love-and-deepspace",
  },
  {
    name: "Zenless Zone Zero",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/ZZZ_Zenless-Zone-Zero-Tile.png",
    link: "/topup/zenless-zone-zero",
  },
];


// gameData.ts
export const gamesData: Record<string, GameInfo> = {
  "genshin-impact": {
    id: "genshin-impact",
    name: "Genshin Impact",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/genshinimpact_tile.jpg",
    description: "Top up Genesis Crystal untuk Genshin Impact dengan harga terbaik",
    requiresServer: true,
    serverOptions: [
      { id: "asia", name: "Asia" },
      { id: "america", name: "America" },
      { id: "europe", name: "Europe" },
      { id: "tw_hk_mo", name: "TW, HK, MO" }
    ],
    instructions: [
      "Masukkan User ID dan pilih Server",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Genesis Crystal akan masuk otomatis ke akun anda"
    ]
  },
  "mobile-legends": {
    id: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/MLBB-2025-tiles-178x178.jpg",
    description: "Top up Diamond Mobile Legends: Bang Bang dengan harga terbaik",
    requiresServer: true,
    serverOptions: null,
    instructions: [
      "Masukkan User ID (Server) dan Zone ID",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Diamond akan masuk otomatis ke akun anda"
    ]
  },
  "love-and-deepspace": {
    id: "love-deepspace",
    name: "Love and Deepspace",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/love_and_deepspace_tile_178x178.jpg",
    description: "Top up Currency Love and Deepspace dengan harga terbaik",
    requiresServer: false,
    instructions: [
      "Masukkan User ID",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Currency akan masuk otomatis ke akun anda"
    ]
  },
  "honkai-star-rail": {
    id: "honkai-star-rail",
    name: "Honkai Star Rail",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/hsr_tile.jpg",
    description: "Top up Stellar Jade untuk Honkai Star Rail dengan harga terbaik",
    requiresServer: true,
    serverOptions: [
      { id: "asia", name: "Asia" },
      { id: "america", name: "America" },
      { id: "europe", name: "Europe" },
      { id: "tw_hk_mo", name: "TW, HK, MO" }
    ],
    instructions: [
      "Masukkan User ID dan pilih Server",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Stellar Jade akan masuk otomatis ke akun anda"
    ]
  },
  "honkai-impact-3": {
    id: "honkai-impact-3",
    name: "Honkai Impact 3",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/honkai_new_tile.png",
    description: "Top up Crystals untuk Honkai Impact 3 dengan harga terbaik",
    requiresServer: false,
    instructions: [
      "Masukkan User ID",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Crystals akan masuk otomatis ke akun anda"
    ]
  },
  "zenless-zone-zero": {
    id: "zenless-zone-zero",
    name: "Zenless Zone Zero",
    image: "https://cdn1.codashop.com/S/content/mobile/images/product-tiles/ZZZ_Zenless-Zone-Zero-Tile.png",
    description: "Top up Currency untuk Zenless Zone Zero dengan harga terbaik",
    requiresServer: true,
    serverOptions: [
      { id: "asia", name: "Asia" },
      { id: "america", name: "America" },
      { id: "europe", name: "Europe" },
      { id: "tw_hk_mo", name: "TW, HK, MO" }
    ],
    instructions: [
      "Masukkan User ID dan pilih Server",
      "Pilih nominal top up yang diinginkan",
      "Masukkan email yang valid",
      "Pilih metode pembayaran",
      "Currency akan masuk otomatis ke akun anda"
    ]
  }
}