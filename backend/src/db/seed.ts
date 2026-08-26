import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })
dotenv.config()

import { query, execute } from '../lib/db'
import { hashPassword } from '../utils/password'

async function seed() {
  console.log('🌱 Seeding database...')

  // Clear tables in safe dependency order (DELETE is safer than TRUNCATE on TiDB Cloud)
  console.log('🧹 Clearing existing data...')
  await execute('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of [
    'activity_logs', 'appointments', 'saved_properties', 'messages',
    'testimonials', 'properties', 'users', 'locations',
    'categories', 'settings', 'media_files',
  ]) {
    await execute(`DELETE FROM \`${table}\``)
  }
  await execute('SET FOREIGN_KEY_CHECKS = 1')

  // Categories
  console.log('📁 Creating categories...')
  const catIds = { apartment: uuidv4(), house: uuidv4(), villa: uuidv4(), commercial: uuidv4() }
  await execute(
    'INSERT INTO categories (id, name, slug, description, icon) VALUES (?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?)',
    [
      catIds.apartment, 'Apartment',  'apartment',  'Modern apartments in prime locations',   '🏢',
      catIds.house,     'House',      'house',      'Beautiful houses with spacious yards',   '🏡',
      catIds.villa,     'Villa',      'villa',      'Luxurious villas with premium amenities','🏰',
      catIds.commercial,'Commercial', 'commercial', 'Commercial spaces for businesses',        '🏬',
    ]
  )

  // Locations
  console.log('📍 Creating locations...')
  const locIds = { downtown: uuidv4(), suburbs: uuidv4(), beachfront: uuidv4() }
  await execute(
    'INSERT INTO locations (id, name, slug, description, image) VALUES (?,?,?,?,?),(?,?,?,?,?),(?,?,?,?,?)',
    [
      locIds.downtown,  'Downtown',  'downtown',  'Heart of the city with urban lifestyle',  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400',
      locIds.suburbs,   'Suburbs',   'suburbs',   'Peaceful suburban neighborhoods',          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      locIds.beachfront,'Beachfront','beachfront','Stunning waterfront properties',            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    ]
  )

  // Users
  console.log('👤 Creating users...')
  const adminId = uuidv4()
  const user1Id = uuidv4()
  const user2Id = uuidv4()

  const adminPass = await hashPassword('Admin@123')
  const userPass  = await hashPassword('User@123')

  await execute(
    'INSERT INTO users (id, email, password, first_name, last_name, role, phone) VALUES (?,?,?,?,?,?,?),(?,?,?,?,?,?,?),(?,?,?,?,?,?,?)',
    [
      adminId, 'admin@arsarealestate.com', adminPass, 'Admin',   'User',    'ADMIN', '+1 (555) 000-0000',
      user1Id, 'buyer1@example.com',       userPass,  'Alice',   'Johnson', 'USER',  '+1 (555) 111-1111',
      user2Id, 'buyer2@example.com',       userPass,  'Bob',     'Smith',   'USER',  '+1 (555) 222-2222',
    ]
  )

  // Properties
  console.log('🏠 Creating properties...')
  const prop1Id = uuidv4()
  const prop2Id = uuidv4()
  const prop3Id = uuidv4()

  await execute(
    `INSERT INTO properties
      (id, title, description, price, type, status, address, city, state, zip_code, country,
       bedrooms, bathrooms, square_feet, year_built, category_id, location_id, owner_id,
       thumbnail, images, featured)
     VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?),
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?),
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      prop1Id,
      'Luxury Penthouse in Downtown',
      'Beautiful 3-bedroom penthouse with panoramic city views, modern kitchen, and high-end finishes.',
      950000, 'APARTMENT', 'AVAILABLE', '123 Main Street', 'Downtown', 'CA', '90210', 'USA',
      3, 3, 2800, 2022, catIds.apartment, locIds.downtown, adminId,
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']),
      1,

      prop2Id,
      'Cozy Family Home',
      'Perfect family home with 4 bedrooms, spacious backyard, and top-rated schools nearby.',
      550000, 'HOUSE', 'AVAILABLE', '456 Oak Avenue', 'Suburbs', 'CA', '90211', 'USA',
      4, 2, 2200, 2015, catIds.house, locIds.suburbs, adminId,
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']),
      1,

      prop3Id,
      'Beachfront Villa',
      'Stunning beachfront villa with direct ocean access, infinity pool, and luxury amenities.',
      2500000, 'VILLA', 'AVAILABLE', '789 Beach Road', 'Beachfront', 'CA', '90212', 'USA',
      5, 4, 4500, 2020, catIds.villa, locIds.beachfront, adminId,
      'https://images.unsplash.com/photo-1512917774080-9a485dc7005d?w=400',
      JSON.stringify(['https://images.unsplash.com/photo-1512917774080-9a485dc7005d?w=800']),
      1,
    ]
  )

  // Testimonials
  console.log('⭐ Creating testimonials...')
  await execute(
    'INSERT INTO testimonials (id, content, rating, author_id, featured) VALUES (?,?,?,?,?),(?,?,?,?,?)',
    [
      uuidv4(), 'ARSA Real Estate helped me find my dream home! The agents were professional and supportive throughout the process.', 5, user1Id, 1,
      uuidv4(), 'Great experience with excellent customer service. Highly recommended!', 5, user2Id, 1,
    ]
  )

  // Settings
  console.log('⚙️  Creating settings...')
  const apiUrl = process.env.API_URL || 'http://localhost:5000'
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8443'
  
  await execute(
    'INSERT INTO settings (id, `key`, value, description) VALUES (?,?,?,?),(?,?,?,?),(?,?,?,?),(?,?,?,?),(?,?,?,?)',
    [
      uuidv4(), 'site_name',        'ARSA Real Estate',                              'Website name',
      uuidv4(), 'site_description', 'Luxury Real Estate Platform',                   'Website description',
      uuidv4(), 'contact_email',    'contact@arsarealestate.com',                    'Primary contact email',
      uuidv4(), 'contact_phone',    '+1 (555) 123-4567',                             'Primary contact phone',
      uuidv4(), 'logo_url',         `${clientUrl}/assets/logo.jpg`,                  'Logo URL - publicly accessible',
    ]
  )

  console.log('✅ Seeding completed!')
  console.log('   Admin: admin@arsarealestate.com / Admin@123')
  console.log('   User:  buyer1@example.com / User@123')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
