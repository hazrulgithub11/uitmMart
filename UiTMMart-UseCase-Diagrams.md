# UiTMMart Use Case Diagrams

## System Overview
UiTMMart is a student marketplace platform with three main actors:
- **Buyer**: Students who purchase products and services
- **Seller**: Students who sell products and services  
- **Admin**: Platform administrators who manage and moderate

---

## Main Use Case Diagram

```
                              UiTMMart System
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                    AUTHENTICATION                            ║   │
    │                     ║                                                              ║   │
    │   ┌─────────┐       ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │   │         │       ║    │   Register  │    │    Login    │    │   Logout    │    ║   │
    │   │  Buyer  │──────────  │             │    │             │    │             │    ║   │
    │   │         │       ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │   └─────────┘       ║                                                              ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                STUDENT VERIFICATION                          ║   │
    │                     ║                                                              ║   │
    │   ┌─────────┐       ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │   │         │       ║    │   Submit    │    │   Upload    │    │   QR Code   │    ║   │
    │   │ Seller  │──────────  │ Documents   │    │  Student ID │    │   Upload    │    ║   │
    │   │         │       ║    │             │    │             │    │             │    ║   │
    │   └─────────┘       ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐                       ║   │
    │                     ║    │   Upload    │    │ Resubmit    │                       ║   │
    │                     ║    │   Selfie    │    │ Documents   │                       ║   │
    │                     ║    │             │    │             │                       ║   │
    │                     ║    └─────────────┘    └─────────────┘                       ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                  PRODUCT MANAGEMENT                          ║   │
    │                     ║                                                              ║   │
    │   ┌─────────┐       ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │   │         │       ║    │   Browse    │    │   Search    │    │    View     │    ║   │
    │   │  Admin  │──────────  │  Products   │    │  Products   │    │  Product    │    ║   │
    │   │         │       ║    │             │    │             │    │   Details   │    ║   │
    │   └─────────┘       ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │ Add Product │    │Edit Product │    │Delete Product│   ║   │
    │                     ║    │             │    │             │    │             │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐                       ║   │
    │                     ║    │   Manage    │    │   Set       │                       ║   │
    │                     ║    │  Categories │    │  Discounts  │                       ║   │
    │                     ║    │             │    │             │                       ║   │
    │                     ║    └─────────────┘    └─────────────┘                       ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                 SHOPPING & ORDERS                            ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │  Add to     │    │   View      │    │   Checkout  │    ║   │
    │                     ║    │   Cart      │    │   Cart      │    │             │    ║   │
    │                     ║    │             │    │             │    │             │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │   Make      │    │   View      │    │   Track     │    ║   │
    │                     ║    │  Payment    │    │   Orders    │    │   Orders    │    ║   │
    │                     ║    │             │    │             │    │             │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐                       ║   │
    │                     ║    │   Cancel    │    │    Rate     │                       ║   │
    │                     ║    │   Order     │    │   Product   │                       ║   │
    │                     ║    │             │    │             │                       ║   │
    │                     ║    └─────────────┘    └─────────────┘                       ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                 COMMUNICATION                                ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │   Chat      │    │   Send      │    │   View      │    ║   │
    │                     ║    │  with       │    │  Message    │    │  Message    │    ║   │
    │                     ║    │  Seller     │    │             │    │  History    │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐                       ║   │
    │                     ║    │   Chat      │    │   Mark      │                       ║   │
    │                     ║    │  with       │    │  Messages   │                       ║   │
    │                     ║    │  Buyer      │    │  as Read    │                       ║   │
    │                     ║    └─────────────┘    └─────────────┘                       ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    │                     ╔══════════════════════════════════════════════════════════════╗   │
    │                     ║                 ADMINISTRATION                               ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │   Review    │    │   Approve   │    │   Reject    │    ║   │
    │                     ║    │   Student   │    │   Student   │    │   Student   │    ║   │
    │                     ║    │Verification │    │Verification │    │Verification │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ║   │
    │                     ║    │   Manage    │    │   Monitor   │    │   Handle    │    ║   │
    │                     ║    │   Users     │    │  Platform   │    │  Disputes   │    ║   │
    │                     ║    │             │    │             │    │             │    ║   │
    │                     ║    └─────────────┘    └─────────────┘    └─────────────┘    ║   │
    │                     ║                                                              ║   │
    │                     ║    ┌─────────────┐    ┌─────────────┐                       ║   │
    │                     ║    │   OCR       │    │   System    │                       ║   │
    │                     ║    │  Review     │    │  Analytics  │                       ║   │
    │                     ║    │             │    │             │                       ║   │
    │                     ║    └─────────────┘    └─────────────┘                       ║   │
    │                     ╚══════════════════════════════════════════════════════════════╝   │
    │                                                                                         │
    └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Use Case Diagrams by Actor

### 1. Buyer Actor Use Cases

```
                                    Buyer Use Cases
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                         │
    │                          ┌─────────────┐                                               │
    │                          │   Register  │                                               │
    │                          │             │                                               │
    │                          └─────────────┘                                               │
    │                                  │                                                     │
    │                                  │ <<include>>                                         │
    │                                  ▼                                                     │
    │   ┌─────────┐              ┌─────────────┐                                            │
    │   │         │              │   Submit    │                                            │
    │   │  Buyer  │─────────────▶│  Student    │                                            │
    │   │         │              │Verification │                                            │
    │   └─────────┘              └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐                                            │
    │       │                    │    Login    │                                            │
    │       └───────────────────▶│             │                                            │
    │       │                    └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Browse    │         │   Search    │                   │
    │       ├───────────────────▶│  Products   │◇───────▶│  Products   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    View     │         │   Filter    │                   │
    │       ├───────────────────▶│  Product    │◇───────▶│  Products   │                   │
    │       │                    │   Details   │         │ by Category │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │  Add to     │         │   Update    │                   │
    │       ├───────────────────▶│   Cart      │◇───────▶│    Cart     │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    View     │         │   Remove    │                   │
    │       ├───────────────────▶│    Cart     │◇───────▶│    from     │                   │
    │       │                    │             │         │    Cart     │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │  Checkout   │         │   Select    │                   │
    │       ├───────────────────▶│             │◇───────▶│  Address    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                             │                                                 │
    │       │                             │ <<include>>                                     │
    │       │                             ▼                                                 │
    │       │                    ┌─────────────┐                                            │
    │       │                    │    Make     │                                            │
    │       │                    │   Payment   │                                            │
    │       │                    │             │                                            │
    │       │                    └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    View     │         │   Cancel    │                   │
    │       ├───────────────────▶│   Orders    │◇───────▶│    Order    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Track    │         │    View     │                   │
    │       ├───────────────────▶│   Orders    │◇───────▶│  Tracking   │                   │
    │       │                    │             │         │   History   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Chat     │         │    Send     │                   │
    │       ├───────────────────▶│   with      │◇───────▶│   Message   │                   │
    │       │                    │   Seller    │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Rate     │         │    Write    │                   │
    │       ├───────────────────▶│   Product   │◇───────▶│   Review    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Manage    │         │  Add/Edit   │                   │
    │       └───────────────────▶│  Addresses  │◇───────▶│  Address    │                   │
    │                            └─────────────┘         └─────────────┘                   │
    │                                                                                       │
    └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Seller Actor Use Cases

