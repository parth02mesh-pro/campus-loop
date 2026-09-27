import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding Campus Loop database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin@123', 12);
  const [admin] = await db.insert(schema.users).values({
    email: 'admin@gmail.com',
    phone: '9999999999',
    passwordHash: adminPassword,
    role: 'admin',
    isEmailVerified: true,
    isPhoneVerified: true,
  }).returning();

  await db.insert(schema.userProfiles).values({
    userId: admin.id,
    fullName: 'Super Admin',
    bio: 'Platform administrator',
  });

  // Create sample users
  const sampleUsers = [
    { email: 'arjun@campusloop.in', phone: '9876543210', name: 'Arjun Sharma' },
    { email: 'priya@campusloop.in', phone: '9876543211', name: 'Priya Patel' },
    { email: 'rahul@campusloop.in', phone: '9876543212', name: 'Rahul Kumar' },
    { email: 'ananya@campusloop.in', phone: '9876543213', name: 'Ananya Singh' },
  ];

  const createdUsers = [];
  for (const u of sampleUsers) {
    const password = await bcrypt.hash('Student@123', 12);
    const [user] = await db.insert(schema.users).values({
      email: u.email,
      phone: u.phone,
      passwordHash: password,
      role: 'user',
      isEmailVerified: true,
      isPhoneVerified: true,
    }).returning();
    createdUsers.push(user);
  }

  // Create institutions
  const institutionsData = [
    { name: 'Indian Institute of Technology Delhi', type: 'university', city: 'New Delhi', state: 'Delhi' },
    { name: 'National Institute of Technology Trichy', type: 'university', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
    { name: 'BITS Pilani', type: 'university', city: 'Pilani', state: 'Rajasthan' },
    { name: 'Delhi Public School', type: 'school', city: 'New Delhi', state: 'Delhi' },
  ];

  const createdInstitutions = [];
  for (const inst of institutionsData) {
    const [institution] = await db.insert(schema.institutions).values({
      ...inst,
      isActive: true,
      isVerified: true,
    }).returning();
    createdInstitutions.push(institution);
  }

  // Create campuses
  const campusesData = [
    { institutionId: createdInstitutions[0].id, name: 'IIT Delhi Main Campus', city: 'New Delhi', state: 'Delhi' },
    { institutionId: createdInstitutions[1].id, name: 'NIT Trichy Main Campus', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
    { institutionId: createdInstitutions[2].id, name: 'BITS Pilani Main Campus', city: 'Pilani', state: 'Rajasthan' },
    { institutionId: createdInstitutions[3].id, name: 'DPS R.K. Puram', city: 'New Delhi', state: 'Delhi' },
  ];

  const createdCampuses = [];
  for (const campus of campusesData) {
    const [c] = await db.insert(schema.campuses).values({
      ...campus,
      isActive: true,
      isVerified: true,
    }).returning();
    createdCampuses.push(c);
  }

  // Create departments
  const departmentsData = [
    { campusId: createdCampuses[0].id, name: 'Computer Science & Engineering', code: 'CSE' },
    { campusId: createdCampuses[0].id, name: 'Electrical Engineering', code: 'EE' },
    { campusId: createdCampuses[0].id, name: 'Mechanical Engineering', code: 'ME' },
    { campusId: createdCampuses[1].id, name: 'Computer Science', code: 'CS' },
    { campusId: createdCampuses[2].id, name: 'Information Technology', code: 'IT' },
  ];

  const createdDepartments = [];
  for (const dept of departmentsData) {
    const [d] = await db.insert(schema.departments).values({
      ...dept,
      isActive: true,
    }).returning();
    createdDepartments.push(d);
  }

  // Create courses
  const coursesData = [
    { departmentId: createdDepartments[0].id, name: 'B.Tech Computer Science', code: 'BTCS', duration: 4 },
    { departmentId: createdDepartments[0].id, name: 'M.Tech Computer Science', code: 'MTCS', duration: 2 },
    { departmentId: createdDepartments[1].id, name: 'B.Tech Electrical', code: 'BTEE', duration: 4 },
    { departmentId: createdDepartments[3].id, name: 'B.Tech CS', code: 'BTCS', duration: 4 },
  ];

  const createdCourses = [];
  for (const course of coursesData) {
    const [c] = await db.insert(schema.courses).values({
      ...course,
      isActive: true,
    }).returning();
    createdCourses.push(c);
  }

  // Update user profiles with campus info
  await db.update(schema.userProfiles).set({
    campusId: createdCampuses[0].id,
    courseId: createdCourses[0].id,
    departmentId: createdDepartments[0].id,
    year: 3,
    semester: 6,
    rating: '4.5',
    totalRatings: 12,
  }).where(eq(schema.userProfiles.userId, createdUsers[0].id));

  await db.insert(schema.userProfiles).values([
    {
      userId: createdUsers[1].id,
      fullName: 'Priya Patel',
      campusId: createdCampuses[0].id,
      courseId: createdCourses[0].id,
      departmentId: createdDepartments[0].id,
      year: 2,
      semester: 4,
      rating: '4.8',
      totalRatings: 8,
    },
    {
      userId: createdUsers[2].id,
      fullName: 'Rahul Kumar',
      campusId: createdCampuses[1].id,
      courseId: createdCourses[3].id,
      departmentId: createdDepartments[3].id,
      year: 4,
      semester: 8,
      rating: '4.3',
      totalRatings: 15,
    },
    {
      userId: createdUsers[3].id,
      fullName: 'Ananya Singh',
      campusId: createdCampuses[2].id,
      year: 1,
      semester: 2,
      rating: '4.9',
      totalRatings: 5,
    },
  ]);

  // Create categories
  const categoriesData = [
    { name: 'Books', slug: 'books', icon: '📚', description: 'Textbooks, novels, and reference books' },
    { name: 'Stationery', slug: 'stationery', icon: '✏️', description: 'Pens, notebooks, and supplies' },
    { name: 'Electronics', slug: 'electronics', icon: '💻', description: 'Laptops, calculators, gadgets' },
    { name: 'Student Essentials', slug: 'essentials', icon: '🎒', description: 'Backpacks, water bottles, daily items' },
    { name: 'Rent', slug: 'rent', icon: '🔄', description: 'Rent items temporarily' },
    { name: 'Exchange', slug: 'exchange', icon: '♻️', description: 'Swap items with others' },
    { name: 'Free', slug: 'free', icon: '🎁', description: 'Give away items for free' },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    const [c] = await db.insert(schema.categories).values({
      ...cat,
      isActive: true,
      sortOrder: categoriesData.indexOf(cat),
    }).returning();
    createdCategories.push(c);
  }

  // Create subcategories
  const subcategoriesData = [
    { categoryId: createdCategories[0].id, name: 'Engineering Books', slug: 'engineering-books' },
    { categoryId: createdCategories[0].id, name: 'Medical Books', slug: 'medical-books' },
    { categoryId: createdCategories[0].id, name: 'Commerce Books', slug: 'commerce-books' },
    { categoryId: createdCategories[0].id, name: 'Novels & Fiction', slug: 'novels' },
    { categoryId: createdCategories[1].id, name: 'Notebooks', slug: 'notebooks' },
    { categoryId: createdCategories[1].id, name: 'Pens & Pencils', slug: 'pens-pencils' },
    { categoryId: createdCategories[1].id, name: 'Art Supplies', slug: 'art-supplies' },
    { categoryId: createdCategories[2].id, name: 'Laptops', slug: 'laptops' },
    { categoryId: createdCategories[2].id, name: 'Calculators', slug: 'calculators' },
    { categoryId: createdCategories[2].id, name: 'Mobile Phones', slug: 'mobile-phones' },
    { categoryId: createdCategories[2].id, name: 'Headphones', slug: 'headphones' },
    { categoryId: createdCategories[3].id, name: 'Backpacks', slug: 'backpacks' },
    { categoryId: createdCategories[3].id, name: 'Water Bottles', slug: 'water-bottles' },
    { categoryId: createdCategories[3].id, name: 'Lunch Boxes', slug: 'lunch-boxes' },
  ];

  for (const sub of subcategoriesData) {
    await db.insert(schema.subcategories).values({
      ...sub,
      isActive: true,
    });
  }

  // Create sample products
  const productsData = [
    {
      sellerId: createdUsers[0].id,
      categoryId: createdCategories[0].id,
      campusId: createdCampuses[0].id,
      title: 'Introduction to Algorithms - CLRS 4th Edition',
      description: 'Classic algorithms textbook in excellent condition. Perfect for CSE students preparing for interviews and competitive programming.',
      author: 'Thomas H. Cormen',
      edition: '4th',
      course: 'Data Structures & Algorithms',
      department: 'CSE',
      semester: 3,
      condition: 'very_good' as const,
      listingType: 'sell' as const,
      price: '899',
    },
    {
      sellerId: createdUsers[1].id,
      categoryId: createdCategories[2].id,
      campusId: createdCampuses[0].id,
      title: 'Casio fx-991EX Scientific Calculator',
      description: 'Advanced scientific calculator with 552 functions. ClassWiz series. Barely used, comes with original case.',
      brand: 'Casio',
      condition: 'like_new',
      listingType: 'sell',
      price: '1299',
    },
    {
      sellerId: createdUsers[0].id,
      categoryId: createdCategories[2].id,
      campusId: createdCampuses[0].id,
      title: 'HP Pavilion Laptop 15 - i5 11th Gen',
      description: '8GB RAM, 512GB SSD, Intel Iris Xe Graphics. 1 year old, excellent battery life. Comes with charger and laptop bag.',
      brand: 'HP',
      condition: 'good',
      listingType: 'sell',
      price: '35000',
    },
    {
      sellerId: createdUsers[2].id,
      categoryId: createdCategories[3].id,
      campusId: createdCampuses[1].id,
      title: 'American Tourister Backpack 35L',
      description: 'Spacious backpack with laptop compartment. Water-resistant material. Used for 1 semester only.',
      brand: 'American Tourister',
      condition: 'very_good',
      listingType: 'sell',
      price: '899',
    },
    {
      sellerId: createdUsers[1].id,
      categoryId: createdCategories[0].id,
      campusId: createdCampuses[0].id,
      title: 'Database System Concepts - Silberschatz',
      description: '6th edition, perfect for DBMS course. Includes solved examples and practice problems.',
      author: 'Abraham Silberschatz',
      edition: '6th',
      course: 'Database Management Systems',
      semester: 4,
      condition: 'good',
      listingType: 'sell',
      price: '599',
    },
    {
      sellerId: createdUsers[0].id,
      categoryId: createdCategories[1].id,
      campusId: createdCampuses[0].id,
      title: 'Classmate Notebook Pack (6 notebooks)',
      description: 'Brand new pack of 6 single-ruled notebooks. 200 pages each. Great for semester notes.',
      brand: 'Classmate',
      condition: 'new',
      listingType: 'sell',
      price: '299',
    },
    {
      sellerId: createdUsers[3].id,
      categoryId: createdCategories[2].id,
      campusId: createdCampuses[2].id,
      title: 'Sony WH-1000XM4 Headphones',
      description: 'Premium noise-cancelling headphones. Excellent sound quality. Comes with original box and accessories.',
      brand: 'Sony',
      condition: 'like_new',
      listingType: 'sell',
      price: '18000',
    },
    {
      sellerId: createdUsers[2].id,
      categoryId: createdCategories[0].id,
      campusId: createdCampuses[1].id,
      title: 'Operating System Concepts - Dinosaur Book',
      description: '10th edition by Silberschatz. Essential for OS course. Some highlighting but overall good condition.',
      author: 'Silberschatz, Galvin, Gagne',
      edition: '10th',
      course: 'Operating Systems',
      semester: 5,
      condition: 'good',
      listingType: 'rent',
      rentalPriceDaily: '20',
      rentalPriceWeekly: '100',
      rentalPriceMonthly: '350',
      rentalPriceSemester: '800',
      rentalDeposit: '500',
    },
    {
      sellerId: createdUsers[1].id,
      categoryId: createdCategories[0].id,
      campusId: createdCampuses[0].id,
      title: 'Computer Networks - Tanenbaum',
      description: '5th edition. Want to exchange with Computer Architecture book. Both books are standard textbooks.',
      author: 'Andrew S. Tanenbaum',
      edition: '5th',
      course: 'Computer Networks',
      semester: 6,
      condition: 'very_good',
      listingType: 'exchange',
    },
    {
      sellerId: createdUsers[0].id,
      categoryId: createdCategories[1].id,
      campusId: createdCampuses[0].id,
      title: 'Stationery Kit - Pens, Pencils, Erasers',
      description: 'Unused stationery kit. Moving out and giving away for free to anyone who needs it.',
      condition: 'new',
      listingType: 'free',
      price: '0',
    },
  ];

  const createdProducts = [];
  for (const product of productsData) {
    const [p] = await db.insert(schema.products).values({
      ...product,
      isAvailable: true,
      status: 'active' as const,
      viewCount: Math.floor(Math.random() * 100),
    } as any).returning();
    createdProducts.push(p);
  }

  // Create sample reviews
  await db.insert(schema.reviews).values([
    {
      reviewerId: createdUsers[1].id,
      revieweeId: createdUsers[0].id,
      rating: 5,
      comment: 'Great seller! Book was exactly as described.',
    },
    {
      reviewerId: createdUsers[2].id,
      revieweeId: createdUsers[1].id,
      rating: 4,
      comment: 'Good experience, fast delivery.',
    },
    {
      reviewerId: createdUsers[3].id,
      revieweeId: createdUsers[0].id,
      rating: 5,
      comment: 'Excellent condition, very cooperative seller.',
    },
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('');
  console.log('📧 Admin Login:');
  console.log('   Email: admin@gmail.com');
  console.log('   Password: admin@123');
  console.log('');
  console.log('👤 Sample User Login:');
  console.log('   Email: arjun@campusloop.in');
  console.log('   Password: Student@123');
  console.log('');

  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
