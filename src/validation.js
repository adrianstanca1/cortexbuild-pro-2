import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  client: z.string().max(200).optional(),
  value: z.string().optional(),
  addr: z.string().max(500).optional(),
  due: z.string().optional(),
})

export const taskSchema = z.object({
  project_id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  assignee: z.string().max(200).optional(),
  due: z.string().optional(),
  prio: z.enum(['low', 'med', 'high']).optional(),
})

export const snagSchema = z.object({
  project_id: z.string().uuid().optional(),
  photo_url: z.string().url().optional(),
  photo_thumb: z.string().url().optional(),
  location: z.string().max(200).optional(),
  voice_note: z.string().max(5000).optional(),
})

export const riskSchema = z.object({
  project_id: z.string().uuid().optional(),
  type: z.enum(['cost_overrun', 'delay', 'safety', 'quality', 'supply', 'design', 'contract', 'force_majeure']),
  title: z.string().min(1).max(300),
  probability: z.number().min(0).max(100).optional(),
  impact: z.number().min(0).max(100).optional(),
  predicted_date: z.string().optional(),
  mitigation: z.string().max(2000).optional(),
})

export const dailyLogSchema = z.object({
  project_id: z.string().uuid().optional(),
  log_date: z.string().optional(),
  voice_note: z.string().max(10000).optional(),
  photos: z.array(z.string()).optional(),
  crew_count: z.number().int().min(0).optional(),
})

export const rfiSchema = z.object({
  project_id: z.string().uuid().optional(),
  trigger: z.string().max(100).optional(),
  context: z.record(z.unknown()).optional(),
  ref_drawing: z.string().max(200).optional(),
})

export const subcontractorSchema = z.object({
  name: z.string().min(1).max(200),
  trade: z.string().min(1).max(100),
  contact: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  rating: z.number().min(0).max(5).optional(),
  specializations: z.array(z.string()).optional(),
})

export const subcontractorMatchSchema = z.object({
  project_id: z.string().uuid().optional(),
  scope_desc: z.string().min(1).max(5000),
  trade: z.string().max(100).optional(),
  estimated_value: z.string().optional(),
})

export const bidOpportunitySchema = z.object({
  project_id: z.string().uuid().optional(),
  scope_desc: z.string().min(1).max(5000),
  estimated_value: z.string().optional(),
  trade: z.string().max(100).optional(),
})

export const sitePhotoSchema = z.object({
  project_id: z.string().uuid().optional(),
  photo_url: z.string().url(),
  location: z.string().max(200).optional(),
})

export const teamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(100).optional(),
  site: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional(),
  cscs: z.string().max(50).optional(),
  day_rate: z.string().optional(),
  color: z.string().max(20).optional(),
  skills: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  certificates: z.array(z.string()).optional(),
})

export const aiAgentSchema = z.object({
  message: z.string().min(1).max(10000),
  project_id: z.string().uuid().optional(),
})

export const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
})

export const assignSchema = z.object({
  assigned_to: z.string().max(200).optional(),
})

export const prioritySchema = z.object({
  priority: z.enum(['low', 'med', 'high', 'critical']).optional(),
})

export const queryProjectSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
})

export const queryTaskSchema = z.object({
  project_id: z.string().uuid().optional(),
  done: z.boolean().optional(),
})

export const querySnagSchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
})

export const queryRFISchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
})

export const queryRiskSchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.enum(['open', 'monitoring', 'mitigated', 'realized']).optional(),
  type: z.string().optional(),
})

export const queryDailyLogSchema = z.object({
  project_id: z.string().uuid().optional(),
  log_date: z.string().optional(),
})

export const querySubcontractorSchema = z.object({
  trade: z.string().optional(),
})

export const queryBidSchema = z.object({
  status: z.enum(['draft', 'published', 'awarded', 'cancelled']).optional(),
})

export const querySitePhotoSchema = z.object({
  project_id: z.string().uuid().optional(),
})

export const collectionSchema = z.object({
  doc_id: z.string().optional(),
})
