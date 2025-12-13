import { z } from 'zod'

export const refillSchema = z.object({
  space_id: z.number(),
  date: z.string().date(),
  cost: z.number().min(1),
  fuel_cost: z.number().min(0.01),
  member_id: z.string(),
  car_id: z.number(),
})
