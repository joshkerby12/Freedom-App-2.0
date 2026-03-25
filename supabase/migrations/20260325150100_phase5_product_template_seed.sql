-- TASK-027: Seed product catalog system templates (shell records)

create or replace function public.seed_product_catalog_templates(target_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.product_catalog (
    org_id,
    name,
    category,
    pricing_mode,
    is_system_template,
    is_active,
    sort_order
  )
  select
    target_org_id,
    template.name,
    template.category,
    template.pricing_mode,
    true,
    true,
    template.sort_order
  from (
    values
      ('Paver Patio', 'hardscape', 'cost_plus', 10),
      ('Paver Walkway', 'hardscape', 'cost_plus', 20),
      ('Paver Driveway', 'hardscape', 'cost_plus', 30),
      ('Flagstone Patio', 'hardscape', 'cost_plus', 40),
      ('Flagstone Walkway', 'hardscape', 'cost_plus', 50),
      ('Flagstone Steps', 'hardscape', 'cost_plus', 60),
      ('Step Units', 'hardscape', 'cost_plus', 70),
      ('Retaining Wall (block)', 'hardscape', 'cost_plus', 80),
      ('Boulder Wall', 'hardscape', 'cost_plus', 90),
      ('Seat Wall', 'hardscape', 'cost_plus', 100),
      ('Block Border', 'hardscape', 'cost_plus', 110),
      ('3/4" Rock Bed', 'hardscape', 'cost_plus', 120),
      ('1.5" Rock Bed', 'hardscape', 'cost_plus', 130),
      ('2+" Rock / Boulders', 'hardscape', 'cost_plus', 140),
      ('Breeze / Decomposed Granite Path', 'hardscape', 'cost_plus', 150),
      ('Breeze / Decomposed Granite Patio', 'hardscape', 'cost_plus', 160),
      ('Artificial Turf', 'hardscape', 'cost_plus', 170),
      ('Concrete (subcontractor)', 'hardscape', 'cost_plus', 180),
      ('Site Prep / Demo', 'hardscape', 't_and_m', 190),
      ('T&M Structure', 'hardscape', 't_and_m', 200),
      ('Mulch Bed', 'softscape', 'cost_plus', 210),
      ('Sod Installation', 'softscape', 'cost_plus', 220),
      ('Seeding', 'softscape', 'cost_plus', 230),
      ('Plants #1', 'softscape', 'cost_plus', 240),
      ('Plants #5', 'softscape', 'cost_plus', 250),
      ('Plants #10-#25', 'softscape', 'cost_plus', 260),
      ('Trees', 'softscape', 'cost_plus', 270),
      ('Water Feature', 'softscape', 'cost_plus', 280),
      ('French Drain', 'drainage', 'cost_plus', 290),
      ('Catch Basin', 'drainage', 'cost_plus', 300),
      ('Dry Well', 'drainage', 'cost_plus', 310),
      ('Downspout / Drain Tile', 'drainage', 'cost_plus', 320),
      ('Dry Creek Bed', 'drainage', 'cost_plus', 330),
      ('Irrigation Zone Installation', 'irrigation', 'cost_plus', 340),
      ('Irrigation Valve Replacement', 'irrigation', 'cost_plus', 350),
      ('Backflow Preventer', 'irrigation', 'cost_plus', 360),
      ('Head Replacement / Adjustment', 'irrigation', 'cost_plus', 370),
      ('Mowing', 'maintenance', 'flat_rate', 380),
      ('Spring Cleanup', 'maintenance', 'flat_rate', 390),
      ('Fall Cleanup', 'maintenance', 'flat_rate', 400),
      ('Fertilization / Treatment', 'maintenance', 'flat_rate', 410),
      ('Irrigation Blowout', 'maintenance', 'flat_rate', 420),
      ('Irrigation Activation', 'maintenance', 'flat_rate', 430),
      ('Plowing', 'snow', 'flat_rate', 440),
      ('Salting', 'snow', 'flat_rate', 450),
      ('Shoveling / Hand Work', 'snow', 't_and_m', 460)
  ) as template(name, category, pricing_mode, sort_order)
  on conflict (org_id, name, is_system_template) do nothing;
end;
$$;

create or replace function public.handle_seed_product_catalog_templates()
returns trigger
language plpgsql
as $$
begin
  perform public.seed_product_catalog_templates(new.id);
  return new;
end;
$$;

drop trigger if exists on_organization_created_seed_product_catalog_templates on public.organizations;
create trigger on_organization_created_seed_product_catalog_templates
after insert on public.organizations
for each row execute function public.handle_seed_product_catalog_templates();

do $$
declare
  org_record record;
begin
  for org_record in select id from public.organizations loop
    perform public.seed_product_catalog_templates(org_record.id);
  end loop;
end;
$$;
