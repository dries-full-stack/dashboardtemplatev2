-- Convenience views to expose raw_data + common "source" keys
-- Update the source_guess coalesce list if your GHL payload uses different fields.

drop view if exists public.contacts_view;
create view public.contacts_view as
select
  id,
  location_id,
  first_name,
  last_name,
  email,
  phone,
  tags,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'type' as contact_type,
  raw_data->>'contactName' as contact_name,
  raw_data->>'companyName' as company_name,
  raw_data->>'city' as city,
  raw_data->>'state' as state,
  raw_data->>'country' as country,
  raw_data->>'postalCode' as postal_code,
  raw_data->>'address1' as address1,
  raw_data->>'website' as website,
  raw_data->>'timezone' as timezone,
  raw_data->>'dateAdded' as date_added_raw,
  raw_data->>'dateUpdated' as date_updated_raw,
  raw_data->>'dateOfBirth' as date_of_birth_raw,
  raw_data->>'assignedTo' as assigned_to_raw,
  raw_data->>'businessId' as business_id,
  raw_data->>'profilePhoto' as profile_photo,
  raw_data->>'firstNameRaw' as first_name_raw,
  raw_data->>'lastNameRaw' as last_name_raw,
  (raw_data->>'dnd')::boolean as dnd,
  raw_data->'dndSettings' as dnd_settings,
  raw_data->'customFields' as custom_fields,
  raw_data->'additionalEmails' as additional_emails,
  raw_data->'followers' as followers,
  raw_data,
  coalesce(
    raw_data->>'source',
    raw_data->>'leadSource',
    raw_data->>'contactSource',
    raw_data#>>'{attribution,source}',
    raw_data->>'utm_source',
    raw_data->>'utmSource',
    raw_data#>>'{attribution,utm_source}',
    raw_data#>>'{attribution,utm,source}',
    raw_data#>>'{utm,source}',
    public.custom_field_value(raw_data->'customFields', 'utm_source'),
    public.custom_field_value(raw_data->'customFields', 'utmSource'),
    case
      when coalesce(
        raw_data->>'gclid',
        raw_data#>>'{attribution,gclid}',
        public.custom_field_value(raw_data->'customFields', 'gclid')
      ) is not null
        or coalesce(raw_data->>'referrer', raw_data->>'sourceUrl', raw_data->>'website', '') ilike '%gclid=%'
        then 'Google Ads'
      when coalesce(
        raw_data->>'fbclid',
        raw_data#>>'{attribution,fbclid}',
        public.custom_field_value(raw_data->'customFields', 'fbclid')
      ) is not null
        or coalesce(raw_data->>'referrer', raw_data->>'sourceUrl', raw_data->>'website', '') ilike '%fbclid=%'
        then 'Meta - Calculator'
      else null
    end
  ) as source_guess
from public.contacts;

drop view if exists public.opportunities_view;
create view public.opportunities_view as
select
  id,
  location_id,
  name,
  status,
  pipeline_id,
  pipeline_stage_id,
  monetary_value,
  assigned_to,
  contact_id,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'source' as source,
  raw_data->>'leadSource' as lead_source,
  raw_data->>'contactSource' as contact_source,
  raw_data->>'contactName' as contact_name,
  raw_data->>'contactEmail' as contact_email,
  raw_data->>'contactPhone' as contact_phone,
  raw_data->>'pipelineName' as pipeline_name,
  raw_data->>'pipelineStageName' as pipeline_stage_name,
  raw_data->>'ownerId' as owner_id,
  raw_data->>'createdAt' as created_at_raw,
  raw_data->>'updatedAt' as updated_at_raw,
  raw_data->'customFields' as custom_fields,
  raw_data,
  coalesce(
    raw_data->>'source',
    raw_data->>'leadSource',
    raw_data->>'contactSource',
    raw_data#>>'{attribution,source}',
    raw_data->>'utm_source',
    raw_data->>'utmSource',
    raw_data#>>'{attribution,utm_source}',
    raw_data#>>'{attribution,utm,source}',
    raw_data#>>'{utm,source}',
    public.custom_field_value(raw_data->'customFields', 'utm_source'),
    public.custom_field_value(raw_data->'customFields', 'utmSource'),
    case
      when coalesce(
        raw_data->>'gclid',
        raw_data#>>'{attribution,gclid}',
        public.custom_field_value(raw_data->'customFields', 'gclid')
      ) is not null
        or coalesce(raw_data->>'referrer', raw_data->>'sourceUrl', raw_data->>'website', '') ilike '%gclid=%'
        then 'Google Ads'
      when coalesce(
        raw_data->>'fbclid',
        raw_data#>>'{attribution,fbclid}',
        public.custom_field_value(raw_data->'customFields', 'fbclid')
      ) is not null
        or coalesce(raw_data->>'referrer', raw_data->>'sourceUrl', raw_data->>'website', '') ilike '%fbclid=%'
        then 'Meta - Calculator'
      else null
    end
  ) as source_guess
from public.opportunities;

drop view if exists public.appointments_view;
create view public.appointments_view as
select
  id,
  location_id,
  title,
  appointment_status,
  calendar_id,
  contact_id,
  assigned_user_id,
  start_time,
  end_time,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'appointmentStatus' as appointment_status_raw,
  raw_data->>'status' as status_raw,
  raw_data->>'calendarName' as calendar_name,
  raw_data->>'assignedUserName' as assigned_user_name,
  raw_data->>'contactName' as contact_name,
  raw_data->>'contactEmail' as contact_email,
  raw_data->>'contactPhone' as contact_phone,
  raw_data->>'source' as source,
  raw_data->>'startTime' as start_time_raw,
  raw_data->>'endTime' as end_time_raw,
  raw_data->>'createdAt' as created_at_raw,
  raw_data->>'updatedAt' as updated_at_raw,
  raw_data->'customFields' as custom_fields,
  raw_data
from public.appointments;