```
                                    Seller Use Cases
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                         │
    │                          ┌─────────────┐                                               │
    │                          │   Register  │                                               │
    │                          │             │                                               │
    │                          └─────────────┘                                               │
    │                                  │                                                     │
    │                                  │ <<include>>                                         │
    │                                  ▼                                                     │
    │   ┌─────────┐              ┌─────────────┐                                            │
    │   │         │              │   Submit    │                                            │
    │   │ Seller  │─────────────▶│  Student    │                                            │
    │   │         │              │Verification │                                            │
    │   └─────────┘              └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐                                            │
    │       │                    │    Login    │                                            │
    │       └───────────────────▶│             │                                            │
    │       │                    └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Create    │         │   Setup     │                   │
    │       ├───────────────────▶│    Shop     │◇───────▶│   Shop      │                   │
    │       │                    │             │         │   Profile   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                             │                                                 │
    │       │                             │ <<include>>                                     │
    │       │                             ▼                                                 │
    │       │                    ┌─────────────┐                                            │
    │       │                    │   Connect   │                                            │
    │       │                    │   Stripe    │                                            │
    │       │                    │  Account    │                                            │
    │       │                    └─────────────┘                                            │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Add      │         │   Upload    │                   │
    │       ├───────────────────▶│  Product    │◇───────▶│   Product   │                   │
    │       │                    │             │         │   Images    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Edit     │         │   Update    │                   │
    │       ├───────────────────▶│  Product    │◇───────▶│   Stock     │                   │
    │       │                    │             │         │   Quantity  │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Delete    │         │   Set       │                   │
    │       ├───────────────────▶│  Product    │         │  Product    │                   │
    │       │                    │             │         │ Discounts   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   View      │         │   Update    │                   │
    │       ├───────────────────▶│   Orders    │◇───────▶│   Order     │                   │
    │       │                    │             │         │   Status    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Process   │         │   Add       │                   │
    │       ├───────────────────▶│   Orders    │◇───────▶│  Tracking   │                   │
    │       │                    │             │         │   Number    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Update    │         │   Select    │                   │
    │       ├───────────────────▶│  Shipping   │◇───────▶│   Courier   │                   │
    │       │                    │             │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    Chat     │         │   Send      │                   │
    │       ├───────────────────▶│   with      │◇───────▶│   Message   │                   │
    │       │                    │   Buyer     │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │    View     │         │   Generate  │                   │
    │       ├───────────────────▶│   Sales     │◇───────▶│   Reports   │                   │
    │       │                    │ Analytics   │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Manage    │         │   Update    │                   │
    │       └───────────────────▶│    Shop     │◇───────▶│    Shop     │                   │
    │                            │  Settings   │         │    Logo     │                   │
    │                            └─────────────┘         └─────────────┘                   │
    │                                                                                       │
    └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Admin Actor Use Cases

```
                                    Admin Use Cases
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                         │
    │   ┌─────────┐              ┌─────────────┐                                            │
    │   │         │              │    Login    │                                            │
    │   │  Admin  │─────────────▶│             │                                            │
    │   │         │              └─────────────┘                                            │
    │   └─────────┘                                                                         │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Review    │         │   Process   │                   │
    │       ├───────────────────▶│   Student   │◇───────▶│     OCR     │                   │
    │       │                    │Verification │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Approve   │         │   Validate  │                   │
    │       ├───────────────────▶│   Student   │◇───────▶│  Document   │                   │
    │       │                    │Verification │         │ Authenticity│                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Reject    │         │   Provide   │                   │
    │       ├───────────────────▶│   Student   │◇───────▶│  Rejection  │                   │
    │       │                    │Verification │         │   Reason    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Manage    │         │   View      │                   │
    │       ├───────────────────▶│    Users    │◇───────▶│    User     │                   │
    │       │                    │             │         │   Details   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │  Suspend    │         │ Reactivate  │                   │
    │       ├───────────────────▶│    User     │         │    User     │                   │
    │       │                    │  Account    │         │  Account    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Monitor   │         │    View     │                   │
    │       ├───────────────────▶│  Platform   │◇───────▶│  System     │                   │
    │       │                    │  Activity   │         │    Logs     │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Handle    │         │  Investigate│                   │
    │       ├───────────────────▶│  Disputes   │◇───────▶│   Dispute   │                   │
    │       │                    │             │         │   Details   │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Resolve   │         │   Send      │                   │
    │       ├───────────────────▶│  Disputes   │◇───────▶│ Notification│                   │
    │       │                    │             │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   View      │         │   Export    │                   │
    │       ├───────────────────▶│   System    │◇───────▶│   Reports   │                   │
    │       │                    │ Analytics   │         │             │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Manage    │         │   Update    │                   │
    │       ├───────────────────▶│  Platform   │◇───────▶│   System    │                   │
    │       │                    │ Settings    │         │ Configuration│                  │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Monitor   │         │   Check     │                   │
    │       ├───────────────────▶│  Order      │◇───────▶│  Tracking   │                   │
    │       │                    │  Tracking   │         │   Status    │                   │
    │       │                    └─────────────┘         └─────────────┘                   │
    │       │                                                                               │
    │       │                    ┌─────────────┐         ┌─────────────┐                   │
    │       │                    │   Manage    │         │   Review    │                   │
    │       └───────────────────▶│  Payment    │◇───────▶│  Transaction│                   │
    │                            │Transactions │         │    Logs     │                   │
    │                            └─────────────┘         └─────────────┘                   │
    │                                                                                       │
    └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case Relationships

