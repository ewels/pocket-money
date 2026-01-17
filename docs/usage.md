# User Guide

## Getting Started

### Creating an Account

1. Visit the app and click "Register"
2. Enter your name, email, and password
3. Optionally enter an invite code if joining an existing family
4. Click "Create account"

**Without invite code**: A new family is created for you automatically.

**With invite code**: You join the existing family and can immediately see their children.

### Inviting Family Members

1. Go to **Settings**
2. In the "Family" section, click "Generate Invite Code"
3. Share the 8-character code with your family member
4. They enter this code when registering
5. Codes expire after 7 days and can only be used once

## Managing Children

### Adding a Child

1. From the dashboard, click "Add Child"
2. Enter the child's name
3. Choose a color for their profile
4. Click "Add"

### Child Profile

Click on a child's card to view their profile:

- **Balance**: Current total balance
- **Balance History**: 30-day chart showing balance changes
- **Saving Targets**: Progress toward savings goals
- **Recent Transactions**: List of recent deposits and withdrawals
- **Recurring Payments**: Active automatic payments

### Adding/Withdrawing Money

1. Open a child's profile
2. Click "Add" or "Withdraw"
3. Enter the amount and optional description
4. Click confirm

### Editing Child Settings

Click the gear icon on a child's profile to access settings:

- Change name and color
- Upload a profile photo
- Manage saving targets
- Set up recurring payments
- Delete the child profile

## Saving Targets

### Creating a Target

1. Go to a child's settings
2. In "Saving Targets", click "Add Target"
3. Enter the target name (e.g., "New Bike")
4. Enter the target amount
5. Click "Add"

### Tracking Progress

Saving targets appear on the child's profile with a progress bar showing how close they are to their goal based on current balance.

## Recurring Payments

### Setting Up Allowance

1. Go to a child's settings
2. In "Recurring Payments", click "Add Rule"
3. Enter the amount
4. Choose the interval:
   - Daily (every day)
   - Weekly (every 7 days)
   - Bi-weekly (every 14 days)
   - Monthly (every 30 days)
5. Add an optional description (e.g., "Weekly allowance")
6. Click "Add"

### Managing Recurring Payments

- **Pause/Resume**: Toggle the rule on or off
- **Skip Next**: Skip just the next scheduled payment
- **Delete**: Remove the rule entirely

### When Payments Run

Recurring payments are processed when the `/api/cron` endpoint is called. This should be set up to run daily (see [installation guide](installation.md)).

## Settings

### Currency

Change the display currency in Settings. Supported currencies:

- EUR (Euro)
- GBP (British Pound)
- USD (US Dollar)
- SEK, NOK, DKK (Scandinavian)
- CHF (Swiss Franc)
- AUD, CAD (Australian/Canadian Dollar)
- JPY (Japanese Yen)
- PLN, CZK (Polish Zloty, Czech Koruna)

**Note**: Currency is a display setting only. It doesn't convert values.

### PIN Protection

Add extra security by requiring a PIN after periods of inactivity:

1. Go to Settings
2. Click "Enable PIN"
3. Enter a 4-6 digit PIN
4. Confirm the PIN

PIN timeout options: 1, 2, 5, or 10 minutes.

**Note**: PIN settings are shared across all family members.

## Profile

### Updating Your Profile

1. Click your profile icon in the header
2. Update your name or upload a photo
3. Click "Save"

### Logging Out

Click the logout button in the header navigation.

## Tips

### For Parents

- Set up recurring payments to automate allowance
- Use the transaction history to see who made each deposit/withdrawal
- Create saving targets to teach financial goals

### For Multiple Parents/Guardians

- Use invite codes to share access
- All family members can add/withdraw money
- Transactions show which parent made them
- Settings (currency, PIN) are shared per-family

### Mobile Use

The app is a Progressive Web App (PWA) and works great on mobile:

- Add to home screen for app-like experience
- Works offline for viewing (requires connection for changes)
- Touch-friendly interface
