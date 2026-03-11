import { useQuery } from '@tanstack/react-query';
import {
  getProfile,
  getOrdersList,
  getAdminAgencies,
  getAdminSuperAdmins,
  getAdminInvoices,
  getAdminTickets,
  getEmailTemplates,
} from '../lib/supabase';

// Profile
export function useProfile(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
    select: (r) => r?.data ?? r,
  });
}

// Orders (admin or agent)
export function useOrders({ userId, agencyId, limit = 200 } = {}) {
  return useQuery({
    queryKey: ['orders', { userId, agencyId }],
    queryFn: () => getOrdersList({ userId, agencyId, limit }),
    staleTime: 15_000,
    select: (r) => r?.data ?? r ?? [],
  });
}

// Super admins (flat list)
export function useSuperAdmins(enabled = true) {
  return useQuery({
    queryKey: ['superAdmins'],
    queryFn: getAdminSuperAdmins,
    enabled,
    select: (r) => r?.data ?? r ?? [],
  });
}

// Agencies with filters matching getAdminAgencies params: { q, is_active }
export function useAgencies(filters = {}, enabled = true) {
  const { q, is_active } = filters;
  return useQuery({
    queryKey: ['agencies', { q, is_active }],
    queryFn: () => getAdminAgencies({ q: q || undefined, is_active: is_active === 'all' ? undefined : is_active }),
    enabled,
    select: (r) => r?.data ?? r ?? [],
  });
}

// Invoices with filters matching getAdminInvoices params: { agency_id, currency, date_from, date_to }
export function useInvoices(filters = {}, enabled = true) {
  const { agency_id, currency, date_from, date_to } = filters;
  return useQuery({
    queryKey: ['invoices', { agency_id, currency, date_from, date_to }],
    queryFn: () => getAdminInvoices({ agency_id: agency_id || undefined, currency: currency || undefined, date_from: date_from || undefined, date_to: date_to || undefined }),
    enabled,
    select: (r) => r?.data ?? r ?? [],
  });
}

// Tickets with filters matching getAdminTickets params
export function useTickets(filters = {}, enabled = true) {
  const { agency_id, order_status, status, email_status, date_from, date_to, q } = filters;
  return useQuery({
    queryKey: ['tickets', { agency_id, order_status, status, email_status, date_from, date_to, q }],
    queryFn: () => getAdminTickets({
      agency_id: agency_id || undefined,
      order_status: order_status || undefined,
      status: status || undefined,
      email_status: email_status || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      q: q || undefined,
    }),
    enabled,
    select: (r) => {
      const rows = r?.data ?? r ?? [];
      return [...rows].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    },
  });
}

// Email templates
export function useEmailTemplates(enabled = true) {
  return useQuery({
    queryKey: ['emailTemplates'],
    queryFn: getEmailTemplates,
    enabled,
    select: (r) => r?.data ?? r ?? [],
  });
}
