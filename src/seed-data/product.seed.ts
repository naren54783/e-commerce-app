import dotenv from "dotenv";
dotenv.config();

import { faker } from "@faker-js/faker";
import { connectDB } from "../config/db";
import Product from "../models/product.model";
import { ProductData } from "../models/product.model";
import logger from "../config/logger";

async function seed() {
  await connectDB();

  const categoryConfig = {
    Smartphone: {
      brands: ["Samsung", "Apple", "Google", "OnePlus", "Xiaomi", "Sony", "Motorola", "Nokia"],
      models: ["Pro", "Ultra", "Lite", "Plus", "Max", "Mini", "SE", "Edge"],
      priceRange: { min: 199, max: 1499 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["6.1", "6.5", "6.7", "6.9"])}-inch ${faker.helpers.arrayElement(["AMOLED", "OLED", "LCD"])} display, ${faker.helpers.arrayElement(["128GB", "256GB", "512GB"])} storage, ${faker.helpers.arrayElement(["48MP", "64MP", "108MP", "200MP"])} camera, and ${faker.helpers.arrayElement(["5000mAh", "4500mAh", "4000mAh"])} battery.`,
    },
    Laptop: {
      brands: ["Dell", "Apple", "Lenovo", "HP", "Asus", "Acer", "MSI", "Razer"],
      models: ["XPS", "MacBook", "ThinkPad", "Spectre", "ZenBook", "Swift", "Stealth", "Blade"],
      priceRange: { min: 499, max: 3499 },
      description: (name: string) =>
        `${name} featuring ${faker.helpers.arrayElement(["Intel i7", "Intel i9", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M3", "Apple M4"])} processor, ${faker.helpers.arrayElement(["16GB", "32GB", "64GB"])} RAM, ${faker.helpers.arrayElement(["512GB SSD", "1TB SSD", "2TB SSD"])}, and ${faker.helpers.arrayElement(["14-inch", "15.6-inch", "16-inch"])} ${faker.helpers.arrayElement(["Retina", "4K", "QHD", "FHD"])} display.`,
    },
    Tablet: {
      brands: ["Apple", "Samsung", "Lenovo", "Microsoft", "Amazon", "Huawei"],
      models: ["iPad", "Galaxy Tab", "Tab P", "Surface", "Fire HD", "MatePad"],
      priceRange: { min: 149, max: 1299 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["10.2", "10.9", "11", "12.9"])}-inch ${faker.helpers.arrayElement(["Liquid Retina", "AMOLED", "LCD"])} display, ${faker.helpers.arrayElement(["64GB", "128GB", "256GB"])} storage, ${faker.helpers.arrayElement(["Wi-Fi", "Wi-Fi + Cellular"])}, and ${faker.helpers.arrayElement(["10-hour", "12-hour", "15-hour"])} battery life.`,
    },
    Smartwatch: {
      brands: ["Apple", "Samsung", "Garmin", "Fitbit", "Amazfit", "Huawei"],
      models: ["Watch", "Galaxy Watch", "Venu", "Sense", "GTR", "Watch GT"],
      priceRange: { min: 149, max: 799 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["1.4", "1.7", "1.9"])}-inch ${faker.helpers.arrayElement(["AMOLED", "OLED", "Retina"])} display, ${faker.helpers.arrayElement(["heart rate monitor", "ECG sensor", "blood oxygen sensor"])}, ${faker.helpers.arrayElement(["GPS", "GPS + Cellular"])}, ${faker.helpers.arrayElement(["7-day", "14-day", "18-hour"])} battery life, and water resistance up to ${faker.helpers.arrayElement(["50m", "100m"])}.`,
    },
    Headphones: {
      brands: ["Sony", "Apple", "Bose", "Sennheiser", "JBL", "Beats", "Audio-Technica"],
      models: ["WH-1000XM", "AirPods", "QuietComfort", "Momentum", "Tune", "Studio", "ATH-M"],
      priceRange: { min: 49, max: 549 },
      description: (name: string) =>
        `${name} featuring ${faker.helpers.arrayElement(["active noise cancellation", "adaptive noise cancellation", "passive noise isolation"])}, ${faker.helpers.arrayElement(["30-hour", "40-hour", "60-hour"])} battery life, ${faker.helpers.arrayElement(["Bluetooth 5.2", "Bluetooth 5.3"])} connectivity, ${faker.helpers.arrayElement(["40mm", "50mm"])} drivers, and ${faker.helpers.arrayElement(["Hi-Res Audio", "LDAC", "aptX HD"])} support.`,
    },
    Camera: {
      brands: ["Canon", "Sony", "Nikon", "Fujifilm", "Panasonic", "Olympus"],
      models: ["EOS R", "Alpha", "Z", "X-T", "Lumix S", "OM-D"],
      priceRange: { min: 499, max: 4999 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["24.2MP", "33MP", "45MP", "61MP"])} ${faker.helpers.arrayElement(["full-frame", "APS-C", "Micro Four Thirds"])} sensor, ${faker.helpers.arrayElement(["4K 60fps", "6K 30fps", "8K 30fps"])} video recording, ${faker.helpers.arrayElement(["5-axis", "7-axis"])} image stabilization, and ${faker.helpers.arrayElement(["dual SD card", "CFexpress", "SD + CFexpress"])} slots.`,
    },
    Monitor: {
      brands: ["Dell", "LG", "Samsung", "Asus", "BenQ", "Acer"],
      models: ["UltraSharp", "UltraWide", "Odyssey", "ProArt", "PD", "Predator"],
      priceRange: { min: 199, max: 1999 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["24-inch", "27-inch", "32-inch", "34-inch"])}" ${faker.helpers.arrayElement(["4K UHD", "QHD", "WQHD", "Full HD"])} ${faker.helpers.arrayElement(["IPS", "OLED", "VA"])} panel, ${faker.helpers.arrayElement(["144Hz", "165Hz", "240Hz"])} refresh rate, ${faker.helpers.arrayElement(["1ms", "4ms", "5ms"])} response time, and ${faker.helpers.arrayElement(["HDR10", "HDR400", "HDR600"])} support.`,
    },
    Speaker: {
      brands: ["JBL", "Bose", "Sonos", "Marshall", "Bang & Olufsen", "Harman Kardon"],
      models: ["Charge", "SoundLink", "One", "Stanmore", "Beosound", "Aura"],
      priceRange: { min: 49, max: 999 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["360-degree", "stereo", "multi-directional"])} sound, ${faker.helpers.arrayElement(["12-hour", "20-hour", "24-hour"])} battery life, ${faker.helpers.arrayElement(["Bluetooth 5.1", "Bluetooth 5.3", "Wi-Fi + Bluetooth"])} connectivity, ${faker.helpers.arrayElement(["IP67", "IPX7", "IPX4"])} water resistance, and ${faker.helpers.arrayElement(["built-in voice assistant", "multi-room support", "party mode"])}.`,
    },
    "Gaming Console": {
      brands: ["Sony", "Microsoft", "Nintendo", "Valve"],
      models: ["PlayStation", "Xbox", "Switch", "Steam Deck"],
      priceRange: { min: 249, max: 599 },
      description: (name: string) =>
        `${name} with ${faker.helpers.arrayElement(["custom AMD Zen 2", "custom AMD Zen 3+", "NVIDIA Tegra X1"])} processor, ${faker.helpers.arrayElement(["8GB", "16GB"])} RAM, ${faker.helpers.arrayElement(["512GB SSD", "825GB SSD", "1TB SSD"])} storage, ${faker.helpers.arrayElement(["4K 120fps", "4K 60fps", "1080p 60fps"])} output, and ${faker.helpers.arrayElement(["Blu-ray drive", "digital edition", "hybrid portable"])}.`,
    },
  };

  const products: ProductData[] = [];

  for (let i = 0; i < 20000; i++) {
    const category = faker.helpers.arrayElement(["Smartphone", "Laptop", "Tablet", "Smartwatch", "Headphones", "Camera", "Monitor", "Speaker", "Gaming Console"] as const);
    const config = categoryConfig[category];
    const brand = faker.helpers.arrayElement(config.brands);
    const model = faker.helpers.arrayElement(config.models);
    const name = `${brand} ${model} ${faker.helpers.arrayElement(["X", "S", "Z", "A"])}${faker.number.int({ min: 1, max: 99 })}-${i}`;

    const year = faker.number.int({ min: 2015, max: 2026 });

    products.push({
      name,
      description: config.description(name),
      price: parseFloat(faker.commerce.price({ min: config.priceRange.min, max: config.priceRange.max, dec: 2 })),
      category,
      brand,
      model,
      year,
      sku: faker.string.alphanumeric(10).toUpperCase(),
      quantity: faker.number.int({ min: 1, max: 100 }),
      image: `https://picsum.photos/seed/${i}/640/480`,
    });
  }

  try {
    await Product.bulkCreate(products as Record<string, unknown>[]);
    logger.info(`${products.length} products seeded!`);
  } catch (error) {
    logger.error("Seeding failed", { error });
  }

  process.exit(0);
}

seed();
