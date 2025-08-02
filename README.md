# 🏪 UiTMMart - University Marketplace Platform

*Empowering UiTM students with a secure and intelligent marketplace ecosystem*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF)

## 📖 Project Description

UiTMMart is a comprehensive university marketplace platform specifically designed for Universiti Teknologi MARA (UiTM) students. It provides a secure, AI-powered trading environment where students can buy and sell items while maintaining campus community trust through advanced verification systems.

### 🎯 Problem Statement
University students often struggle with:
- Finding reliable platforms to trade items within their campus community
- Verifying the authenticity of student sellers/buyers
- Managing secure payments and order tracking
- Establishing trust in peer-to-peer transactions

### 💡 Our Solution
UiTMMart addresses these challenges by providing:
- **AI-powered student verification** using OCR technology for student ID validation
- **Integrated payment processing** with Stripe for secure transactions
- **Real-time order tracking** with automatic courier detection
- **Community-focused marketplace** exclusively for UiTM students
- **Advanced admin controls** for platform management and security

## ✨ Key Features

### 🛍️ Marketplace Core
- **Product Catalog**: Browse and search products with advanced filtering
- **Shop Management**: Sellers can create and customize their virtual shops
- **Shopping Cart**: Full-featured cart with bulk operations
- **Secure Checkout**: Stripe-integrated payment processing
- **Order Management**: Complete order lifecycle tracking

### 🔐 Security & Verification
- **Student ID OCR Verification**: AI-powered student ID scanning and validation
- **Facial Recognition**: Additional security layer for seller verification
- **Secure Authentication**: NextAuth.js integration with multiple providers
- **Admin Moderation**: Comprehensive admin dashboard for user and content management

### 📱 User Experience
- **Real-time Chat**: Integrated messaging system for buyer-seller communication
- **Order Tracking**: Automatic courier detection and status updates via Tracking.my API
- **Rating System**: Comprehensive review and rating system for products and sellers
- **Responsive Design**: Mobile-first approach with modern UI/UX

### 🎛️ Admin Features
- **User Management**: Complete control over buyer and seller accounts
- **Content Moderation**: Tools for managing products, shops, and user content
- **Analytics Dashboard**: Insights into platform usage and performance
- **Webhook Management**: Integration controls for external services

## 🎭 Demo

### Screenshots
![Homepage](./public/images/demo-homepage.png)
*Homepage showcasing featured products and categories*

![Student Verification](./public/images/demo-verification.png)
*AI-powered student ID verification process*

![Seller Dashboard](./public/images/demo-seller-dashboard.png)
*Comprehensive seller dashboard with analytics*

### Live Demo
🌐 **Production**: [https://uitm-mart.site](https://uitm-mart.site)
🧪 **Staging**: [Contact for staging access](#contact)

## 🏗️ Tech Stack & Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React hooks + Custom providers

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: Local file system (configurable)

### External Services
- **Payments**: Stripe Connect for multi-vendor payments
- **Tracking**: Tracking.my API for courier detection and status updates
- **OCR**: Custom implementation for student ID verification
- **Email**: SMTP integration for notifications

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt with Certbot
- **Deployment**: Self-hosted with automated SSL renewal

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│   External      │    │   File Storage  │              
│   Services      │    │   (Local/Cloud) │              
│   (Stripe, etc) │    │                 │              
└─────────────────┘    └─────────────────┘              
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: >= 18.0.0
- **npm/yarn**: Latest version
- **PostgreSQL**: >= 13.0
- **Docker** (optional): For containerized deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uitmMart
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database (optional)
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### Docker Deployment

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📋 Usage Guide

### For Students (Buyers)
1. **Registration**: Sign up with university email
2. **Verification**: Complete student ID verification process
3. **Shopping**: Browse products, add to cart, and checkout
4. **Communication**: Chat with sellers for inquiries
5. **Order Tracking**: Monitor order status and delivery

### For Sellers
1. **Seller Registration**: Apply to become a verified seller
2. **Shop Setup**: Create and customize your shop profile
3. **Product Management**: Add, edit, and manage your inventory
4. **Order Processing**: Handle incoming orders and shipping
5. **Analytics**: Monitor sales performance and customer feedback

### For Administrators
1. **User Management**: Approve/suspend users and sellers
2. **Content Moderation**: Review and moderate products and shops
3. **System Monitoring**: Track platform health and performance
4. **Configuration**: Manage system settings and integrations

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uitmmart"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Tracking.my API
TRACKING_MY_API_KEY="your-tracking-api-key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### API Keys Setup

1. **Stripe Account**: 
   - Create account at [stripe.com](https://stripe.com)
   - Enable Stripe Connect for multi-vendor payments
   - Add webhook endpoint: `https://yourdomain.com/api/stripe/webhook`

2. **Tracking.my API**:
   - Register at [tracking.my](https://tracking.my)
   - Generate API key from dashboard
   - Configure webhook URL for order updates

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Environment Setup
```bash
# Setup test database
createdb uitmmart_test

# Run test migrations
DATABASE_URL="postgresql://username:password@localhost:5432/uitmmart_test" npx prisma migrate deploy
```

## 🔒 Security Considerations

### OCR & AI Verification
- **Student ID Scanning**: Uses AI to extract and validate student information
- **Facial Recognition**: Optional secondary verification for sellers
- **Data Protection**: All verification data is encrypted and securely stored
- **Privacy Compliance**: Adheres to data protection regulations

### Security Measures
- **Input Validation**: All user inputs are sanitized and validated
- **SQL Injection Protection**: Prisma ORM provides built-in protection
- **XSS Prevention**: React's built-in XSS protection + additional sanitization
- **CSRF Protection**: NextAuth.js handles CSRF protection
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse

### Best Practices
- Regular security audits and dependency updates
- Encrypted storage of sensitive data
- Secure file upload with type validation
- HTTPS-only communication in production

## 🗺️ Roadmap

### Phase 1 - Current Features ✅
- [x] Core marketplace functionality
- [x] Student verification system
- [x] Payment integration
- [x] Order tracking
- [x] Admin dashboard

### Phase 2 - Q2 2024
- [ ] Mobile application (React Native)
- [ ] Advanced analytics and reporting
- [ ] Bulk product management
- [ ] Enhanced search with AI recommendations

### Phase 3 - Q3 2024
- [ ] Multi-campus support
- [ ] Social features and community building
- [ ] Advanced fraud detection
- [ ] API for third-party integrations

### Phase 4 - Q4 2024
- [ ] Machine learning recommendations
- [ ] Inventory management system
- [ ] Advanced seller tools
- [ ] Performance optimizations

## 🤝 Contributing

We welcome contributions from the UiTM community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors & Contact

### Development Team
- **Lead Developer**: [Your Name](mailto:your.email@uitm.edu.my)
- **UI/UX Designer**: [Designer Name](mailto:designer@uitm.edu.my)
- **Project Manager**: [PM Name](mailto:pm@uitm.edu.my)

### Support & Contact
- 📧 **General Inquiries**: support@uitmmart.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/uitmmart)
- 📱 **Social Media**: [@UiTMMart](https://twitter.com/uitmmart)

## 🙏 Acknowledgments

- **Universiti Teknologi MARA (UiTM)** for supporting student innovation
- **Next.js Team** for the amazing framework
- **Stripe** for secure payment processing
- **Tracking.my** for logistics integration
- **Open Source Community** for the tools and libraries that made this possible

---

<div align="center">
  <p>Made with ❤️ by UiTM students, for UiTM students</p>
  <p>
    <a href="#top">⬆️ Back to Top</a>
  </p>
</div>