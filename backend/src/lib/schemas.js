'use strict';
const { z } = require('zod');

const PassengerSchema = z.object({
  type: z.enum(['ADT', 'CHD', 'INF']),
  pax_id: z.string().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['M', 'F']),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  document: z.object({
    type: z.string(),
    number: z.string().min(3),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    issuing_country: z.string().length(2).optional(),
    citizenship: z.string().length(2),
    country_of_issue: z.string().length(2).optional(),
  }),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  payment_method: z.string().optional(),
});

const DrctSearchSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  depart_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  adults: z.coerce.number().int().min(1).max(9).optional(),
  children: z.coerce.number().int().min(0).max(9).optional(),
  infants: z.coerce.number().int().min(0).max(9).optional(),
  cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  agency_id: z.string().optional(),
});

const WidgetOrderSchema = z.object({
  offer_id: z.string().min(1),
  passengers: z.array(PassengerSchema).min(1).max(9),
  contacts: z.object({
    email: z.string().email(),
    phone: z.string().min(7),
  }).optional(),
  agency_id: z.string().optional(),
  widget_token: z.string().optional(),
  booking_reference: z.string().optional(),
});

const OrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'queuing', 'failed', 'processing']),
  notes: z.string().optional(),
  cancelled_reason: z.string().optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  PassengerSchema,
  DrctSearchSchema,
  WidgetOrderSchema,
  OrderStatusSchema,
  validate,
};
