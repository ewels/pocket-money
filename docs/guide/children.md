# Managing Children

## Adding a Child

1. From the dashboard, click **Add Child**
2. Enter the child's name
3. Choose a color for their profile
4. Click **Add**

![Add Child Modal](../assets/screenshots/add-child-modal.png)

## Child Profile

Click on a child's card to view their profile:

- **Balance** - Current total balance
- **Balance History** - Chart showing balance changes over time
- **Upcoming Payments** - Next 3 scheduled allowance payments with dates
- **Saving Targets** - Progress toward savings goals (with quick-add button and time estimates)
- **Recent Transactions** - List of deposits and withdrawals
- **Pending Deductions** - Shows if any deductions will reduce upcoming payments

![Child Profile](../assets/screenshots/child-profile-with-transaction.png)

### Balance History

The Balance History chart has two display modes, toggled with the **Events / Time** buttons:

- **Events mode** (default) - Shows the last N individual transactions on the x-axis. Use the count buttons to choose how many events to display: **5**, **15** (default), **50**, or **All**
- **Time mode** - Shows balance over a calendar time range. Use the range buttons: **1W** (last 7 days), **1M** (last 30 days, default), **6M** (last 6 months), or **All** (all time)

## Adding Money

1. Open a child's profile
2. Click **Add Money**
3. Enter the amount
4. Optionally add a description (e.g., "Birthday money from Grandma")
5. Click confirm

![Add Money Modal](../assets/screenshots/add-money-modal.png)

## Withdrawing Money

1. Open a child's profile
2. Click **Withdraw**
3. Enter the amount (cannot exceed current balance)
4. Optionally add a description (e.g., "Bought a toy")
5. Click confirm

## Adding Deductions

Deductions reduce future recurring payments. See [Recurring Payments - Deductions](recurring-payments.md#deductions) for details.

1. Open a child's profile
2. Click the **Deduct** button (orange)
3. Enter the deduction amount
4. Optionally add a description
5. Click **Add Deduction**

## Editing a Child

Click the gear icon on a child's profile to access settings:

- **Name** - Change the child's display name
- **Color** - Change their profile color
- **Photo** - Upload a profile picture

## Deleting a Child

!!! warning "This cannot be undone"
    Deleting a child removes all their transactions, saving targets, and recurring rules.

1. Go to child settings (gear icon)
2. Scroll to the bottom
3. Click **Delete Child**
4. Confirm the deletion

## Transaction History

Each transaction shows:

- **Amount** - Positive (green) for deposits, negative (red) for withdrawals
- **Description** - Optional note about the transaction
- **Who** - Which family member made the transaction
- **When** - Date and time
- **Type** - Manual or recurring (automatic allowance)
