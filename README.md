# Mosqueda Campus Lost & Found App

## Overview
A professional lost-and-found web application for Mosqueda Campus in Guimaras. The app allows public viewing of lost/found items but requires login for posting. Weekly winners get a shout-out and a prize. Built with modern tech for speed, reliability, and maintainability.

## Tech Stack
- **Framework**: Next.js (React 19) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database & Auth**: Supabase (PostgreSQL, RLS, Storage)
- **Hosting**: Vercel
- **Icons**: lucide-react

## Features
1. **Public Viewing**
   - Anyone can view lost & found posts
   - Each post includes photo, name, description, location, date, contact number

2. **Posting Lost or Found Items**
   - Requires login (Supabase Auth, email/password)
   - Form includes: Item name, description, date lost/found, location, contact number, image upload
   - Stores in `items` table with status `lost` or `found`

3. **Admin Panel**
   - remove posts
   - Edit any post
   - Mark items as returned
   - Manage users
   - View weekly winners

4. **Weekly Winners**
   - First two posters each week get a prize and a homepage shout-out
   - Winners stored in `winners` table for Hall of Fame page
   - Auto-reset every Monday 00:00

5. **Hall of Fame Page**
   - Lists all weekly winners with their winning date range

## Database Schema (Supabase)
### Table: `profiles`
- `id` (uuid, pk, references auth.users)
- `full_name` (text)
- `role` (enum: admin, user) default 'user'
- `created_at` (timestamp)

### Table: `items`
- `id` (uuid, pk)
- `user_id` (uuid, references auth.users)
- `type` (enum: lost, found)
- `name` (text)
- `description` (text)
- `date` (date)
- `location` (text)
- `contact_number` (text)
- `image_url` (text)
- `status` (enum: active, returned) default 'active'
- `created_at` (timestamp)

### Table: `winners`
- `id` (uuid, pk)
- `user_id` (uuid)
- `week_start` (date)
- `week_end` (date)
- `created_at` (timestamp)

## Role-based Access Control
- **Public**: Read items & winners
- **Authenticated users**: Post, edit, delete own items
- **Admins**: Full CRUD on all items, winners, and profiles

## UI Guidelines
- Use shadcn/ui for:
  - Forms
  - Modals (login, post item)
  - Navigation
  - Tables
  - Toast notifications
- Mobile-first, responsive design
- Color scheme: Clean, professional, campus-friendly
- Accessibility: All UI must be keyboard-accessible and screen-reader friendly

## Directory Structure