### Include Relationships
- **Register** includes **Submit Student Verification**
- **Checkout** includes **Make Payment**
- **Create Shop** includes **Connect Stripe Account**

### Extend Relationships
- **Browse Products** extends to **Search Products**
- **View Product Details** extends to **Filter Products by Category**
- **Add to Cart** extends to **Update Cart**
- **View Cart** extends to **Remove from Cart**
- **Checkout** extends to **Select Address**
- **View Orders** extends to **Cancel Order**
- **Track Orders** extends to **View Tracking History**
- **Chat with Seller/Buyer** extends to **Send Message**
- **Rate Product** extends to **Write Review**
- **Manage Addresses** extends to **Add/Edit Address**

### Generalization Relationships
- **Buyer** and **Seller** generalize to **Student User** (both require verification)
- **Admin** is a specialized **System User** with elevated privileges

---

## Actor Descriptions

### Buyer
- **Primary Role**: Purchase products and services from sellers
- **Key Responsibilities**: Browse products, make purchases, communicate with sellers, provide feedback
- **Prerequisites**: Student verification required

### Seller  
- **Primary Role**: Sell products and services to buyers
- **Key Responsibilities**: Manage shop, add products, process orders, handle shipping, communicate with buyers
- **Prerequisites**: Student verification and Stripe account connection required

