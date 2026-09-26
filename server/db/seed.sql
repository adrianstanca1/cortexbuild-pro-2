-- Seed data for CortexBuild Pro 2.0 demo workspace
INSERT INTO workspaces (id, name, company, plan) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Demo Workspace', 'CortexBuild Pro', 'pro');

INSERT INTO users (id, workspace_id, name, email, password_hash, role) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Adrian Stanca', 'adrian@cortexbuildpro.tech',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6z5W4FEx7o/GCp24TsE/Et88KfF.', 'director');

-- Demo projects
INSERT INTO projects (id, workspace_id, name, client, value, pct, status, addr, team_count, due, margin, risk_score, health_color) VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Riverside Commercial Block', 'Riverside Developments Ltd', 2500000, 45, 'active',
   '12 Riverside Road, London SW1', 12, '2026-12-15', 180000, 42, 'yellow'),

  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'South Bank IT Hub', 'TechPark Holdings', 8500000, 72, 'active',
   '45 South Bank, London SE1', 28, '2027-03-30', 520000, 28, 'green'),

  ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'King''s Cross Residential', 'KX Residential Ltd', 1200000, 25, 'quoting',
   '78 King''s Cross Road, London WC1', 6, '2026-10-01', 220000, 65, 'red'),

  ('f6a7b8c9-d0e1-2345-f012-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Shoreditch Warehouse Conversion', 'Shoreditch Developments', 3200000, 90, 'active',
   '92 Shoreditch High Street, London E1', 15, '2026-09-20', 180000, 18, 'green');

-- Demo tasks
INSERT INTO tasks (id, workspace_id, project_id, title, assignee, due, prio, done) VALUES
  ('t1-3d4e5f6a-7b8c-9012-def0-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Complete M&E first fix — all floors', 'James Wilson', '2026-08-15', 'high', false),
  ('t2-4e5f6a7b-8c9d-0123-ef01-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Structural steel inspection', 'Sarah Chen', '2026-08-10', 'high', true),
  ('t3-5f6a7b8c-9d0e-1234-f012-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Landscape groundwork — external areas', 'Mike O''Brien', '2026-09-01', 'med', false),
  ('t4-6a7b8c9d-0e1f-2345-0123-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123', 'Server room infrastructure installation', 'David Park', '2026-07-20', 'high', true);

-- Demo risks
INSERT INTO risks (id, workspace_id, project_id, type, title, probability, impact, status, mitigation, rsi, cp_70_30, cp_60_40) VALUES
  ('r1-7b8c9d0e-1f23-4567-8901-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'supply', 'Steel beam delivery delay — EU supply chain disruption',
   65, 70, 'open', 'Identify UK alternative supplier, allow 3-week buffer in schedule', 45.5, 52.5, 48.0),
  ('r2-8c9d0e1f-2345-6789-0123-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'labor', 'M&E subcontractor availability — peak summer holiday period',
   75, 55, 'mitigated', 'Confirm subcontractor roster 6 weeks ahead, have backup firm on standby', 41.3, 60.0, 54.0),
  ('r3-9d0e1f23-4567-8901-2345-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123', 'cost', 'Server hardware cost inflation — 15% increase projected',
   60, 45, 'open', 'Lock in prices with supplier under fixed-price agreement', 27.0, 36.0, 33.0),
  ('r4-0e1f2345-6789-0123-3456-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'e5f6a7b8-c9d0-1234-ef01-345678901234', 'safety', 'Working at height — residential facade works over public footpath',
   40, 85, 'open', 'Install full pedestrian protection barriers, restrict working hours to 8am-6pm', 34.0, 38.0, 36.0);

