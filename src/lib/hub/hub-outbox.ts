import { queryLocalDb } from "../db/local-postgres";

export interface OutboxMutation {
  id?: number;
  eventId?: string;
  schoolId: string;
  entityType: string;
  entityId: string;
  mutationType: "INSERT" | "UPDATE" | "DELETE";
  payload: Record<string, any>;
  clientVersion: number;
  actorId?: string | null;
  status?: "PENDING" | "IN_FLIGHT" | "COMMITTED" | "FAILED";
  errorMessage?: string | null;
}

/**
 * Enqueues a local mutation into the durable transactional outbox (hub.sync_outbox).
 */
export async function enqueueOutboxMutation(mutation: OutboxMutation): Promise<number> {
  const res = await queryLocalDb(
    `INSERT INTO hub.sync_outbox (
      school_id, entity_type, entity_id, mutation_type, payload, client_version, actor_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    RETURNING id;`,
    [
      mutation.schoolId,
      mutation.entityType,
      mutation.entityId,
      mutation.mutationType,
      JSON.stringify(mutation.payload),
      mutation.clientVersion,
      mutation.actorId || null,
    ]
  );

  return res.rows[0].id;
}

/**
 * Retrieves pending outbox batches for transmission to Cloud.
 */
export async function getPendingOutboxBatch(limit: number = 100): Promise<OutboxMutation[]> {
  const res = await queryLocalDb(
    `SELECT id, event_id, school_id, entity_type, entity_id, mutation_type, payload, client_version, actor_id, status
     FROM hub.sync_outbox
     WHERE status = 'PENDING'
     ORDER BY id ASC
     LIMIT $1;`,
    [limit]
  );

  return res.rows.map((r: any) => ({
    id: r.id,
    eventId: r.event_id,
    schoolId: r.school_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    mutationType: r.mutation_type,
    payload: r.payload,
    clientVersion: r.client_version,
    actorId: r.actor_id,
    status: r.status,
  }));
}

/**
 * Marks outbox items as COMMITTED after successful cloud receipt and atomic application.
 */
export async function markOutboxCommitted(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await queryLocalDb(
    `UPDATE hub.sync_outbox
     SET status = 'COMMITTED', synced_at = clock_timestamp()
     WHERE id = ANY($1::bigint[]);`,
    [ids]
  );
}

/**
 * Marks outbox items as FAILED with error feedback.
 */
export async function markOutboxFailed(ids: number[], errorMessage: string): Promise<void> {
  if (ids.length === 0) return;
  await queryLocalDb(
    `UPDATE hub.sync_outbox
     SET status = 'FAILED', error_message = $2, retry_count = retry_count + 1
     WHERE id = ANY($1::bigint[]);`,
    [ids, errorMessage]
  );
}
