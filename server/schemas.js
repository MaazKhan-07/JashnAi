/**
 * Zod validation schemas for all API inputs and AI outputs.
 */
import { z } from 'zod';

/** Allowed event types */
export const EventType = z.enum(['wedding', 'birthday', 'community']);

/** Allowed currencies */
export const Currency = z.enum(['INR', 'USD', 'EUR', 'GBP']);

/** Budget generation request */
export const BudgetRequestSchema = z.object({
  eventType: EventType,
  totalBudget: z.number().positive().max(1_000_000_000),
  currency: Currency.default('INR'),
  guestCount: z.number().int().positive().max(100_000),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priorities: z.array(z.string().max(50)).max(5).default([]),
}).strict();

/** Timeline generation request */
export const TimelineRequestSchema = z.object({
  eventType: EventType,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventName: z.string().max(200).optional(),
}).strict();

/** AI ideas request */
export const IdeasRequestSchema = z.object({
  eventType: EventType,
  eventName: z.string().max(200).default('My Event'),
  guestCount: z.number().int().positive().max(100_000),
  style: z.string().max(200).default(''),
  dietary: z.array(z.string().max(50)).max(10).default([]),
  priorities: z.array(z.string().max(50)).max(5).default([]),
  budget: z.number().positive().max(1_000_000_000),
  currency: Currency.default('INR'),
  city: z.string().max(100).default(''),
}).strict();

/** AI chat request */
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    eventName: z.string().max(200).default(''),
    eventType: EventType.optional(),
    totalBudget: z.number().nonnegative().default(0),
    totalSpent: z.number().nonnegative().default(0),
    currency: z.string().max(10).default('INR'),
    guestCount: z.number().int().nonnegative().default(0),
    confirmedGuests: z.number().int().nonnegative().default(0),
    eventDate: z.string().default(''),
    daysToEvent: z.number().int().default(0),
    readinessScore: z.number().min(0).max(100).default(0),
    nextActions: z.array(z.string().max(500)).max(10).default([]),
    upcomingTasks: z.array(z.object({
      task: z.string().max(300),
      dueDate: z.string().max(20),
      status: z.string().max(20),
    })).max(20).default([]),
    budgetItems: z.array(z.object({
      category: z.string().max(50),
      allocated: z.number().nonnegative(),
      spent: z.number().nonnegative(),
    })).max(30).default([]),
    risks: z.array(z.object({
      type: z.string().max(50),
      message: z.string().max(500),
      severity: z.string().max(20).optional(),
    })).max(20).default([]),
  }).default({}),
}).strict();

/** Readiness score request */
export const ReadinessRequestSchema = z.object({
  tasks: z.array(z.object({
    status: z.enum(['todo', 'in-progress', 'done']),
    priority: z.enum(['high', 'medium', 'low']),
    critical: z.boolean().default(false),
    dueDate: z.string(),
  })).max(500).default([]),
  vendors: z.array(z.object({
    status: z.enum(['to-contact', 'quoted', 'booked', 'paid']),
    category: z.string().max(50).optional(),
  })).max(100).default([]),
  budgetItems: z.array(z.object({
    category: z.string().max(50),
    allocated: z.number().nonnegative(),
    spent: z.number().nonnegative(),
  })).max(30).default([]),
  totalBudget: z.number().nonnegative().default(0),
  guests: z.array(z.object({
    rsvp: z.enum(['invited', 'confirmed', 'declined', 'tentative']),
  })).max(10000).default([]),
  eventDate: z.string().default(''),
}).strict();

/**
 * AI response schema for idea generation (validates Gemini output).
 */
export const AIIdeasResponseSchema = z.object({
  themes: z.array(z.string().max(500)).min(1).max(10),
  decor: z.array(z.string().max(500)).min(1).max(10),
  menu: z.array(z.string().max(500)).min(1).max(10),
  entertainment: z.array(z.string().max(500)).min(1).max(10),
  returnGifts: z.array(z.string().max(500)).min(1).max(10),
  invitationWording: z.string().max(2000),
  runOfShow: z.array(z.string().max(500)).min(1).max(20),
});
