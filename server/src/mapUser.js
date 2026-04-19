/** يطابق شكل المستخدم في الواجهة (بدون password_hash) */
export function mapUserRow(row) {
  if (!row) return null;
  const { password_hash: _p, ...rest } = row;
  return {
    ...rest,
    id: row.id,
    subscription_plan: row.subscription_plan || row.subscription_type || null,
    trial_end_date: row.trial_end_date ?? row.trial_ends_at ?? null,
    trial_ends_at: row.trial_ends_at ?? row.trial_end_date ?? null,
    settings: row.settings ?? {},
  };
}
