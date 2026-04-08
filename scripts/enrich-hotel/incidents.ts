import { supabase } from '../phase0-enrichment/lib/supabase.js';

interface IncidentRecord {
  hotelId?: string | null;
  hotelName: string;
  city?: string | null;
  country?: string | null;
  incidentType: string;
  source?: string | null;
  severity?: 'info' | 'warning' | 'error';
  message: string;
  evidence?: Record<string, unknown>;
}

export async function recordEnrichmentIncident(record: IncidentRecord): Promise<void> {
  const { error } = await supabase.from('hotel_enrichment_incidents').insert({
    hotel_id: record.hotelId ?? null,
    hotel_name: record.hotelName,
    city: record.city ?? null,
    country: record.country ?? null,
    incident_type: record.incidentType,
    source: record.source ?? null,
    severity: record.severity ?? 'error',
    message: record.message,
    evidence: record.evidence ?? {},
  });

  if (error) {
    console.error(`Failed to record enrichment incident: ${error.message}`);
  }
}