-- Demo snags
INSERT INTO snags (id, workspace_id, project_id, ai_description, ai_confidence, location, snag_type, priority, status) VALUES
  ('s1-1f234567-8901-2345-5678-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Hairline cracks observed in freshly poured concrete slab — approximately 2mm width, extending 300mm along the northeast corner of Level 2 floor', 92, 'Level 2, NE corner', 'hairline', 'high', 'open'),
  ('s2-2f345678-9012-3456-6789-789012345678', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123', 'Water staining and potential damp patch on reinforced concrete wall — dark discoloration approximately 400mm x 200mm, possible moisture ingress', 88, 'Server room, east wall', 'damp', 'med', 'open'),
  ('s3-3f456789-0123-4567-7890-890123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Missing fire sealant around penetrations in fire-rated partition — gaps visible at several cable and pipe penetrations through the 2-hour fire wall on Level 3', 95, 'Level 3, fire wall, 3 locations', 'fire-safety', 'high', 'open');

-- Demo daily log
INSERT INTO daily_logs (id, workspace_id, project_id, log_date, crew_count, narrative, ai_summary) VALUES
  ('dl1-4f567890-1234-5678-8901-901234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', '2026-07-20', 14,
   'Worked on M&E first fix throughout the day. Installed 45 socket outlets on Level 2, ran 200m of 25mm conduit. Structural steel inspection completed by Sarah — passed with minor recommendations for weld inspection on bay 3. Weather was good, dry and 22°C, no delays. Pump for concrete delivery ran 2 hours behind due to traffic on the A13, but worked around it by re-sequencing the pour schedule. Crew of 14 including 3 subcontractors for electrical. Next: continue with Level 3 first fix, start reinforcement for column bases on east wing.',
   'M&E first fix progressed on Level 2 — 45 sockets installed, 200m conduit run. Steel inspection passed with minor weld recommendations. Weather clear, 22°C. Concrete pump delayed 2 hours due to A13 traffic but schedule adjusted. Crew: 14 (3 electrical subs). Next: Level 3 first fix + east wing reinforcement.'),
  ('dl2-5f678901-2345-6789-9012-012345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123', '2026-07-21', 28,
   'Server room fit-out day. Installed 12 server racks in the raised floor area, completed all power distribution units, cold aisle containment panels fitted. HVAC commissioning started — rooftop units connected and pressure tested. IT team on site for rack layout verification. No safety incidents. Ended at 6pm.',
   'Server room fit-out: 12 racks installed, PDUs connected, cold aisle containment complete. HVAC pressure testing started on rooftop units. IT team verified rack layout. No incidents. Finished at 18:00.'),

  ('dl3-6f789012-3456-7890-0123-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'f6a7b8c9-d0e1-2345-f012-456789012345', '2026-07-19', 12,
   'Third day of demolition inside the warehouse. Removed non-load-bearing internal walls on the north side, approximately 80m². Found original timber floor structure underneath — in better condition than expected. Breathing apparatus not required, dust extraction working well. Neighbors complained about noise at 3pm, resolved by explaining scheduled hours. Tomorrow: start structural survey of the retained elements.',
   'Demolition progressed on north side internal walls — 80m² removed. Original timber floor discovered in good condition. Dust extraction effective, no RPE needed. Noise complaint from neighbor resolved. Tomorrow: structural survey of retained elements.'),

  ('dl4-7f890123-4567-8901-1234-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'f6a7b8c9-d0e1-2345-f012-456789012345', '2026-07-18', 10,
   'Site set-up day. Erected site compound, installed temporary fencing around the perimeter, set up site office and welfare containers. Delivered first batch of plant equipment — 2x excavators, 1x telehandler. Ground survey team arrived and started topsoil sampling. First aid kit and fire extinguishers positioned at all entry points. Toolbox talk completed — all 10 crew signed in.',
   'Site compound established: fencing, site office, welfare units. Plant delivered: 2 excavators, 1 telehandler. Ground survey team started topsoil sampling. Safety equipment positioned. Toolbox talk done — 10 crew signed in.');

-- Demo subcontractors
INSERT INTO subcontractors (id, workspace_id, name, trade, contact, email, phone, rating, completed_jobs, avg_days, reliability, specializations) VALUES
  ('sc1-8f901234-5678-9012-2345-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Vertex Electrical Ltd', 'Electrical', 'Dave Williams', 'dave@vertexelectrical.co.uk', '07800 123 456', 4.7, 28, 18.5, 88,
   '["M&E", "Data comms", "BMS", "Fire alarms", "Lighting"]'),

  ('sc2-9f012345-6789-0123-3456-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Premier Plumbing & Heating', 'Plumbing', 'Steve Johnson', 'steve@premierplumbing.co.uk', '07900 234 567', 4.5, 15, 12.0, 82,
   '["Hot and cold water", "Gas heating", "Fire sprinkler systems", "Rainwater drainage"]'),

  ('sc3-0f123456-7890-1234-4567-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Apex HVAC Services', 'HVAC', 'Tom Richards', 'tom@apexhvac.co.uk', '07700 345 678', 4.8, 22, 21.0, 75,
   '["Industrial ventilation", "Air conditioning", "Heat recovery", "Clean room systems"]'),

  ('sc4-1f234567-8901-2345-5678-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Ironclad Structural Ltd', 'Structural', 'Laura Mitchell', 'laura@ironcladstructural.co.uk', '07600 456 789', 4.9, 35, 30.0, 92,
   '["Steel frames", "Concrete reinforcement", "Post-tensioning", "Structural surveys"]');

-- Demo bid opportunities
INSERT INTO bid_opportunities (id, workspace_id, project_id, scope_desc, estimated_value, trade, status, created_at) VALUES
  ('bo1-2f345678-9012-3456-6789-789012345678', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'First and second fix electrical — complete M&E installation for a 6-storey commercial block. Includes all socket outlets, lighting, data comms, fire alarm system, and BMS integration. Approximately 200 socket outlets, 50 light fittings, 8 consumer units.',
   85000, 'Electrical', 'published', '2026-07-01T09:00:00Z'),

  ('bo2-3f456789-0123-4567-7890-890123456789', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123',
   'Full HVAC system installation for a 10,000 sq ft server hall and associated office spaces. Requires industrial cooling units, precision air conditioning, heat recovery ventilation, and controls integration with building management system.',
   180000, 'HVAC', 'published', '2026-07-10T10:00:00Z');

-- Demo RFIs
INSERT INTO rfis (id, workspace_id, project_id, question, ref_drawing, ref_location, priority, status, submitted_to, ai_generated) VALUES
  ('rfi1-4f567890-1234-5678-8901-901234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'What is the specified fire rating for the partition walls on Level 2 between offices and the corridor? The specs reference Euroclass B-s1, d0 but we need confirmation for the ceiling assembly integration.',
   'Drawing A-102', 'Level 2, east corridor partition',
   'high', 'open', 'Design Architect', false),

  ('rfi2-5f678901-2345-6789-9012-012345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012',
   'Can we confirm the structural loading allowance for the rooftop plant room? The current design shows 500kg/m² but the HVAC consultant is proposing equipment that may exceed this.',
   'Drawing S-203', 'Rooftop plant room, northeast section',
   'high', 'open', 'Structural Engineer', true);

-- Demo invoices
INSERT INTO invoices (id, workspace_id, project_id, client, amount, status, issued, due) VALUES
  ('INV-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Riverside Developments Ltd',
   250000, 'due', '2026-06-01', '2026-07-01'),

  ('INV-002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd4e5f6a7-b8c9-0123-def0-234567890123', 'TechPark Holdings',
   500000, 'paid', '2026-05-15', '2026-06-15', '2026-06-10');

-- Demo quotes
INSERT INTO quotes (id, workspace_id, project_id, client, title, total, status, issued, valid_until) VALUES
  ('QT-001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'e5f6a7b8-c9d0-1234-ef01-345678901234', 'KX Residential Ltd',
   'King''s Cross Residential — Full Build Contract', 1200000, 'sent', '2026-07-05', '2026-08-05');

-- Demo team members
INSERT INTO team_members (id, workspace_id, name, role, color, site, hours, status, cscs, phone, email, day_rate, certificates, skills) VALUES
  ('tm1-5f678901-2345-6789-9012-012345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'James Wilson', 'Site Manager', '#58a6ff', 'Riverside', 7.5, 'on-site', 'CSCS Blue', '07700 111 222', 'james@cortexbuildpro.tech', 380,
   '["CSCS Blue Card", "SMSTS", "First Aid"]', '["Site management", "M&E coordination", "Risk assessment"]'),

  ('tm2-6f789012-3456-7890-0123-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Sarah Chen', 'Structural Engineer', '#a371f7', 'Riverside', 8.0, 'on-site', 'CSCS Gold', '07700 222 333', 'sarah@cortexbuildpro.tech', 450,
   '["Chartered Engineer", "CSCS Gold", "ISO 9001 Auditor"]', '["Structural design", "Steelwork inspection", "Concrete tech"]'),

  ('tm3-7f890123-4567-8901-1234-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Mike O''Brien', 'Groundworker', '#3fb950', 'Riverside', 8.0, 'on-site', 'CSCS Green', '07700 333 444', 'mike@cortexbuildpro.tech', 220,
   '["CSCS Green Card", "NPORS", "Leisure Operative"]', '["Excavation", "Ground preparation", "Drainage", "Roadworks"]'),

  ('tm4-8f901234-5678-9012-2345-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'David Park', 'M&E Coordinator', '#d29922', 'South Bank', 8.0, 'on-site', 'CSCS Blue', '07700 444 555', 'david@cortexbuildpro.tech', 340,
   '["CSCS Blue Card", "18th Edition", "SELV"]', '["Electrical oversight", "Cable sizing", "Testing & inspection"]');