### Admin
- **Primary Role**: Platform administration and moderation
- **Key Responsibilities**: Verify students, manage users, handle disputes, monitor system health
- **Prerequisites**: Administrative access credentials

---

## System Boundaries

The UiTMMart system includes:
- **Web Application**: Next.js frontend and backend
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Communication**: Socket.io server
- **Authentication**: NextAuth.js system
- **File Storage**: Local file system for document uploads

External Systems:
- **Stripe**: Payment processing
- **Tracking.my**: Order tracking
- **OpenAI**: OCR text processing
- **Email Service**: Nodemailer for notifications

---

## Use Case Priorities

### High Priority (Core Features)
1. User Registration & Authentication
2. Student Verification System
3. Product Management (Add/Edit/Delete)
4. Order Creation & Payment Processing
5. Basic Chat Communication

### Medium Priority (Enhanced Features)
1. Advanced Search & Filtering
2. Order Tracking Integration
3. Admin Verification Review
4. Seller Analytics Dashboard
5. Rating & Review System

### Low Priority (Additional Features)
1. Advanced Admin Analytics
2. Bulk Product Management
3. Advanced Chat Features
4. Mobile App Integration
5. Multi-language Support

This comprehensive use case analysis provides a complete overview of the UiTMMart system functionality organized by the three main actors: Buyer, Seller, and Admin. 