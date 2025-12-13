import { z } from 'zod'

export const journeySchema = z.object({
  space_id: z.number(),
  date: z.string().date(),
  name: z.string().optional(),
  distance: z.number().int().min(1),
  fuel_cost: z.number().min(0.01),
  member_ids: z.array(z.string()).min(1),
  car_id: z.number(),
})