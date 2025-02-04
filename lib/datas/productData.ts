import { TopUpProduct } from "../types";

export const productsData: Record<string, TopUpProduct[]> = {
  "genshin-impact": [
    {
      id: "welkin-30",
      name: "Blessing of the Welkin Moon",
      description:
        "Login setiap hari untuk mendapatkan 90 primogems setiap hari selama 30 hari",
      price: 79000,
      type: "subscription",
      gameId: "genshin-impact",
      // Untuk produk subscription, URL gambar tetap menggunakan asset khusus
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/genshin-impact-blessings-of-welkinmoon.png",
      validity: "30 hari",
      currency: { name: "Blessing of the Welkin Moon", amount: 1 },
      featured: true
    },
    {
      id: "crystal-60",
      name: "60 Genesis Crystals",
      description: "Dapatkan 60 Genesis Crystals",
      price: 15000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/60_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 60 }
    },
    {
      id: "crystal-300",
      name: "300 Genesis Crystals",
      description: "Dapatkan 300 Genesis Crystals",
      price: 75000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/300_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 300 },
      popular: true
    },
    {
      id: "crystal-980",
      name: "980 Genesis Crystals",
      description: "Dapatkan 980 Genesis Crystals",
      price: 235000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/980_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 980 }
    },
    {
      id: "crystal-1980",
      name: "1980 Genesis Crystals",
      description: "Dapatkan 1980 Genesis Crystals",
      price: 465000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/1980_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 1980 }
    },
    {
      id: "crystal-3280",
      name: "3280 Genesis Crystals",
      description: "Dapatkan 3280 Genesis Crystals",
      price: 765000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/3280_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 3280 },
      featured: true
    },
    {
      id: "crystal-6480",
      name: "6480 Genesis Crystals",
      description: "Dapatkan 6480 Genesis Crystals",
      price: 1499000,
      type: "currency",
      gameId: "genshin-impact",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/GENSHIN/6480_Genshin-Impact_Crystals.png",
      currency: { name: "Genesis Crystal", amount: 6480 },
      featured: true
    }
  ],

  "mobile-legends": [
    {
      id: "weekly-pass",
      name: "Weekly Diamond Pass",
      description: "Misi Top Up +100",
      price: 28000,
      type: "subscription",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/100x100/MLBB_Weekly_Diamond_Pass.png",
      validity: "7 hari",
      currency: { name: "Weekly diamond pass", amount: 1 },
      featured: true,
      popular: true ,
    },
    {
      id: "diamond-50",
      name: "50 Diamonds",
      description: "Dapatkan 50 Diamonds",
      price: 12000,
      type: "currency",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/150x150/50_MLBB_NewDemom.png",
      currency: { name: "Diamond", amount: 50 }
    },
    {
      id: "diamond-100",
      name: "100 Diamonds",
      description: "Dapatkan 100 Diamonds",
      price: 24000,
      type: "currency",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/150x150/150x250_MLBB_NewDemom.png",
      currency: { name: "Diamond", amount: 100 }
    },
    {
      id: "diamond-250",
      name: "250 Diamonds",
      description: "Dapatkan 250 Diamonds",
      price: 60000,
      type: "currency",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/150x150/150x250_MLBB_NewDemom.png",
      currency: { name: "Diamond", amount: 250 },
      popular: false
    },
    {
      id: "diamond-500",
      name: "500 Diamonds",
      description: "Dapatkan 500 Diamonds",
      price: 115000,
      type: "currency",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/150x150/500_MLBB_NewDemom.png",
      currency: { name: "Diamond", amount: 500 }
    },
    {
      id: "diamond-1000",
      name: "1000 Diamonds",
      description: "Dapatkan 1000 Diamonds",
      price: 230000,
      type: "currency",
      gameId: "mobile-legends",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/MLBB/150x150/1500_MLBB_NewDemom.png",
      currency: { name: "Diamond", amount: 1000 },
      featured: true
    }
  ],

  "love-and-deepspace": [
    {
      id: "crystal-100",
      name: "100 Crystals",
      description: "Dapatkan 100 Crystals",
      price: 10000,
      type: "currency",
      gameId: "love-and-deepspace",
      image:
        "https://cdn1.codashop.com/images/916_44cc26e7-e747-4985-8345-ff81c0e03d17_LOVE%20AND%20DEEPSPACE_image/300%20Crystals.png",
      currency: { name: "Crystal", amount: 100 }
    },
    {
      id: "crystal-500",
      name: "500 Crystals",
      description: "Dapatkan 500 Crystals",
      price: 45000,
      type: "currency",
      gameId: "love-and-deepspace",
      image:
        "https://cdn1.codashop.com/images/916_44cc26e7-e747-4985-8345-ff81c0e03d17_LOVE%20AND%20DEEPSPACE_image/450%20Crystals.png",
      currency: { name: "Crystal", amount: 500 },
      featured: true
    },
    {
      id: "crystal-1000",
      name: "1000 Crystals",
      description: "Dapatkan 1000 Crystals",
      price: 85000,
      type: "currency",
      gameId: "love-and-deepspace",
      image:
        "https://cdn1.codashop.com/images/916_44cc26e7-e747-4985-8345-ff81c0e03d17_LOVE%20AND%20DEEPSPACE_image/980%20Crystals.png",
      currency: { name: "Crystal", amount: 1000 },
      popular: true
    },
    {
      id: "crystal-2000",
      name: "2000 Crystals",
      description: "Dapatkan 2000 Crystals",
      price: 165000,
      type: "currency",
      gameId: "love-and-deepspace",
      image:
        "https://cdn1.codashop.com/images/916_44cc26e7-e747-4985-8345-ff81c0e03d17_LOVE%20AND%20DEEPSPACE_image/1980%20Crystals.png",
      currency: { name: "Crystal", amount: 2000 }
    },
    {
      id: "crystal-5000",
      name: "5000 Crystals",
      description: "Dapatkan 5000 Crystals",
      price: 400000,
      type: "currency",
      gameId: "love-and-deepspace",
      image:
        "https://cdn1.codashop.com/images/916_44cc26e7-e747-4985-8345-ff81c0e03d17_LOVE%20AND%20DEEPSPACE_image/6480%20Crystals.png",
      currency: { name: "Crystal", amount: 5000 },
      featured: true
    }
  ],

  "honkai-star-rail": [
    {
      id: "shard-60",
      name: "60 Oneiric Shards",
      description: "Dapatkan 60 Oneiric Shards",
      price: 20000,
      type: "currency",
      gameId: "honkai-star-rail",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI_STAR_RAIL/Honkai_Star_Rail_60.png",
      currency: { name: "Oneiric Shards", amount: 60 }
    },
    {
      id: "shard-300",
      name: "300 Oneiric Shards",
      description: "Dapatkan 300 Oneiric Shards",
      price: 90000,
      type: "currency",
      gameId: "honkai-star-rail",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI_STAR_RAIL/Honkai_Star_Rail_300.png",
      currency: { name: "Oneiric Shards", amount: 300 },
      popular: true
    },
    {
      id: "shard-980",
      name: "980 Oneiric Shards",
      description: "Dapatkan 980 Oneiric Shards",
      price: 245000,
      type: "currency",
      gameId: "honkai-star-rail",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI_STAR_RAIL/Honkai_Star_Rail_980.png",
      currency: { name: "Oneiric Shards", amount: 980 }
    },
    {
      id: "shard-1980",
      name: "1980 Oneiric Shards",
      description: "Dapatkan 1980 Oneiric Shards",
      price: 485000,
      type: "currency",
      gameId: "honkai-star-rail",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI_STAR_RAIL/Honkai_Star_Rail_1980.png",
      currency: { name: "Oneiric Shards", amount: 1980 },
      featured: true
    },
    {
      id: "hsr-monthly",
      name: "Express Supply Pass",
      description:
        "Login harian untuk 90 Stellar Jade/hari selama 30 hari (Total 2700)",
      price: 75000,
      type: "subscription",
      gameId: "honkai-star-rail",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI_STAR_RAIL/Honkai_Star_Rail_ExpressSupply.png",
      validity: "30 hari",
      currency: { name: "Express Supply Pass", amount: 1 },
      featured: true
    }
  ],

  "honkai-impact-3": [
    {
      id: "crystal-60",
      name: "60 Crystals",
      description: "Dapatkan 60 Crystals",
      price: 18000,
      type: "currency",
      gameId: "honkai-impact-3",
      // Semua produk currency pada honkai-impact-3 menggunakan URL berikut:
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI/honkai-impact_crystal.png",
      currency: { name: "Crystal", amount: 60 }
    },
    {
      id: "crystal-300",
      name: "300 Crystals",
      description: "Dapatkan 300 Crystals",
      price: 85000,
      type: "currency",
      gameId: "honkai-impact-3",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI/honkai-impact_crystal.png",
      currency: { name: "Crystal", amount: 300 },
      popular: false
    },
    {
      id: "crystal-980",
      name: "980 Crystals",
      description: "Dapatkan 980 Crystals",
      price: 225000,
      type: "currency",
      gameId: "honkai-impact-3",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI/honkai-impact_crystal.png",
      currency: { name: "Crystal", amount: 980 }
    },
    {
      id: "crystal-1980",
      name: "1980 Crystals",
      description: "Dapatkan 1980 Crystals",
      price: 450000,
      type: "currency",
      gameId: "honkai-impact-3",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI/honkai-impact_crystal.png",
      currency: { name: "Crystal", amount: 1980 },
      featured: true
    },
    {
      id: "hi3-monthly",
      name: "Monthly Supply Card",
      description:
        "Login harian untuk 60 Crystals/hari selama 30 hari (Total 1800)",
      price: 70000,
      type: "subscription",
      gameId: "honkai-impact-3",
      // Untuk produk subscription, URL gambar tetap menggunakan asset khusus
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/HONKAI/honkai-impact_monthlycard.png",
      validity: "30 hari",
      currency: { name: "Crystal", amount: 1800 },
      featured: true
    }
  ],

  "zenless-zone-zero": [
    {
      id: "currency-50",
      name: "50 Monochrome",
      description: "Dapatkan 50 Monochrome",
      price: 15000,
      type: "currency",
      gameId: "zenless-zone-zero",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/ZZZ/ZZZ-01.png",
      currency: { name: "Monochrome", amount: 50 }
    },
    {
      id: "currency-250",
      name: "250 Monochrome",
      description: "Dapatkan 250 Monochrome",
      price: 70000,
      type: "currency",
      gameId: "zenless-zone-zero",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/ZZZ/ZZZ-02.png",
      currency: { name: "Monochrome", amount: 250 },
      popular: true
    },
    {
      id: "currency-500",
      name: "500 Monochrome",
      description: "Dapatkan 500 Monochrome",
      price: 135000,
      type: "currency",
      gameId: "zenless-zone-zero",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/ZZZ/ZZZ-03.png",
      currency: { name: "Monochrome", amount: 500 }
    },
    {
      id: "currency-1000",
      name: "1000 Monochrome",
      description: "Dapatkan 1000 Monochrome",
      price: 265000,
      type: "currency",
      gameId: "zenless-zone-zero",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/ZZZ/ZZZ-04.png",
      currency: { name: "Monochrome", amount: 1000 },
      featured: true
    },
    {
      id: "zzz-monthly",
      name: "Inter-Knot Monthly Pass",
      description:
        "Login harian untuk 100 Monochrome/hari selama 30 hari (Total 3000)",
      price: 85000,
      type: "subscription",
      gameId: "zenless-zone-zero",
      image:
        "https://cdn1.codashop.com/S/content/common/images/denom-image/ZZZ/ZZZ-MonthCard.png",
      validity: "30 hari",
      currency: { name: "Monochrome", amount: 3000 },
      featured: true
    }
  ]
};
