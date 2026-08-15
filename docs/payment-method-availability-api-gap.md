# API gap: read-only participant payment-method availability

The current backend contract exposes:

- `GET /payment-methods?scope=user&boardId={boardId}`: only the authenticated
  user's personal methods, including `enabled`.
- `GET /payment-methods?boardId={boardId}`: methods currently available for new
  movements, so explicitly disabled participant methods are omitted.
- `GET /payment-methods/{id}`: owner-only for `USER` methods.

Consequently, the frontend cannot list a disabled personal method belonging to
another participant in board settings. It must not infer that list or bypass the
owner-only endpoint.

## Minimum backend addition

Add a board-authorized, read-only query, for example:

`GET /payment-methods?scope=board-participants&boardId={boardId}`

Response:

```json
{
  "paymentMethods": [
    {
      "_id": "...",
      "ownerType": "user",
      "kind": "credit",
      "name": "Visa BBVA",
      "lastFourDigits": "9012",
      "isActive": true,
      "enabled": false,
      "userId": {
        "_id": "...",
        "firstName": "Paula",
        "lastName": "..."
      }
    }
  ]
}
```

Authorization and filtering requirements:

1. Require the authenticated user to be an active participant of `boardId`.
2. Return active `USER` payment methods owned by active participants of that
   board, including both enabled and disabled methods.
3. Include the owner identity already used by payment-method responses and the
   board-specific `enabled` value; do not expose additional private fields.
4. Keep visibility mutations owner-only. This query grants no edit permission.
5. Do not change `findAvailableForBoard`; movement selectors must continue to
   receive only enabled methods.

Once available, `ManagePaymentMethodsSection` can replace its read-only
participant source (`getAvailableForBoard`) with this query and render the
returned `enabled` state. No client-side availability rule is needed.

## Historical expense snapshot

Expense detail/list responses should continue returning the populated payment
method data already exposed as `card`, or preferably expose it explicitly as
`paymentMethodDetails`, even when that method is disabled for new movements.
Board access to the expense authorizes this embedded read-only snapshot; it does
not require relaxing `GET /payment-methods/{id}`. At minimum the snapshot needs
`_id`, `name`, `kind`, and `lastFourDigits`.
