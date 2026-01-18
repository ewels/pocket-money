# Recurring Payments

Set up automatic allowance deposits on any schedule.

## Setting Up Allowance

1. Go to a child's settings (gear icon on their profile)
2. In the **Recurring Payments** section, click **Add Rule**
3. Enter the amount
4. Choose the frequency:
   - **Daily** - Every day
   - **Weekly** - Choose which day of the week
   - **Monthly** - Choose which day of the month (1-28)
5. Add an optional description (e.g., "Weekly allowance")
6. Click **Add**

![Add Recurring Payment](../assets/screenshots/add-recurring-modal.png)

The first payment will be deposited at the next scheduled time.

## Managing Recurring Payments

![Recurring Payments](../assets/screenshots/child-settings-configured.png)

Each recurring payment can be:

### Edited

Click the pencil icon to modify an existing rule:

- Change the amount
- Change the frequency and day
- Update the description

### Paused / Resumed

Toggle the rule on or off without deleting it. Useful for:

- Vacation periods
- When allowance is temporarily suspended
- Testing the setup

### Deleted

Remove the rule entirely. Use the trash icon to delete.

## Deductions

Instead of skipping payments entirely, you can add deductions that reduce upcoming payments. This is useful when:

- A child misbehaved and should receive less allowance
- You want to partially reduce (not skip) a payment
- You need flexibility in how much to deduct

### Adding a Deduction

1. Open a child's profile
2. Click the **Deduct** button (orange)
3. Enter the deduction amount (pre-filled with the next payment amount)
4. Add an optional description
5. Click **Add Deduction**

### How Deductions Work

- Deductions stack - you can add multiple deductions
- They are applied to payments in order (oldest first)
- If a deduction equals or exceeds a payment, the payment is skipped entirely
- If a deduction is less than a payment, the payment is reduced
- Any remaining deduction amount rolls over to the next payment

**Example:**

- Weekly allowance: $10
- Deduction added: $15
- First week: Payment skipped entirely ($10 consumed from deduction)
- Second week: Payment reduced to $5 ($5 remaining deduction consumed)
- Third week: Full $10 payment

### Managing Deductions

When deductions are pending, a card appears on the child's profile showing:

- Total deduction amount
- Number of pending deductions

Click the **Deduct** button or the arrow on the card to view and delete individual deductions.

## When Payments Run

Recurring payments are processed when the `/api/cron` endpoint is called. This should be configured to run daily - see the [Deployment Guide](../getting-started/deployment.md#set-up-recurring-payments).

!!! info "Timing"
    Payments are deposited when the cron job runs, typically once per day. The exact time depends on your cron schedule.

## Transaction Attribution

Recurring payments appear in the transaction history as:

- **Type**: Recurring (indicated by an icon)
- **Who**: System (no user attributed)
- **Description**: Whatever you set when creating the rule

## Examples

### Weekly Allowance on Saturdays

- Amount: $10
- Frequency: Weekly
- Day: Saturday
- Description: "Weekly allowance"

### Monthly Savings Bonus

- Amount: $5
- Frequency: Monthly
- Day: 1st of the month
- Description: "Monthly savings bonus"

### Daily Chore Payment

- Amount: $1
- Frequency: Daily
- Description: "Daily chores"
