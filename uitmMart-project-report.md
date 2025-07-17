# UiTMMart Project Report

## Executive Summary

UiTMMart is a comprehensive e-commerce platform specifically designed for university students, with a focus on creating a secure, structured marketplace environment. The platform operates as a dual-sided marketplace where students can act as both buyers and sellers, facilitating commerce within the university community.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [User Management & Authentication](#user-management--authentication)
6. [Student Verification System](#student-verification-system)
7. [Product & Shop Management](#product--shop-management)
8. [Order Management](#order-management)
9. [Payment Processing](#payment-processing)
10. [Real-time Chat System](#real-time-chat-system)
11. [Order Tracking System](#order-tracking-system)
12. [Admin Dashboard](#admin-dashboard)
13. [Deployment & Infrastructure](#deployment--infrastructure)
14. [Security Features](#security-features)
15. [API Documentation](#api-documentation)
16. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Mission Statement
UiTMMart aims to provide a secure, trusted marketplace exclusively for university students, fostering entrepreneurship and commerce within the academic community.

### Key Objectives
- Create a secure trading environment for university students
- Facilitate peer-to-peer commerce with proper verification
- Provide integrated payment processing with platform fees
- Enable real-time communication between buyers and sellers
- Implement comprehensive order tracking and management
- Ensure student authenticity through document verification

### Target Audience
- **Primary Users**: University students (UiTM students initially)
- **Buyers**: Students looking for academic supplies, personal items, services
- **Sellers**: Students wanting to sell products or offer services
- **Administrators**: Platform moderators and support staff

---

## Technology Stack

### Frontend Framework
- **Next.js 15.2.3** - React-based framework with App Router
- **React 19.0.0** - Component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS 4.0** - Utility-first CSS framework

### Backend & Database
- **Node.js & Express** - Backend server runtime
- **PostgreSQL** - Primary database
- **Prisma 6.8.2** - Database ORM and migrations
- **NextAuth.js 4.24.11** - Authentication system

### Real-time Communication
- **Socket.io 4.8.1** - Real-time bidirectional communication
- **Express Server** - Dedicated Socket.io server

### Payment Processing
- **Stripe** - Payment gateway and connected accounts
- **Platform Fee**: 5% on all transactions

### External Services
- **Tracking.my API** - Shipment tracking and courier detection
- **OpenAI API** - OCR text parsing and document analysis
- **Tesseract.js** - Client-side OCR processing
- **Nodemailer** - Email notifications

### Development Tools
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and SSL termination
- **Let's Encrypt** - SSL certificate management
- **ESLint** - Code linting and formatting

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Buyer     │  │   Seller    │  │      Admin          │ │
│  │ Dashboard   │  │ Dashboard   │  │    Dashboard        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Routes
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Backend Services                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │     API     │  │   Socket.io │  │   Authentication    │ │
│  │   Routes    │  │   Server    │  │      (NextAuth)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │   Prisma    │  │   File Storage      │ │
│  │  Database   │  │     ORM     │  │   (Public Dir)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                 External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Stripe   │  │ Tracking.my │  │      OpenAI         │ │
│  │   Payment   │  │     API     │  │    (OCR Parse)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

The database uses PostgreSQL with the following core entities:

#### User Management
- **User**: Core user information with roles (buyer/seller/admin)
- **StudentVerification**: Document verification records
- **Address**: User delivery addresses with GPS coordinates

#### Commerce
- **Shop**: Seller shop information with Stripe account linking
- **Product**: Product catalog with pricing and discounts
- **CartItem**: Shopping cart functionality
- **Order**: Order management with status tracking
- **OrderItem**: Individual items within orders
- **Rating**: Product and seller ratings

#### Communication
- **Chat**: Chat rooms between buyers and sellers
- **ChatMessage**: Individual chat messages
- **TrackingHistory**: Order tracking checkpoint history

---

## Core Features

### 1. Multi-Role User System
- **Buyers**: Browse products, make purchases, chat with sellers
- **Sellers**: Create shops, manage products, process orders
- **Admins**: Moderate platform, verify students, manage disputes

### 2. Student Verification
- Document upload (Student ID + Selfie)
- OCR-based text extraction
- AI-powered document analysis
- Admin review and approval workflow

### 3. Shop Management
- Seller onboarding with Stripe Connect
- Product catalog management
- Inventory tracking
- Order fulfillment tools

### 4. Secure Payments
- Stripe integration with connected accounts
- Platform fee collection (5%)
- Refund and dispute handling
- Multiple payment methods support

### 5. Real-time Communication
- Socket.io-based chat system
- Buyer-seller messaging
- Typing indicators and read receipts
- Message history persistence

### 6. Order Tracking
- Integration with Tracking.my API
- Automatic courier detection
- Real-time status updates
- Delivery confirmation

---

## User Management & Authentication

### Authentication System

The platform uses NextAuth.js with custom credential providers:

```typescript
// Authentication Configuration
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // User validation logic
        // Password hashing with bcrypt
        // Session data preparation
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Token enrichment with user roles
    },
    session: async ({ session, token }) => {
      // Session data population
    }
  }
};
```

### User Roles & Permissions

#### Buyer Role
- Browse products and shops
- Add items to cart
- Make purchases
- Chat with sellers
- Rate products and sellers
- Manage delivery addresses

#### Seller Role
- Create and manage shop
- Add/edit products
- Process orders
- Update shipping information
- Chat with buyers
- Connect Stripe account

#### Admin Role
- Verify student documents
- Manage user accounts
- Monitor platform activity
- Handle disputes
- Configure system settings

### Middleware Protection

```typescript
// Route protection middleware
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret });
  const userRole = token?.role as string || '';
  
  // Role-based route protection
  if (userRole === 'seller' && pathname === '/main') {
    return NextResponse.redirect(new URL('/seller', request.url));
  }
  
  if (userRole === 'buyer' && pathname.startsWith('/seller')) {
    return NextResponse.redirect(new URL('/main', request.url));
  }
  
  if (userRole !== 'admin' && pathname.startsWith('/admin')) {
    const redirectUrl = userRole === 'seller' ? '/seller' : '/main';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}
```

---

## Student Verification System

### Overview
The student verification system ensures that only legitimate university students can use the platform. It combines document upload, OCR processing, and AI analysis.

### Verification Process

1. **Document Upload**
   - Student ID card image
   - Selfie photograph
   - File size limits (10MB)
   - Format validation (JPEG/PNG only)

2. **OCR Processing**
   - Client-side OCR using Tesseract.js
   - Text extraction from student ID
   - Progress tracking and user feedback

3. **AI Analysis**
   - OpenAI GPT-4 integration
   - Structured data extraction
   - University validation (UiTM/UNIVERSITI TEKNOLOGI MARA)
   - Student number format validation

4. **Admin Review**
   - Manual verification interface
   - Approval/rejection workflow
   - Rejection reason tracking
   - Resubmission capabilities

### Implementation Details

```typescript
// OCR Processing Function
const processStudentIdOCR = async () => {
  const result = await Tesseract.recognize(
    imageUrl,
    'eng',
    {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.round(m.progress * 100));
        }
      }
    }
  );
  
  // AI analysis of extracted text
  const aiResponse = await fetch('/api/admin/ocr-parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ocrText: result.data.text })
  });
  
  const aiResult = await aiResponse.json();
  if (aiResult.success) {
    setParsedData(aiResult.data);
    setEditableData({
      studentName: aiResult.data.name || '',
      studentIdNumber: aiResult.data.studentNumber || '',
      university: aiResult.data.university || ''
    });
  }
};
```

### QR Code Upload Feature
- Mobile-friendly upload via QR code
- Session-based temporary storage
- Seamless integration with web interface

---

## Product & Shop Management

### Shop Creation & Management

Sellers can create shops with the following features:

#### Shop Information
- Shop name and description
- Logo and banner images
- Contact information
- Location details (city, state, country)
- Operating hours and policies

#### Stripe Integration
- Connected account creation
- Onboarding flow management
- Payment processing setup
- Fee structure configuration

```typescript
// Stripe Account Creation
const account = await stripe.accounts.create({
  type: 'standard',
  country: 'MY',
  email: user.email,
  business_type: 'individual',
  business_profile: {
    name: shop.name,
    url: `${baseUrl}/shops/${shop.id}`,
  },
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});
```

### Product Management

#### Product Creation
- Product name and description
- Category selection (20+ categories)
- Price and stock management
- Multiple image uploads
- Product variations support

#### Categories Available
- Academic supplies (textbooks, stationery, past papers)
- Electronics and gadgets
- Clothing and accessories
- Food and beverages
- Services (tutoring, resume writing)
- Room essentials and furniture

#### Discount System
- Percentage-based discounts
- Time-limited offers
- Automatic price calculation
- Promotional badge display

```typescript
// Discount Implementation
const isDiscountActive = (product: Product) => {
  if (!product?.discountPercentage) return false;
  
  const now = new Date();
  const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
  const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
  
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return true;
};
```

---

## Order Management

### Order Lifecycle

1. **Order Creation**
   - Cart items consolidation
   - Address selection
   - Payment processing
   - Order number generation

2. **Order Processing**
   - Seller notification
   - Inventory deduction
   - Payment confirmation
   - Status updates

3. **Shipping Management**
   - Tracking number assignment
   - Courier selection
   - Shipping updates
   - Delivery confirmation

4. **Order Completion**
   - Delivery confirmation
   - Rating and review
   - Payment release
   - Order archival

### Order Status System

```typescript
// Order Status Definitions
enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}
```

### Order Tracking Integration

Orders are automatically tracked using the Tracking.my API:

- Automatic courier detection
- Real-time status updates
- Delivery notifications
- Historical tracking data

---

## Payment Processing

### Stripe Integration Architecture

The platform uses Stripe Connect for handling payments between buyers and sellers:

#### Platform Account
- Main UiTMMart Stripe account
- Processes payments when sellers don't have connected accounts
- Handles platform fees and disputes

#### Connected Accounts
- Individual Stripe accounts for each seller
- Direct payment processing
- Automatic fee collection
- Compliance handling

### Payment Flow

```typescript
// Payment Processing Logic
export async function POST(req: Request) {
  const { items, addressId } = await req.json();
  
  // Group items by shop/seller
  const itemsByShop = groupItemsByShop(items);
  
  // Create separate orders for each seller
  const orders = await createOrdersForEachSeller(itemsByShop);
  
  // Create Stripe checkout session
  const sessionOptions = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
  };
  
  // Use connected account if available
  if (useConnectedAccount) {
    sessionOptions.payment_intent_data = {
      application_fee_amount: Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE * 100)
    };
    
    stripeSession = await stripe.checkout.sessions.create(
      sessionOptions,
      { stripeAccount: shopData.stripeAccountId }
    );
  } else {
    stripeSession = await stripe.checkout.sessions.create(sessionOptions);
  }
  
  return NextResponse.json({ url: stripeSession.url });
}
```

### Fee Structure

- **Platform Fee**: 5% of transaction value
- **Stripe Processing Fee**: 2.9% + $0.30 per transaction
- **Seller Receives**: ~92.1% of transaction value

### Webhook Processing

Stripe webhooks handle payment confirmations and failures:

```typescript
// Webhook Handler
switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutSessionCompleted(event.data.object);
    break;
  case 'payment_intent.succeeded':
    await handlePaymentIntentSucceeded(event.data.object);
    break;
  case 'payment_intent.payment_failed':
    await handlePaymentIntentFailed(event.data.object);
    break;
}
```

---

## Real-time Chat System

### Architecture Overview

The chat system uses Socket.io for real-time bidirectional communication:

#### Components
- **Socket.io Server**: Dedicated Express server on port 3001
- **Client Integration**: React hooks for chat functionality
- **Message Persistence**: PostgreSQL database storage
- **Fallback API**: REST endpoints for offline scenarios

### Chat Features

#### Real-time Messaging
- Instant message delivery
- Typing indicators
- Read receipts
- Online/offline status

#### Message Management
- Message history persistence
- Duplicate message prevention
- Message retry mechanisms
- Offline message queuing

#### User Experience
- Responsive chat interface
- Mobile-friendly design
- Emoji support
- File sharing capabilities

### Implementation Details

```typescript
// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://uitmmart.site',
      process.env.NEXT_PUBLIC_BASE_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Message Handling
socket.on('privateMessage', async (data) => {
  const { senderId, receiverId, message, chatId, clientId } = data;
  
  // Prevent duplicate messages
  const key = `${senderId}-${message}-${chatId}`;
  if (recentMessages.has(key)) {
    return;
  }
  
  // Store message in database
  const newMessage = await prisma.chatMessage.create({
    data: {
      content: message,
      senderId: parseInt(senderId),
      chatId: parseInt(chatId),
      read: false,
      ...(clientId ? { metadata: { clientId } } : {})
    },
  });
  
  // Emit to sender and receiver
  io.to(`user:${senderId}`).emit('newMessage', {
    ...newMessage,
    isMine: true,
  });
  
  io.to(`user:${receiverId}`).emit('newMessage', {
    ...newMessage,
    isMine: false,
  });
});
```

### Chat Security

- User authentication required
- Message encryption in transit
- Input sanitization
- Rate limiting
- Abuse prevention

---

## Order Tracking System

### Integration with Tracking.my API

The platform integrates with Tracking.my for comprehensive order tracking:

#### Features
- Automatic courier detection
- Real-time status updates
- Delivery notifications
- Historical tracking data
- Multi-courier support

### Tracking Workflow

1. **Order Shipment**
   - Seller updates order with tracking number
   - System detects courier automatically
   - Tracking number registered with API

2. **Status Updates**
   - Webhooks receive real-time updates
   - Order status automatically updated
   - Buyers receive notifications

3. **Delivery Confirmation**
   - Automatic delivery detection
   - Order marked as completed
   - Payment released to seller

### Implementation Details

```typescript
// Courier Detection
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingNumber = searchParams.get('trackingNumber');
  
  // Pattern-based detection
  const courierPatterns = [
    { pattern: /^SPXMY/, courier: 'shopee-express-my', name: 'Shopee Express' },
    { pattern: /^JT/, courier: 'jt-express', name: 'J&T Express' },
    { pattern: /^EP/, courier: 'pos-malaysia', name: 'Pos Malaysia' },
    // ... more patterns
  ];
  
  for (const { pattern, courier, name } of courierPatterns) {
    if (pattern.test(trackingNumber)) {
      return NextResponse.json({
        success: true,
        data: [{ courier_code: courier, courier_name: name }]
      });
    }
  }
  
  // Fallback to API detection
  const response = await fetch(`${apiUrl}/trackings/detect?tracking_number=${trackingNumber}`, {
    headers: { 'Tracking-Api-Key': apiKey }
  });
  
  return NextResponse.json(await response.json());
}
```

### Tracking History Storage

```typescript
// Tracking History Database Schema
model TrackingHistory {
  id             String   @id @default(cuid())
  orderId        Int
  trackingNumber String
  courierCode    String
  status         String
  details        String?
  location       String?
  checkpointTime DateTime
  rawData        Json?
  createdAt      DateTime @default(now())
  
  order          Order    @relation(fields: [orderId], references: [id])
  
  @@unique([orderId, trackingNumber, checkpointTime, details])
}
```

---

## Admin Dashboard

### Admin Functionality

#### User Management
- View all registered users
- Monitor user activity
- Handle user disputes
- Account suspension/activation

#### Student Verification
- Review verification submissions
- OCR data validation
- Document authenticity checks
- Approval/rejection workflow

#### Platform Monitoring
- Order tracking overview
- Payment transaction monitoring
- System health checks
- Performance metrics

### Admin Interfaces

#### OCR Review Interface
- Side-by-side document viewing
- Extracted data validation
- Manual data correction
- Batch processing capabilities

#### Verification Dashboard
- Pending verification queue
- Approval statistics
- Rejection reason tracking
- Resubmission management

---

## Deployment & Infrastructure

### Containerization

The application is fully containerized using Docker:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/fyp
    depends_on:
      - db
    command: >
      sh -c "
        npx prisma migrate deploy &&
        npm run dev & node server.js
      "

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - app

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fyp
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### SSL Configuration

SSL certificates are managed using Let's Encrypt:

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name uitmmart.site;
    
    ssl_certificate /etc/letsencrypt/live/uitmmart.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uitmmart.site/privkey.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://app:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Environment Configuration

```env
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_URL=https://uitmmart.site
NEXTAUTH_SECRET=your-secret-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...

# Tracking API
TRACKING_MY_API_KEY=your-tracking-api-key

# Email Configuration
EMAIL_FROM=noreply@uitmmart.site
GOOGLE_APP_PASSWORD=your-app-password

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
```

---

## Security Features

### Authentication Security

#### Password Security
- bcrypt hashing with salt rounds
- Strong password requirements
- Session token encryption
- JWT token expiration

#### Session Management
- Secure HTTP-only cookies
- CSRF protection
- XSS prevention
- Session invalidation

### Data Protection

#### Input Validation
- Request body sanitization
- File upload validation
- SQL injection prevention
- Parameter validation

#### File Security
- File type validation
- Size limitations
- Secure file storage
- Access control

### API Security

#### Rate Limiting
- Request throttling
- User-based limits
- Endpoint-specific limits
- Abuse prevention

#### CORS Configuration
- Strict origin policies
- Credential handling
- Method restrictions
- Header validation

---

## API Documentation

### Authentication Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "buyer"
}
```

### Product Endpoints

#### Get Products
```
GET /api/public/products
Response: Product[]
```

#### Create Product
```
POST /api/seller/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "stock": 100,
  "category": "Electronics",
  "images": ["image1.jpg", "image2.jpg"]
}
```

### Order Endpoints

#### Create Order
```
POST /api/checkout/payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "addressId": 1
}
```

#### Get Orders
```
GET /api/orders/user
Authorization: Bearer <token>
Response: Order[]
```

### Chat Endpoints

#### Get Conversations
```
GET /api/chat/conversations
Authorization: Bearer <token>
Response: Chat[]
```

#### Send Message
```
POST /api/chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "chatId": 1,
  "content": "Hello, is this item still available?"
}
```

---

## Conclusion

UiTMMart represents a comprehensive solution for university-based e-commerce, combining modern web technologies with specialized features for academic communities. The platform successfully addresses the unique needs of student commerce while maintaining security, scalability, and user experience.

The implementation demonstrates best practices in:
- Modern web development with Next.js and TypeScript
- Secure payment processing with Stripe
- Real-time communication with Socket.io
- Document verification with AI integration
- Order tracking with third-party APIs
- Containerized deployment with Docker

The platform is well-positioned for growth and can serve as a foundation for expanding to other universities and implementing additional features based on user feedback and market demands.

---

*Report generated on: $(date)*
*Version: 1.0*
*Author: UiTMMart Development Team* 