export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  thumbnail: string | null;
  images: ProductImage[];
  category: Category | null;
  brand: Brand | null;
  tags: Tag[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  isFeatured: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  image: string | null;
  icon: string | null;
  isFeatured: boolean;
  parentId: string | null;
  children?: Category[];
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  _count?: { products: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'salePrice' | 'thumbnail' | 'stock' | 'sku'>;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'salePrice' | 'thumbnail'>;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  building: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  couponCode: string | null;
  notes: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingCountry: string;
  shippingCity: string;
  shippingStreet: string;
  createdAt: string;
  items: OrderItem[];
  history: OrderHistory[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  productImage: string | null;
}

export interface OrderHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'thumbnail'>;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchase: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  expiresAt: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
