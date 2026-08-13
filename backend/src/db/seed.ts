/* eslint-disable no-console */
import { CouponType, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Deterministic pseudo-random so seed output is stable across runs (no Math.random).
function pseudo(n: number, mod: number): number {
  return Math.abs(Math.sin(n + 1) * 10000) % mod;
}

/**
 * Idempotent seed. Safe to call repeatedly — every write is an upsert.
 * Shared by the `npm run seed` CLI script and the auto-seed-on-boot path.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding Beauty Center...');

  // ── Admin + demo customer ──
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const customerPassword = await bcrypt.hash('Customer@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@beautycenter.com' },
    update: {},
    create: {
      email: 'admin@beautycenter.com',
      password: adminPassword,
      firstName: 'Beauty',
      lastName: 'Admin',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@beautycenter.com' },
    update: {},
    create: {
      email: 'customer@beautycenter.com',
      password: customerPassword,
      firstName: 'Layla',
      lastName: 'Hassan',
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  });

  // ── Categories ──
  const categoryData = [
    { name: 'Skincare', nameAr: 'العناية بالبشرة', icon: 'sparkles', isFeatured: true },
    { name: 'Makeup', nameAr: 'مكياج', icon: 'palette', isFeatured: true },
    { name: 'Fragrance', nameAr: 'عطور', icon: 'flower', isFeatured: true },
    { name: 'Hair Care', nameAr: 'العناية بالشعر', icon: 'scissors', isFeatured: true },
    { name: 'Body & Bath', nameAr: 'الجسم والاستحمام', icon: 'droplet', isFeatured: false },
    { name: 'Tools & Accessories', nameAr: 'أدوات وإكسسوارات', icon: 'wand', isFeatured: false },
  ];
  const categories = [];
  for (const [i, c] of categoryData.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name), sortOrder: i },
    });
    categories.push(cat);
  }

  // ── Brands ──
  const brandData = ['Lumière', 'Rose & Co', 'Velvet Bloom', 'Aurora Beauty', 'Élégance'];
  const brands = [];
  for (const name of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    brands.push(brand);
  }

  // ── Products ──
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;
  const productData = [
    { name: 'Radiance Vitamin C Serum', nameAr: 'سيروم فيتامين سي المشرق', cat: 0, price: 48, sale: 39, featured: true },
    { name: 'Hydra Glow Moisturizer', nameAr: 'مرطب هيدرا جلو', cat: 0, price: 36, featured: true },
    { name: 'Silk Matte Lipstick', nameAr: 'أحمر شفاه مطفي حريري', cat: 1, price: 24, sale: 19, featured: true },
    { name: 'Velvet Foundation SPF30', nameAr: 'كريم أساس فيلفيت SPF30', cat: 1, price: 42, featured: false },
    { name: 'Rose Petal Eau de Parfum', nameAr: 'عطر بتلات الورد', cat: 2, price: 89, sale: 72, featured: true },
    { name: 'Midnight Oud Perfume', nameAr: 'عطر عود منتصف الليل', cat: 2, price: 120, featured: true },
    { name: 'Argan Repair Hair Mask', nameAr: 'ماسك الأرجان لإصلاح الشعر', cat: 3, price: 32, featured: false },
    { name: 'Keratin Smooth Shampoo', nameAr: 'شامبو الكيراتين الناعم', cat: 3, price: 28, featured: false },
    { name: 'Lavender Body Butter', nameAr: 'زبدة الجسم باللافندر', cat: 4, price: 26, sale: 21, featured: true },
    { name: 'Exfoliating Sugar Scrub', nameAr: 'مقشر السكر للبشرة', cat: 4, price: 22, featured: false },
    { name: 'Pro Makeup Brush Set', nameAr: 'طقم فرش مكياج احترافي', cat: 5, price: 55, sale: 44, featured: true },
    { name: 'Jade Facial Roller', nameAr: 'رولر اليشم للوجه', cat: 5, price: 18, featured: false },
  ];

  for (const [i, p] of productData.entries()) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        nameAr: p.nameAr,
        slug,
        description: `${p.name} — a luxurious formula crafted for radiant, healthy beauty. Dermatologically tested and cruelty-free.`,
        descriptionAr: `${p.nameAr} — تركيبة فاخرة لجمال مشرق وصحي. تم اختبارها من قبل أطباء الجلد وخالية من القسوة على الحيوانات.`,
        sku: `BC-${String(1000 + i)}`,
        price: p.price,
        salePrice: p.sale ?? null,
        stock: 25 + i * 3,
        thumbnail: img(slug),
        isFeatured: p.featured,
        categoryId: categories[p.cat].id,
        brandId: brands[i % brands.length].id,
        soldCount: Math.floor(pseudo(i, 50)),
        ratingAvg: 4 + pseudo(i, 1),
        ratingCount: Math.floor(pseudo(i, 40)) + 5,
        images: {
          create: [
            { url: img(slug), sortOrder: 0 },
            { url: img(`${slug}-2`), sortOrder: 1 },
            { url: img(`${slug}-3`), sortOrder: 2 },
          ],
        },
      },
    });
  }

  // ── Coupons ──
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: CouponType.PERCENTAGE, value: 10, minPurchase: 30, perUserLimit: 1 },
  });
  await prisma.coupon.upsert({
    where: { code: 'BEAUTY20' },
    update: {},
    create: {
      code: 'BEAUTY20',
      type: CouponType.FIXED,
      value: 20,
      minPurchase: 80,
      usageLimit: 100,
      perUserLimit: 2,
    },
  });

  console.log(`✅ Seed complete. Admin: ${admin.email} / Admin@12345`);
}
