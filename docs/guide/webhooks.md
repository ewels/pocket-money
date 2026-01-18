# Webhooks

Pocket Money can send HTTP notifications when events occur, allowing you to integrate with external services like Home Assistant, IFTTT, or custom automations.

## Configuration

1. Go to **Settings**
2. Find the **Webhook** section
3. Enter your webhook URL
4. Click **Save Webhook**

The webhook URL will receive POST requests with JSON data whenever events occur.

## Event Types

| Event                         | Description                        |
| ----------------------------- | ---------------------------------- |
| `transaction.created`         | A deposit or withdrawal was made   |
| `recurring_payment.processed` | A recurring payment was processed  |
| `child.created`               | A new child profile was created    |
| `child.updated`               | A child profile was updated        |
| `child.deleted`               | A child profile was deleted        |

## Payload Format

All webhook payloads follow this structure:

```json
{
  "event": "transaction.created",
  "timestamp": 1705590000,
  "family_id": "uuid-here",
  "data": {
    // Event-specific data
  }
}
```

### transaction.created

```json
{
  "event": "transaction.created",
  "timestamp": 1705590000,
  "family_id": "abc123",
  "data": {
    "transaction_id": "txn-uuid",
    "child_id": "child-uuid",
    "child_name": "Alice",
    "amount": 5.00,
    "description": "Weekly allowance",
    "type": "deposit",
    "new_balance": 25.50,
    "user_id": "user-uuid",
    "user_name": "Dad"
  }
}
```

For withdrawals, `amount` will be negative and `type` will be `"withdrawal"`.

### recurring_payment.processed

```json
{
  "event": "recurring_payment.processed",
  "timestamp": 1705590000,
  "family_id": "abc123",
  "data": {
    "transaction_id": "txn-uuid",
    "child_id": "child-uuid",
    "child_name": "Alice",
    "amount": 5.00,
    "description": "Weekly allowance",
    "new_balance": 30.50,
    "rule_id": "rule-uuid",
    "next_payment_at": 1706194800
  }
}
```

### child.created / child.updated

```json
{
  "event": "child.created",
  "timestamp": 1705590000,
  "family_id": "abc123",
  "data": {
    "child_id": "child-uuid",
    "name": "Alice",
    "color": "pink"
  }
}
```

### child.deleted

```json
{
  "event": "child.deleted",
  "timestamp": 1705590000,
  "family_id": "abc123",
  "data": {
    "child_id": "child-uuid",
    "name": "Alice"
  }
}
```

## Home Assistant Integration

You can use webhooks to send notifications to Home Assistant when transactions occur.

### Setting Up Home Assistant

1. In Home Assistant, create an automation trigger using a webhook:

```yaml
automation:
  - alias: "Pocket Money Notification"
    trigger:
      - platform: webhook
        webhook_id: pocket-money-events
        allowed_methods:
          - POST
    action:
      - choose:
          - conditions:
              - condition: template
                value_template: "{{ trigger.json.event == 'transaction.created' }}"
            sequence:
              - service: notify.mobile_app_your_phone
                data:
                  title: "Pocket Money"
                  message: >
                    {% if trigger.json.data.type == 'deposit' %}
                    {{ trigger.json.data.child_name }} received {{ trigger.json.data.amount | round(2) }}
                    {% else %}
                    {{ trigger.json.data.child_name }} spent {{ (trigger.json.data.amount | abs) | round(2) }}
                    {% endif %}
                    {% if trigger.json.data.description %}
                    ({{ trigger.json.data.description }})
                    {% endif %}
          - conditions:
              - condition: template
                value_template: "{{ trigger.json.event == 'recurring_payment.processed' }}"
            sequence:
              - service: notify.mobile_app_your_phone
                data:
                  title: "Pocket Money - Allowance"
                  message: >
                    {{ trigger.json.data.child_name }}'s allowance of {{ trigger.json.data.amount | round(2) }} has been deposited.
                    New balance: {{ trigger.json.data.new_balance | round(2) }}
```

2. Get your webhook URL from Home Assistant (it will be something like `https://your-ha-instance.duckdns.org/api/webhook/pocket-money-events`)

3. Enter this URL in Pocket Money's webhook settings

### Security Considerations

- Use HTTPS for your webhook URL
- Consider using a unique, hard-to-guess webhook ID
- If your Home Assistant instance is publicly accessible, consider adding authentication

## Testing Webhooks

You can use services like [webhook.site](https://webhook.site) to test your webhook configuration before connecting to Home Assistant or other services.

1. Visit webhook.site and copy your unique URL
2. Enter that URL in Pocket Money's webhook settings
3. Perform an action (like adding money to a child)
4. Check webhook.site to see the received payload

## Troubleshooting

**Webhooks not firing:**

- Ensure the webhook URL is valid and accessible
- Check that your server accepts POST requests
- Webhooks fail silently to not affect app functionality

**Home Assistant not receiving webhooks:**

- Verify Home Assistant is accessible from the internet
- Check that the webhook trigger is correctly configured
- Review Home Assistant logs for incoming webhook requests
