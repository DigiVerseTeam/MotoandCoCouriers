insert into public.master_data_changes
  (id, change_type, target_id, field, old_value, new_value, reason, status, approved_by_owner, effective_date)
values
  ('00000000-0000-4000-9000-000000000101', 'pricing', '00000000-0000-4000-8000-000000000101', 'initial_price_rule', '', '1 tyre', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000102', 'pricing', '00000000-0000-4000-8000-000000000102', 'initial_price_rule', '', '2 tyres', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000103', 'pricing', '00000000-0000-4000-8000-000000000103', 'initial_price_rule', '', '3 tyres', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000104', 'pricing', '00000000-0000-4000-8000-000000000104', 'initial_price_rule', '', '4 or more tyres', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000105', 'pricing', '00000000-0000-4000-8000-000000000105', 'initial_price_rule', '', 'Up to 5 kg', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000106', 'pricing', '00000000-0000-4000-8000-000000000106', 'initial_price_rule', '', '5 kg to 10 kg', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000107', 'pricing', '00000000-0000-4000-8000-000000000107', 'initial_price_rule', '', '10 kg+', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000108', 'pricing', '00000000-0000-4000-8000-000000000108', 'initial_price_rule', '', 'After 2nd failed attempt', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000109', 'pricing', '00000000-0000-4000-8000-000000000109', 'initial_price_rule', '', 'Return to Supplier (pre-labelled)', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01'),
  ('00000000-0000-4000-9000-000000000110', 'pricing', '00000000-0000-4000-8000-000000000110', 'initial_price_rule', '', 'Out-of-Zone Delivery', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', 'executed', 'Policy #9 / SOP-MDM-02 initial approved pricing schedule', '2026-06-01')
on conflict (id) do update set
  reason = excluded.reason,
  status = excluded.status,
  approved_by_owner = excluded.approved_by_owner,
  effective_date = excluded.effective_date;

insert into public.price_rules
  (id, service_variant, label, item_type, tyre_count_min, tyre_count_max, weight_band, rate_cents, rate_mode, effective_from, status, change_log_id)
values
  ('00000000-0000-4000-8000-000000000101', 'SVC-MCL-001-T', '1 tyre', 'tyre', 1, 1, null, 1850, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000101'),
  ('00000000-0000-4000-8000-000000000102', 'SVC-MCL-001-T', '2 tyres', 'tyre', 2, 2, null, 2400, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000102'),
  ('00000000-0000-4000-8000-000000000103', 'SVC-MCL-001-T', '3 tyres', 'tyre', 3, 3, null, 3300, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000103'),
  ('00000000-0000-4000-8000-000000000104', 'SVC-MCL-001-T', '4 or more tyres', 'tyre', 4, null, null, 1230, 'per_item', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000104'),
  ('00000000-0000-4000-8000-000000000105', 'SVC-MCL-001-P', 'Up to 5 kg', 'parts', null, null, 'up_to_5kg', 1720, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000105'),
  ('00000000-0000-4000-8000-000000000106', 'SVC-MCL-001-P', '5 kg to 10 kg', 'parts', null, null, '5_to_10kg', 2100, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000106'),
  ('00000000-0000-4000-8000-000000000107', 'SVC-MCL-001-P', '10 kg+', 'parts', null, null, '10kg_plus', 2500, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000107'),
  ('00000000-0000-4000-8000-000000000108', 'REDELIVERY', 'After 2nd failed attempt', 'redelivery', null, null, null, 1000, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000108'),
  ('00000000-0000-4000-8000-000000000109', 'RETURN_SUPPLIER', 'Return to Supplier (pre-labelled)', 'return', null, null, null, 600, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000109'),
  ('00000000-0000-4000-8000-000000000110', 'OUT_OF_ZONE', 'Out-of-Zone Delivery', 'surcharge', null, null, null, 1000, 'flat', '2026-06-01', 'active', '00000000-0000-4000-9000-000000000110')
on conflict (id) do update set
  service_variant = excluded.service_variant,
  label = excluded.label,
  item_type = excluded.item_type,
  tyre_count_min = excluded.tyre_count_min,
  tyre_count_max = excluded.tyre_count_max,
  weight_band = excluded.weight_band,
  rate_cents = excluded.rate_cents,
  rate_mode = excluded.rate_mode,
  effective_from = excluded.effective_from,
  status = excluded.status,
  change_log_id = excluded.change_log_id;
