import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

import { PrismaClient, Role, OrderStatus, MessageRole, AgentActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for Agentic Commerce Assistant...');

  // Clean up existing records in reverse dependency order
  await prisma.agentAction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.productView.deleteMany({});
  await prisma.cartSession.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 1. Seed 18 Users (2 Admins, 16 Customers)
  const usersData = [
    {
      id: 'usr_admin_01',
      name: 'Elena Vance (Admin)',
      email: 'elena.vance@agenticcommerce.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F', // demo hash
      role: Role.admin,
      googleId: 'google_admin_101',
    },
    {
      id: 'usr_admin_02',
      name: 'Marcus Thorne (Ops Admin)',
      email: 'marcus.thorne@agenticcommerce.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.admin,
      googleId: null,
    },
    {
      id: 'usr_cust_01',
      name: 'Sophia Rodriguez',
      email: 'sophia.r@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: 'google_user_201',
    },
    {
      id: 'usr_cust_02',
      name: 'Liam Chen',
      email: 'liam.chen@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_03',
      name: 'Aisha Patel',
      email: 'aisha.patel@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: 'google_user_203',
    },
    {
      id: 'usr_cust_04',
      name: 'Noah Miller',
      email: 'noah.miller@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_05',
      name: 'Emma Watson',
      email: 'emma.watson@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: 'google_user_205',
    },
    {
      id: 'usr_cust_06',
      name: 'Lucas Dupont',
      email: 'lucas.dupont@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_07',
      name: 'Olivia Martinez',
      email: 'olivia.m@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_08',
      name: 'Ethan Hunt',
      email: 'ethan.hunt@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_09',
      name: 'Maya Lin',
      email: 'maya.lin@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_10',
      name: 'Daniel Kim',
      email: 'daniel.kim@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_11',
      name: 'Zara Larsson',
      email: 'zara.l@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_12',
      name: 'Carlos Santana',
      email: 'carlos.s@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_13',
      name: 'Freja Lindqvist',
      email: 'freja.l@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_14',
      name: 'James Wilson',
      email: 'james.wilson@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_15',
      name: 'Chloe Bennett',
      email: 'chloe.b@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
    {
      id: 'usr_cust_16',
      name: 'Alexander Wright',
      email: 'alex.wright@example.com',
      passwordHash: '$2b$10$e8wVdD5XzV9u0W9V4yY9.e7H3B1w2N8q5Z6m0P7L4k3J2H1g0F',
      role: Role.user,
      googleId: null,
    },
  ];

  for (const u of usersData) {
    await prisma.user.create({ data: u });
  }
  console.log(`✅ Created ${usersData.length} users (2 admins, 16 customers).`);

  // 2. Seed 30 Products across 4 Categories
  const productsData = [
    // Category 1: Electronics (8 products)
    {
      id: 'prod_elec_01',
      name: 'AcousticPro ANC Wireless Headphones',
      description: 'Studio-grade hybrid active noise canceling headphones with 40-hour battery life and spatial audio.',
      price: 249.99,
      category: 'Electronics',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      tags: JSON.stringify(['audio', 'wireless', 'anc', 'bluetooth', 'premium']),
    },
    {
      id: 'prod_elec_02',
      name: 'VisionX 4K UltraWide 34" Curved Monitor',
      description: '144Hz refresh rate, 1ms response time, USB-C 90W PD with factory color calibration for creators.',
      price: 699.0,
      category: 'Electronics',
      stock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
      tags: JSON.stringify(['display', 'gaming', 'productivity', 'ultrawide', '4k']),
    },
    {
      id: 'prod_elec_03',
      name: 'PulseFlow MagSafe 3-in-1 Charging Hub',
      description: 'Fast wireless charging station for Phone, Watch, and Earbuds with aerospace aluminum finish.',
      price: 89.5,
      category: 'Electronics',
      stock: 110,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
      tags: JSON.stringify(['magsafe', 'wireless', 'accessories', 'charger']),
    },
    {
      id: 'prod_elec_04',
      name: 'Chronos Mechanical RGB Keyboard (Hot-Swap)',
      description: 'Gasket-mounted mechanical keyboard with pre-lubed linear switches, PBT keycaps, and custom knob.',
      price: 139.99,
      category: 'Electronics',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      tags: JSON.stringify(['keyboard', 'mechanical', 'custom', 'rgb', 'gaming']),
    },
    {
      id: 'prod_elec_05',
      name: 'OmniStream 4K Studio Webcam',
      description: 'Dual HDR sensors with AI auto-framing, stereo noise-reduction microphones, and privacy shutter.',
      price: 119.0,
      category: 'Electronics',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&q=80',
      tags: JSON.stringify(['streaming', 'camera', 'workfromhome', '4k', 'ai']),
    },
    {
      id: 'prod_elec_06',
      name: 'HyperDrive NVMe Gen4 2TB Portable SSD',
      description: 'Rugged drop-resistant external SSD with up to 2000MB/s read speeds and 256-bit AES encryption.',
      price: 179.99,
      category: 'Electronics',
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
      tags: JSON.stringify(['storage', 'ssd', 'portable', 'backup', 'usb-c']),
    },
    {
      id: 'prod_elec_07',
      name: 'NovaSound Waterproof Bluetooth Speaker',
      description: '360-degree immersive sound with dual passive bass radiators and IP67 dust/water resistance.',
      price: 79.95,
      category: 'Electronics',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
      tags: JSON.stringify(['audio', 'speaker', 'waterproof', 'outdoor', 'bluetooth']),
    },
    {
      id: 'prod_elec_08',
      name: 'ErgoGlide Precision Wireless Trackball Mouse',
      description: 'Ergonomic sculptured thumb-control mouse with multi-device Bluetooth switching and rechargeable battery.',
      price: 64.99,
      category: 'Electronics',
      stock: 75,
      imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
      tags: JSON.stringify(['ergonomic', 'mouse', 'productivity', 'office']),
    },

    // Category 2: Apparel & Footwear (11 products)
    {
      id: 'prod_app_01',
      name: 'Merino Wool Climate Knit Crewneck',
      description: 'Ultra-fine 18.5 micron temperature-regulating Australian Merino wool sweater designed for year-round layering.',
      price: 128.0,
      category: 'Apparel',
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
      tags: JSON.stringify(['merino', 'wool', 'sustainable', 'layering', 'luxury']),
    },
    {
      id: 'prod_app_02',
      name: 'AeroFlex Waterproof Technical Commuter Jacket',
      description: '3-layer breathable storm membrane with taped seams, magnetic pocket closures, and reflective stealth accents.',
      price: 215.0,
      category: 'Apparel',
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80',
      tags: JSON.stringify(['outerwear', 'waterproof', 'techwear', 'commuter']),
    },
    {
      id: 'prod_app_03',
      name: 'CloudStrider Carbon-Plated Running Shoes',
      description: 'Supercritical PEBA foam cushioning paired with a full-length curved carbon fiber propulsion plate.',
      price: 185.0,
      category: 'Apparel',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      tags: JSON.stringify(['footwear', 'running', 'marathon', 'sneakers']),
    },
    {
      id: 'prod_app_04',
      name: 'Everyday Organic Heavyweight Cotton Tee (3-Pack)',
      description: '280 GSM combed organic cotton tees with reinforced collar and pre-shrunk tailored fit.',
      price: 58.0,
      category: 'Apparel',
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      tags: JSON.stringify(['essentials', 'cotton', 'organic', 'basics']),
    },
    {
      id: 'prod_app_05',
      name: 'Veloce All-Day Performance Chino Pant',
      description: '4-way stretch water-repellent chino with hidden zipper passport pocket and gusseted crotch.',
      price: 94.0,
      category: 'Apparel',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
      tags: JSON.stringify(['pants', 'travel', 'stretch', 'workwear']),
    },
    {
      id: 'prod_app_06',
      name: 'Nordic Heritage Cashmere Ribbed Beanie',
      description: '100% Grade-A Mongolian cashmere beanie with fold-over cuff and butter-soft hand feel.',
      price: 49.0,
      category: 'Apparel',
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80',
      tags: JSON.stringify(['cashmere', 'winter', 'accessories', 'warmth']),
    },
    {
      id: 'prod_app_07',
      name: 'Voyager Modular Expandable Backpack 28L',
      description: 'Cordura ballistic nylon backpack with 16" laptop sleeve, luggage pass-through, and waterproof zips.',
      price: 159.0,
      category: 'Apparel',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      tags: JSON.stringify(['backpack', 'travel', 'bags', 'commute']),
    },
    {
      id: 'prod_app_08',
      name: 'Artisan Vegetable-Tanned Italian Leather Belt',
      description: 'Full-grain Tuscan leather with solid brass buckle hand-finished for lifelong durability.',
      price: 68.0,
      category: 'Apparel',
      stock: 70,
      imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80',
      tags: JSON.stringify(['leather', 'accessories', 'handmade', 'artisan']),
    },
    {
      id: 'prod_app_09',
      name: 'AeroTrack Lightweight Daily Trainer Running Shoes',
      description: 'Ultra-breathable engineered mesh upper with responsive EVA foam midsole for 5k-10k daily road runs.',
      price: 32.0,
      category: 'Apparel',
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
      tags: JSON.stringify(['footwear', 'running', 'shoes', 'budget', 'sneakers', 'road']),
    },
    {
      id: 'prod_app_10',
      name: 'VoltDash Trail & Road Hybrid Running Shoes',
      description: 'All-terrain lugged outsole with shock-absorbing forefoot protection and quick-lace bungee system.',
      price: 28.5,
      category: 'Apparel',
      stock: 95,
      imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
      tags: JSON.stringify(['footwear', 'running', 'trail', 'shoes', 'sneakers', 'budget']),
    },
    {
      id: 'prod_app_11',
      name: 'StridePulse Cushion Max Performance Running Shoes',
      description: 'High-energy rebound foam with TPU heel stabilization and anti-microbial ortholite sockliner.',
      price: 35.0,
      category: 'Apparel',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
      tags: JSON.stringify(['footwear', 'running', 'shoes', 'marathon', 'cushion']),
    },

    // Category 3: Home & Living (7 products)
    {
      id: 'prod_home_01',
      name: 'Aura Minimalist Precision Coffee Scale & Pour-Over Kit',
      description: 'Integrated 0.1g timer scale, borosilicate carafe, and double-mesh stainless dripper.',
      price: 84.0,
      category: 'Home & Living',
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
      tags: JSON.stringify(['coffee', 'kitchen', 'brewing', 'design']),
    },
    {
      id: 'prod_home_02',
      name: 'Lumina Smart Ambient Sunrise Alarm & Sound Machine',
      description: 'Circadian rhythm wake light with bio-acoustic white noise and app-controlled sunset dimming.',
      price: 110.0,
      category: 'Home & Living',
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      tags: JSON.stringify(['smart-home', 'sleep', 'lighting', 'wellness']),
    },
    {
      id: 'prod_home_03',
      name: 'EmberGlow Ultrasonic Ceramic Diffuser',
      description: 'Handcrafted stoneware essential oil diffuser with whisper-quiet ultrasonic atomization and ambient glow.',
      price: 65.0,
      category: 'Home & Living',
      stock: 90,
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
      tags: JSON.stringify(['aromatherapy', 'decor', 'ceramic', 'relaxation']),
    },
    {
      id: 'prod_home_04',
      name: 'Nordic Oak & Wool Ergonomic Footrest',
      description: 'Solid European oak rocker with high-density wool felt cushion for ergonomic desk posture.',
      price: 72.0,
      category: 'Home & Living',
      stock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      tags: JSON.stringify(['furniture', 'desk', 'ergonomic', 'woodworking']),
    },
    {
      id: 'prod_home_05',
      name: 'PureBreeze HEPA H13 Air Purifier with PM2.5 Sensor',
      description: 'Medical-grade 3-stage filtration capturing 99.97% of airborne particles down to 0.1 microns.',
      price: 169.0,
      category: 'Home & Living',
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
      tags: JSON.stringify(['appliances', 'clean-air', 'allergies', 'hepa']),
    },
    {
      id: 'prod_home_06',
      name: 'Stoneware Matte Matcha Ceremonial Set',
      description: 'Hand-thrown bowl, golden bamboo 100-prong chasen whisk, scoop, and porcelain whisk stand.',
      price: 46.0,
      category: 'Home & Living',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
      tags: JSON.stringify(['tea', 'matcha', 'japan', 'ceramics']),
    },
    {
      id: 'prod_home_07',
      name: 'Solace French Flax Linen Duvet Cover Set (Queen)',
      description: '100% Normandy certified flax linen washed with volcanic pumice for lived-in softness.',
      price: 195.0,
      category: 'Home & Living',
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80',
      tags: JSON.stringify(['bedding', 'linen', 'luxury', 'bedroom']),
    },

    // Category 4: Fitness & Wellness (7 products)
    {
      id: 'prod_fit_01',
      name: 'TheraPulse Mini Deep-Tissue Massage Gun',
      description: 'Brushless motor delivering 3200 RPM percussive therapy in a pocket-sized 1.1 lb aircraft aluminum body.',
      price: 129.0,
      category: 'Fitness & Wellness',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
      tags: JSON.stringify(['recovery', 'massage', 'fitness', 'therapy']),
    },
    {
      id: 'prod_fit_02',
      name: 'ZenGrip Natural Cork & Tree Rubber Yoga Mat',
      description: 'Non-slip antimicrobial cork surface bonded to natural rubber base with body alignment guidelines.',
      price: 78.0,
      category: 'Fitness & Wellness',
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&q=80',
      tags: JSON.stringify(['yoga', 'cork', 'eco-friendly', 'mindfulness']),
    },
    {
      id: 'prod_fit_03',
      name: 'Vortex Hydrate Smart Vacuum Insulated Bottle 32oz',
      description: 'Double-wall stainless steel with UV-C self-cleaning cap that sterilizes water in 60 seconds.',
      price: 59.99,
      category: 'Fitness & Wellness',
      stock: 105,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
      tags: JSON.stringify(['hydration', 'uv-c', 'stainless', 'outdoors']),
    },
    {
      id: 'prod_fit_04',
      name: 'FlexBand Pro Adjustable Resistance System (Set of 5)',
      description: 'Multi-layer natural Malaysian latex tubes with heavy-duty aluminum carabiners and door anchors.',
      price: 42.0,
      category: 'Fitness & Wellness',
      stock: 140,
      imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',
      tags: JSON.stringify(['resistance', 'home-gym', 'workout', 'strength']),
    },
    {
      id: 'prod_fit_05',
      name: 'Apex Speed Rope Ball-Bearing Jump Rope',
      description: 'Dual 360-degree precision ball bearings with knurled aircraft aluminum handles and coated steel cable.',
      price: 29.5,
      category: 'Fitness & Wellness',
      stock: 115,
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
      tags: JSON.stringify(['cardio', 'speed-rope', 'boxing', 'hiit']),
    },
    {
      id: 'prod_fit_06',
      name: 'VitalTrack Bio-Impedance Smart Body Scale',
      description: 'Measures 14 body metrics including visceral fat, muscle mass, and BMR with Bluetooth smartphone sync.',
      price: 49.0,
      category: 'Fitness & Wellness',
      stock: 70,
      imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
      tags: JSON.stringify(['scale', 'bio-metrics', 'health', 'tracking']),
    },
    {
      id: 'prod_fit_07',
      name: 'NeuroCalm High-Density Acupressure Mat & Pillow',
      description: 'Over 8,000 ergonomic stimulation points crafted from organic linen and coconut fiber padding.',
      price: 54.0,
      category: 'Fitness & Wellness',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      tags: JSON.stringify(['acupressure', 'recovery', 'sleep', 'relaxation']),
    },
  ];

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log(`✅ Created ${productsData.length} products across 4 categories.`);

  // 3. Generate Historical Timeline (Past 30 Days)
  const now = new Date();
  const getPastDate = (daysAgo: number, hourOffset = 12): Date => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    d.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);
    return d;
  };

  // 4. Seed Product Views across the past 30 days
  console.log('📊 Seeding historical Product Views...');
  const customerIds = usersData.filter((u) => u.role === Role.user).map((u) => u.id);
  const allProductIds = productsData.map((p) => p.id);

  const viewsToCreate = [];
  // For each day in past 30 days, generate 6 to 15 views
  for (let day = 29; day >= 0; day--) {
    const dailyViewCount = 8 + (day % 7) * 2; // realistic pattern with weekend bumps
    for (let v = 0; v < dailyViewCount; v++) {
      const isRegistered = Math.random() > 0.3;
      const userId = isRegistered ? customerIds[Math.floor(Math.random() * customerIds.length)] : null;
      const productId = allProductIds[Math.floor(Math.random() * allProductIds.length)];
      viewsToCreate.push({
        userId,
        productId,
        createdAt: getPastDate(day, 8 + (v % 14)),
      });
    }
  }

  for (const view of viewsToCreate) {
    await prisma.productView.create({ data: view });
  }
  console.log(`✅ Created ${viewsToCreate.length} product view events across 30 days.`);

  // 5. Seed Historical Cart Sessions (Abandonment Rate computation)
  console.log('🛒 Seeding historical Cart Sessions...');
  const cartSessionsToCreate = [];
  // 75 total carts over 30 days: ~50 abandoned, ~25 converted
  for (let day = 29; day >= 0; day--) {
    const cartsToday = 2 + (day % 4 === 0 ? 2 : 1);
    for (let c = 0; c < cartsToday; c++) {
      const userId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const isConverted = (day + c) % 3 === 0; // ~33% convert, ~67% abandon
      const createdAt = getPastDate(day, 10 + (c * 3));
      const convertedAt = isConverted ? new Date(createdAt.getTime() + 45 * 60 * 1000) : null;

      cartSessionsToCreate.push({
        userId,
        status: isConverted ? 'converted' : 'abandoned',
        itemCount: 1 + Math.floor(Math.random() * 3),
        totalAmount: 45 + Math.floor(Math.random() * 300),
        createdAt,
        updatedAt: convertedAt || createdAt,
        convertedAt,
      });
    }
  }

  for (const cart of cartSessionsToCreate) {
    await prisma.cartSession.create({ data: cart });
  }
  console.log(`✅ Created ${cartSessionsToCreate.length} historical cart sessions.`);

  // 6. Seed AI Conversations with Tool Calls & Agent Actions
  console.log('🤖 Seeding AI Conversations & Agent Actions...');
  const convSeeds = [
    {
      userId: 'usr_cust_01',
      daysAgo: 24,
      userPrompt: 'I need a premium noise-cancelling headphone for remote work and video calls.',
      agentResponse: 'I recommend the AcousticPro ANC Wireless Headphones. It features studio-grade hybrid active noise canceling, 40 hours of battery life, and spatial audio at $249.99.',
      tools: [{ tool: 'search_catalog', args: { query: 'noise cancelling headphones', category: 'Electronics' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_elec_01',
            productName: 'AcousticPro ANC Wireless Headphones',
            confidenceScore: 0.96,
            reason: 'Best match for hybrid ANC and long battery life for remote work.',
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_elec_01',
            quantity: 1,
            unitPrice: 249.99,
          },
        },
      ],
    },
    {
      userId: 'usr_cust_02',
      daysAgo: 21,
      userPrompt: 'Looking for a running shoe under $40 for everyday 5k training.',
      agentResponse: 'The AeroTrack Lightweight Daily Trainer is an ideal choice at $32.00. It features responsive EVA foam cushioning and breathable engineered mesh designed for 5k-10k road runs.',
      tools: [{ tool: 'search_catalog', args: { query: 'running shoes', maxPrice: 40, category: 'Apparel' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_app_09',
            productName: 'AeroTrack Lightweight Daily Trainer Running Shoes',
            confidenceScore: 0.94,
            reason: 'Budget-friendly daily running shoe under $40 with high breathability.',
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_app_09',
            quantity: 1,
            unitPrice: 32.0,
          },
        },
      ],
    },
    {
      userId: 'usr_cust_03',
      daysAgo: 18,
      userPrompt: 'Can you compare the curved monitor with the mechanical keyboard?',
      agentResponse: 'The VisionX 4K UltraWide 34" Curved Monitor ($699) provides a massive panoramic workspace with 90W USB-C PD, while the Chronos Mechanical RGB Keyboard ($139.99) delivers tactile gasket-mounted typing.',
      tools: [{ tool: 'compare_products', args: { productIds: ['prod_elec_02', 'prod_elec_04'] } }],
      actions: [
        {
          actionType: AgentActionType.compare,
          payload: {
            productIds: ['prod_elec_02', 'prod_elec_04'],
            winner: 'prod_elec_02',
            comparisonPoints: ['Productivity', 'Display Quality', 'Ergonomics'],
          },
        },
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_elec_02',
            productName: 'VisionX 4K UltraWide 34" Curved Monitor',
            confidenceScore: 0.92,
            reason: 'Top productivity upgrade for multi-window workflows.',
          },
        },
      ],
    },
    {
      userId: 'usr_cust_04',
      daysAgo: 15,
      userPrompt: 'Do you have good coffee brewing kits for morning pour-overs?',
      agentResponse: 'I recommend the Aura Minimalist Precision Coffee Scale & Pour-Over Kit ($84.00). It includes a 0.1g integrated timer scale, borosilicate carafe, and double-mesh stainless dripper.',
      tools: [{ tool: 'search_catalog', args: { query: 'coffee pour over kit', category: 'Home & Living' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_home_01',
            productName: 'Aura Minimalist Precision Coffee Scale & Pour-Over Kit',
            confidenceScore: 0.95,
            reason: 'All-in-one pour over setup with integrated precision scale.',
          },
        },
      ],
    },
    {
      userId: 'usr_cust_05',
      daysAgo: 12,
      userPrompt: 'I need muscle recovery gear after intense HIIT and gym sessions.',
      agentResponse: 'The TheraPulse Mini Deep-Tissue Massage Gun ($129.00) delivers 3200 RPM percussive therapy in a pocket-sized aircraft aluminum chassis.',
      tools: [{ tool: 'search_catalog', args: { query: 'muscle recovery massage', category: 'Fitness & Wellness' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_fit_01',
            productName: 'TheraPulse Mini Deep-Tissue Massage Gun',
            confidenceScore: 0.98,
            reason: 'Ultra-portable percussive therapy for quick muscle relief.',
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_fit_01',
            quantity: 1,
            unitPrice: 129.0,
          },
        },
      ],
    },
    {
      userId: 'usr_cust_06',
      daysAgo: 10,
      userPrompt: 'Suggest warm winter clothing essentials for cold weather travel.',
      agentResponse: 'I recommend pairing the Merino Wool Climate Knit Crewneck ($128.00) with the Nordic Heritage Cashmere Ribbed Beanie ($49.00) for lightweight thermal regulation.',
      tools: [{ tool: 'search_catalog', args: { query: 'wool cashmere warmth', category: 'Apparel' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_app_01',
            productName: 'Merino Wool Climate Knit Crewneck',
            confidenceScore: 0.93,
            reason: 'Finest 18.5 micron temperature-regulating Merino wool.',
          },
        },
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_app_06',
            productName: 'Nordic Heritage Cashmere Ribbed Beanie',
            confidenceScore: 0.91,
            reason: 'Mongolian Grade-A cashmere for lightweight warmth.',
          },
        },
      ],
    },
    {
      userId: 'usr_cust_07',
      daysAgo: 8,
      userPrompt: 'Recommend an air purifier for allergy relief in the bedroom.',
      agentResponse: 'The PureBreeze HEPA H13 Air Purifier ($169.00) features medical-grade 3-stage filtration capturing 99.97% of airborne particles down to 0.1 microns with real-time PM2.5 sensing.',
      tools: [{ tool: 'search_catalog', args: { query: 'HEPA air purifier', category: 'Home & Living' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_home_05',
            productName: 'PureBreeze HEPA H13 Air Purifier with PM2.5 Sensor',
            confidenceScore: 0.97,
            reason: 'Medical-grade H13 filtration with silent night mode.',
          },
        },
      ],
    },
    {
      userId: 'usr_cust_08',
      daysAgo: 6,
      userPrompt: 'What is the best mechanical keyboard for typing and gaming?',
      agentResponse: 'The Chronos Mechanical RGB Keyboard ($139.99) is highly recommended. It offers hot-swappable sockets, factory-lubed linear switches, sound-dampening silicone, and a solid CNC aluminum knob.',
      tools: [{ tool: 'search_catalog', args: { query: 'mechanical keyboard rgb', category: 'Electronics' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_elec_04',
            productName: 'Chronos Mechanical RGB Keyboard (Hot-Swap)',
            confidenceScore: 0.95,
            reason: 'Exceptional acoustics and customizability for enthusiasts.',
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_elec_04',
            quantity: 1,
            unitPrice: 139.99,
          },
        },
      ],
    },
    {
      userId: 'usr_cust_09',
      daysAgo: 4,
      userPrompt: 'I need a fast carbon-plated shoe for half-marathon race day.',
      agentResponse: 'The CloudStrider Carbon-Plated Running Shoes ($185.00) feature supercritical PEBA foam and a stiff full-length carbon propulsion plate designed for maximal race day energy return.',
      tools: [{ tool: 'search_catalog', args: { query: 'carbon running shoes marathon', category: 'Apparel' } }],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_app_03',
            productName: 'CloudStrider Carbon-Plated Running Shoes',
            confidenceScore: 0.99,
            reason: 'Curved carbon fiber plate with explosive energy return.',
          },
        },
      ],
    },
    {
      userId: 'usr_cust_10',
      daysAgo: 2,
      userPrompt: 'Can you add the AcousticPro headphones and charging hub to my cart?',
      agentResponse: 'I have added the AcousticPro ANC Wireless Headphones ($249.99) and PulseFlow MagSafe 3-in-1 Charging Hub ($89.50) to your cart. Total: $339.49.',
      tools: [
        { tool: 'add_to_cart', args: { productId: 'prod_elec_01', quantity: 1 } },
        { tool: 'add_to_cart', args: { productId: 'prod_elec_03', quantity: 1 } },
      ],
      actions: [
        {
          actionType: AgentActionType.recommend,
          payload: {
            productId: 'prod_elec_01',
            productName: 'AcousticPro ANC Wireless Headphones',
            confidenceScore: 0.95,
            reason: 'Direct user addition via voice/chat.',
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_elec_01',
            quantity: 1,
            unitPrice: 249.99,
          },
        },
        {
          actionType: AgentActionType.add_to_cart,
          payload: {
            productId: 'prod_elec_03',
            quantity: 1,
            unitPrice: 89.5,
          },
        },
      ],
    },
  ];

  for (const c of convSeeds) {
    const createdAt = getPastDate(c.daysAgo, 14);
    await prisma.conversation.create({
      data: {
        userId: c.userId,
        createdAt,
        updatedAt: createdAt,
        messages: {
          create: [
            {
              role: MessageRole.user,
              content: c.userPrompt,
              createdAt: new Date(createdAt.getTime() - 2 * 60 * 1000),
            },
            {
              role: MessageRole.agent,
              content: c.agentResponse,
              toolCalls: JSON.stringify(c.tools),
              createdAt,
            },
          ],
        },
        actions: {
          create: c.actions.map((act) => ({
            actionType: act.actionType,
            payload: JSON.stringify(act.payload),
            createdAt,
          })),
        },
      },
    });
  }
  console.log(`✅ Created ${convSeeds.length} AI conversations with tool calls & agent actions.`);

  // 7. Seed 24 Historical Orders (Spread across 30 days)
  // Split into Agent-Assisted and Self-Service for precise analytics computation
  console.log('💳 Seeding historical Orders (Paid, Pending, Failed)...');
  const ordersData = [
    // --- Agent-Assisted Paid Orders (Products matched AgentAction recommend or add_to_cart) ---
    {
      id: 'ord_hist_01',
      userId: 'usr_cust_01', // Converted AcousticPro from conv
      daysAgo: 23,
      status: OrderStatus.paid,
      totalAmount: 377.99,
      razorpayOrderId: 'order_test_pay_01',
      items: [
        { productId: 'prod_elec_01', quantity: 1, priceAtPurchase: 249.99 },
        { productId: 'prod_app_01', quantity: 1, priceAtPurchase: 128.0 },
      ],
    },
    {
      id: 'ord_hist_02',
      userId: 'usr_cust_02', // Converted AeroTrack runner from conv
      daysAgo: 20,
      status: OrderStatus.paid,
      totalAmount: 32.0,
      razorpayOrderId: 'order_test_pay_02',
      items: [
        { productId: 'prod_app_09', quantity: 1, priceAtPurchase: 32.0 },
      ],
    },
    {
      id: 'ord_hist_03',
      userId: 'usr_cust_03', // Converted VisionX monitor from conv
      daysAgo: 17,
      status: OrderStatus.paid,
      totalAmount: 699.0,
      razorpayOrderId: 'order_test_pay_03',
      items: [
        { productId: 'prod_elec_02', quantity: 1, priceAtPurchase: 699.0 },
      ],
    },
    {
      id: 'ord_hist_04',
      userId: 'usr_cust_05', // Converted TheraPulse from conv
      daysAgo: 11,
      status: OrderStatus.paid,
      totalAmount: 188.99,
      razorpayOrderId: 'order_test_pay_04',
      items: [
        { productId: 'prod_fit_01', quantity: 1, priceAtPurchase: 129.0 },
        { productId: 'prod_fit_03', quantity: 1, priceAtPurchase: 59.99 },
      ],
    },
    {
      id: 'ord_hist_05',
      userId: 'usr_cust_08', // Converted Chronos Keyboard from conv
      daysAgo: 5,
      status: OrderStatus.paid,
      totalAmount: 139.99,
      razorpayOrderId: 'order_test_pay_05',
      items: [
        { productId: 'prod_elec_04', quantity: 1, priceAtPurchase: 139.99 },
      ],
    },
    {
      id: 'ord_hist_06',
      userId: 'usr_cust_10', // Converted AcousticPro & MagSafe from conv
      daysAgo: 1,
      status: OrderStatus.paid,
      totalAmount: 339.49,
      razorpayOrderId: 'order_test_pay_06',
      items: [
        { productId: 'prod_elec_01', quantity: 1, priceAtPurchase: 249.99 },
        { productId: 'prod_elec_03', quantity: 1, priceAtPurchase: 89.5 },
      ],
    },
    {
      id: 'ord_hist_07',
      userId: 'usr_cust_06', // Converted Merino Knit from conv
      daysAgo: 9,
      status: OrderStatus.paid,
      totalAmount: 177.0,
      razorpayOrderId: 'order_test_pay_07',
      items: [
        { productId: 'prod_app_01', quantity: 1, priceAtPurchase: 128.0 },
        { productId: 'prod_app_06', quantity: 1, priceAtPurchase: 49.0 },
      ],
    },
    {
      id: 'ord_hist_08',
      userId: 'usr_cust_09', // Converted CloudStrider from conv
      daysAgo: 3,
      status: OrderStatus.paid,
      totalAmount: 185.0,
      razorpayOrderId: 'order_test_pay_08',
      items: [
        { productId: 'prod_app_03', quantity: 1, priceAtPurchase: 185.0 },
      ],
    },

    // --- Self-Service Paid Orders (Direct browse & buy, no agent action match) ---
    {
      id: 'ord_hist_09',
      userId: 'usr_cust_11',
      daysAgo: 28,
      status: OrderStatus.paid,
      totalAmount: 215.0,
      razorpayOrderId: 'order_test_pay_09',
      items: [
        { productId: 'prod_app_02', quantity: 1, priceAtPurchase: 215.0 },
      ],
    },
    {
      id: 'ord_hist_10',
      userId: 'usr_cust_12',
      daysAgo: 25,
      status: OrderStatus.paid,
      totalAmount: 169.0,
      razorpayOrderId: 'order_test_pay_10',
      items: [
        { productId: 'prod_home_05', quantity: 1, priceAtPurchase: 169.0 },
      ],
    },
    {
      id: 'ord_hist_11',
      userId: 'usr_cust_13',
      daysAgo: 22,
      status: OrderStatus.paid,
      totalAmount: 159.0,
      razorpayOrderId: 'order_test_pay_11',
      items: [
        { productId: 'prod_app_07', quantity: 1, priceAtPurchase: 159.0 },
      ],
    },
    {
      id: 'ord_hist_12',
      userId: 'usr_cust_14',
      daysAgo: 19,
      status: OrderStatus.paid,
      totalAmount: 110.0,
      razorpayOrderId: 'order_test_pay_12',
      items: [
        { productId: 'prod_home_02', quantity: 1, priceAtPurchase: 110.0 },
      ],
    },
    {
      id: 'ord_hist_13',
      userId: 'usr_cust_15',
      daysAgo: 16,
      status: OrderStatus.paid,
      totalAmount: 179.99,
      razorpayOrderId: 'order_test_pay_13',
      items: [
        { productId: 'prod_elec_06', quantity: 1, priceAtPurchase: 179.99 },
      ],
    },
    {
      id: 'ord_hist_14',
      userId: 'usr_cust_16',
      daysAgo: 14,
      status: OrderStatus.paid,
      totalAmount: 195.0,
      razorpayOrderId: 'order_test_pay_14',
      items: [
        { productId: 'prod_home_07', quantity: 1, priceAtPurchase: 195.0 },
      ],
    },
    {
      id: 'ord_hist_15',
      userId: 'usr_cust_11',
      daysAgo: 10,
      status: OrderStatus.paid,
      totalAmount: 78.0,
      razorpayOrderId: 'order_test_pay_15',
      items: [
        { productId: 'prod_fit_02', quantity: 1, priceAtPurchase: 78.0 },
      ],
    },
    {
      id: 'ord_hist_16',
      userId: 'usr_cust_12',
      daysAgo: 7,
      status: OrderStatus.paid,
      totalAmount: 119.0,
      razorpayOrderId: 'order_test_pay_16',
      items: [
        { productId: 'prod_elec_05', quantity: 1, priceAtPurchase: 119.0 },
      ],
    },
    {
      id: 'ord_hist_17',
      userId: 'usr_cust_13',
      daysAgo: 4,
      status: OrderStatus.paid,
      totalAmount: 79.95,
      razorpayOrderId: 'order_test_pay_17',
      items: [
        { productId: 'prod_elec_07', quantity: 1, priceAtPurchase: 79.95 },
      ],
    },
    {
      id: 'ord_hist_18',
      userId: 'usr_cust_14',
      daysAgo: 2,
      status: OrderStatus.paid,
      totalAmount: 94.0,
      razorpayOrderId: 'order_test_pay_18',
      items: [
        { productId: 'prod_app_05', quantity: 1, priceAtPurchase: 94.0 },
      ],
    },

    // --- Pending Orders ---
    {
      id: 'ord_hist_19',
      userId: 'usr_cust_04',
      daysAgo: 1,
      status: OrderStatus.pending,
      totalAmount: 84.0,
      razorpayOrderId: 'order_test_pend_19',
      items: [
        { productId: 'prod_home_01', quantity: 1, priceAtPurchase: 84.0 },
      ],
    },
    {
      id: 'ord_hist_20',
      userId: 'usr_cust_07',
      daysAgo: 0,
      status: OrderStatus.pending,
      totalAmount: 169.0,
      razorpayOrderId: 'order_test_pend_20',
      items: [
        { productId: 'prod_home_05', quantity: 1, priceAtPurchase: 169.0 },
      ],
    },

    // --- Failed Orders ---
    {
      id: 'ord_hist_21',
      userId: 'usr_cust_15',
      daysAgo: 13,
      status: OrderStatus.failed,
      totalAmount: 249.99,
      razorpayOrderId: 'order_test_fail_21',
      items: [
        { productId: 'prod_elec_01', quantity: 1, priceAtPurchase: 249.99 },
      ],
    },
    {
      id: 'ord_hist_22',
      userId: 'usr_cust_16',
      daysAgo: 8,
      status: OrderStatus.failed,
      totalAmount: 185.0,
      razorpayOrderId: 'order_test_fail_22',
      items: [
        { productId: 'prod_app_03', quantity: 1, priceAtPurchase: 185.0 },
      ],
    },
  ];

  for (const o of ordersData) {
    const { items, daysAgo, ...orderInfo } = o;
    const createdAt = getPastDate(daysAgo, 15);
    await prisma.order.create({
      data: {
        ...orderInfo,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: items,
        },
      },
    });
  }
  console.log(`✅ Created ${ordersData.length} historical orders with precise timestamps.`);

  // 8. Seed sample live cart items
  await prisma.cartItem.createMany({
    data: [
      { userId: 'usr_cust_01', productId: 'prod_elec_04', quantity: 1 },
      { userId: 'usr_cust_01', productId: 'prod_app_06', quantity: 2 },
      { userId: 'usr_cust_02', productId: 'prod_home_03', quantity: 1 },
      { userId: 'usr_cust_03', productId: 'prod_fit_03', quantity: 1 },
    ],
  });
  console.log('✅ Created active live cart items for demo users.');

  console.log('✨ Comprehensive database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
