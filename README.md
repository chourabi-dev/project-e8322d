# Table & Kitchen

Restaurant Management SaaS Dashboard

Design a modern, minimal, responsive Restaurant Management Dashboard with a premium look and feel. The design should be clean, fast, and easy to use in busy restaurant environments. Think of a mix between Stripe Dashboard, Linear, and Notion with subtle animations, rounded cards, soft shadows, and a professional color palette.

Authentication

Create a beautiful login page with:

Username

Password

Login button

Clean illustration or restaurant-themed background

Dark and Light mode support

Dashboard (Home)

After login, display an overview dashboard containing:

Top statistics cards:

Total Restaurants

Total Products

Orders Today

Orders In Progress

Completed Orders

Revenue Today

Revenue This Month

Charts:

Orders by Hour

Revenue Evolution

Most Sold Products

Orders by Restaurant

Recent Activity panel:

New Orders

Recently Added Products

Latest Restaurant Updates

Quick Actions:

Add Restaurant

Add Product

View Kitchen

Open Menu Management

Sidebar Navigation

Dashboard

Restaurants

Products

Categories

Kitchen Screens

Orders

Analytics

Users

Settings

Restaurant Management

The platform supports unlimited restaurants.

Each restaurant contains:

Name

Logo

Cover Image

Address

Phone

Email

Description

Opening Hours

Delivery Available

Pickup Available

Active / Inactive Toggle

Restaurant cards should be modern with quick actions.

Each restaurant has its own independent data.

Clicking a restaurant opens its dedicated management dashboard.

Restaurant Dashboard

Each restaurant has:

Overview

Products

Categories

Kitchen Categories

Orders

Kitchen Screens

Settings

Statistics

Product Management

Beautiful table + grid view.

Each product includes:

Photo Gallery

Name

Description

Price

Discount Price

Availability Toggle

Featured Toggle

Preparation Time

SKU

Category

Kitchen Category

Allergens

Ingredients

Display Order

Quick actions:

Edit

Duplicate

Delete

Enable/Disable instantly

Searching and filtering should be extremely fast.

Categories

There are TWO independent category systems.

1. Menu Categories

Used for customer menus.

Examples:

Pizza

Pasta

Drinks

Desserts

Burgers

Salads

These determine how products appear on the customer menu.

2. Kitchen Categories

Used ONLY for kitchen routing.

Examples:

Pizza Oven

Pasta Station

Grill

Desserts

Drinks Bar

Cold Kitchen

This allows each product to be sent automatically to the correct kitchen display.

Example:

Margherita Pizza
→ Menu Category: Pizza
→ Kitchen Category: Pizza Oven

Spaghetti Carbonara
→ Menu Category: Pasta
→ Kitchen Category: Pasta Station

Kitchen Display System (KDS)

Create a beautiful Kitchen Display UI.

Instead of printing tickets, orders appear live.

Each kitchen has its own dedicated screen.

Examples:

Pizza Kitchen Screen

Pasta Kitchen Screen

Grill Kitchen Screen

Bar Screen

Dessert Screen

Each screen only receives products assigned to its Kitchen Category.

Example:

Order #102

Table 5

Items:

✔ Margherita Pizza

✔ Pepperoni Pizza

This order appears ONLY on the Pizza Kitchen screen.

Another order containing Pasta appears ONLY on the Pasta screen.

Live Updates

Kitchen screens update instantly without page refresh.

New orders animate into the queue.

Status updates synchronize in real time.

Support:

Incoming Order

Preparing

Ready

Completed

Cancelled

Each status has a distinct color.

Play a subtle notification sound when a new order arrives.

Kitchen Card Design

Each order card displays:

Large Order Number

Table Number

Customer Name (optional)

Order Time

Elapsed Time

Product List

Special Instructions

Priority Badge

Buttons:

Start Preparing

Ready

Completed

Delay

Cards should become visually urgent as preparation time increases.

Order Management

Modern order table with filters.

Order statuses:

Pending

Accepted

Preparing

Ready

Completed

Cancelled

Filters:

Restaurant

Date

Status

Kitchen

Delivery Type

Payment Status

Search by Order Number

Analytics

Per Restaurant:

Revenue

Orders

Top Products

Peak Hours

Kitchen Performance

Preparation Times

Sales by Category

Monthly Growth

Comparison between restaurants.

Users & Permissions

Multiple users.

Roles:

Administrator

Restaurant Manager

Kitchen Staff

Cashier

Viewer

Permissions should be role-based.

Settings

Restaurant settings

Business information

Taxes

Currency

Languages

Themes

Notifications

Printer settings (optional future feature)

Kitchen display preferences

Design Style

Modern SaaS

Minimal

Professional

Rounded corners

Soft shadows

Glassmorphism accents where appropriate

Smooth transitions

Responsive desktop-first design

Mobile-friendly management screens

Dark Mode

Light Mode

Beautiful empty states

Elegant loading skeletons

Consistent spacing

Excellent typography

Large touch-friendly buttons for kitchen devices.

Future-Ready Architecture

Design the interface so future modules can be added easily, including:

QR Code Menus

Customer Mobile Ordering

Reservations

Loyalty Program

Inventory Management

Supplier Management

Multi-language Support

Multi-currency Support

POS Integration

Online Ordering

Delivery Integration

AI Sales Analytics

The entire application should feel like a premium commercial SaaS product rather than a simple admin panel.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bba81302-3aab-429d-8a2c-e8edf9313ef2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
