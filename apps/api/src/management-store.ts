import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import {
  type ConferenceRequestInput,
  conferenceRequestInputSchema,
  type ManagementRequestKind,
  type ManagementRequestStatus,
  managementReviewInputSchema,
  type ScheduleOverrideInput,
  scheduleOverrideInputSchema,
} from "@conf/contracts"

export interface AdminSession {
  readonly email: string
  readonly expiresAt: string
}

export interface ConferenceManagementRequest extends ConferenceRequestInput {
  readonly id: string
  readonly status: ManagementRequestStatus
  readonly submittedBy: string
  readonly submittedAt: string
  readonly reviewedBy: string | null
  readonly reviewedAt: string | null
  readonly reviewNote: string | null
}

export interface ScheduleOverrideManagementRequest extends ScheduleOverrideInput {
  readonly id: string
  readonly status: ManagementRequestStatus
  readonly submittedBy: string
  readonly submittedAt: string
  readonly reviewedBy: string | null
  readonly reviewedAt: string | null
  readonly reviewNote: string | null
}

export interface OAuthFlow {
  readonly state: string
  readonly codeVerifier: string
  readonly returnTo: string
  readonly expiresAt: string
}

type ConferenceRow = {
  id: string
  name: string
  official_url: string
  category: ConferenceManagementRequest["category"]
  note: string
  status: ManagementRequestStatus
  submitted_by: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

type ScheduleOverrideRow = {
  id: string
  edition_id: string
  deadline_id: string | null
  value: string
  evidence_url: string
  note: string
  status: ManagementRequestStatus
  submitted_by: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

function now(): string {
  return new Date().toISOString()
}

function conferenceFromRow(row: ConferenceRow): ConferenceManagementRequest {
  return {
    id: row.id,
    name: row.name,
    officialUrl: row.official_url,
    category: row.category,
    note: row.note,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
  }
}

function scheduleOverrideFromRow(row: ScheduleOverrideRow): ScheduleOverrideManagementRequest {
  return {
    id: row.id,
    editionId: row.edition_id,
    deadlineId: row.deadline_id,
    value: row.value,
    evidenceUrl: row.evidence_url,
    note: row.note,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
  }
}

export class ManagementStore {
  readonly #database: Database

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true })
    this.#database = new Database(path, { create: true })
    this.#database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS conference_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        official_url TEXT NOT NULL,
        category TEXT NOT NULL,
        note TEXT NOT NULL,
        status TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_note TEXT
      );
      CREATE TABLE IF NOT EXISTS schedule_overrides (
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL,
        deadline_id TEXT,
        value TEXT NOT NULL,
        evidence_url TEXT NOT NULL,
        note TEXT NOT NULL,
        status TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_note TEXT
      );
      CREATE TABLE IF NOT EXISTS auth_flows (
        state TEXT PRIMARY KEY,
        code_verifier TEXT NOT NULL,
        return_to TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        subject_kind TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        detail TEXT,
        created_at TEXT NOT NULL
      );
    `)
  }

  close(): void {
    this.#database.close()
  }

  private recordAudit(
    actor: string,
    action: string,
    subjectKind: string,
    subjectId: string,
    detail: string | null = null,
  ): void {
    this.#database
      .query(
        "INSERT INTO audit_log (id, actor, action, subject_kind, subject_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(crypto.randomUUID(), actor, action, subjectKind, subjectId, detail, now())
  }

  createConferenceRequest(
    input: ConferenceRequestInput,
    submittedBy: string,
  ): ConferenceManagementRequest {
    const parsed = conferenceRequestInputSchema.parse(input)
    const request: ConferenceManagementRequest = {
      id: crypto.randomUUID(),
      ...parsed,
      status: "submitted",
      submittedBy,
      submittedAt: now(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    }
    this.#database
      .query(
        "INSERT INTO conference_requests (id, name, official_url, category, note, status, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        request.id,
        request.name,
        request.officialUrl,
        request.category,
        request.note,
        request.status,
        request.submittedBy,
        request.submittedAt,
      )
    this.recordAudit(submittedBy, "submitted", "conference", request.id)
    return request
  }

  createScheduleOverride(
    input: ScheduleOverrideInput,
    submittedBy: string,
  ): ScheduleOverrideManagementRequest {
    const parsed = scheduleOverrideInputSchema.parse(input)
    const request: ScheduleOverrideManagementRequest = {
      id: crypto.randomUUID(),
      ...parsed,
      status: "submitted",
      submittedBy,
      submittedAt: now(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    }
    this.#database
      .query(
        "INSERT INTO schedule_overrides (id, edition_id, deadline_id, value, evidence_url, note, status, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        request.id,
        request.editionId,
        request.deadlineId,
        request.value,
        request.evidenceUrl,
        request.note,
        request.status,
        request.submittedBy,
        request.submittedAt,
      )
    this.recordAudit(submittedBy, "submitted", "schedule-override", request.id)
    return request
  }

  listConferenceRequests(status?: ManagementRequestStatus): readonly ConferenceManagementRequest[] {
    const rows = status
      ? this.#database
          .query("SELECT * FROM conference_requests WHERE status = ? ORDER BY submitted_at DESC")
          .all(status)
      : this.#database.query("SELECT * FROM conference_requests ORDER BY submitted_at DESC").all()
    return (rows as ConferenceRow[]).map(conferenceFromRow)
  }

  listScheduleOverrides(
    status?: ManagementRequestStatus,
  ): readonly ScheduleOverrideManagementRequest[] {
    const rows = status
      ? this.#database
          .query("SELECT * FROM schedule_overrides WHERE status = ? ORDER BY submitted_at DESC")
          .all(status)
      : this.#database.query("SELECT * FROM schedule_overrides ORDER BY submitted_at DESC").all()
    return (rows as ScheduleOverrideRow[]).map(scheduleOverrideFromRow)
  }

  reviewRequest(
    kind: ManagementRequestKind,
    id: string,
    input: { readonly status: "approved" | "rejected"; readonly note: string },
    reviewedBy: string,
  ): boolean {
    const parsed = managementReviewInputSchema.parse(input)
    const table = kind === "conference" ? "conference_requests" : "schedule_overrides"
    const reviewedAt = now()
    const result = this.#database
      .query(
        `UPDATE ${table} SET status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ? AND status = 'submitted'`,
      )
      .run(parsed.status, reviewedBy, reviewedAt, parsed.note || null, id)
    if (result.changes > 0)
      this.recordAudit(reviewedBy, parsed.status, kind, id, parsed.note || null)
    return result.changes > 0
  }

  saveOAuthFlow(flow: OAuthFlow): void {
    this.#database
      .query(
        "INSERT INTO auth_flows (state, code_verifier, return_to, expires_at) VALUES (?, ?, ?, ?)",
      )
      .run(flow.state, flow.codeVerifier, flow.returnTo, flow.expiresAt)
  }

  takeOAuthFlow(state: string): OAuthFlow | undefined {
    const row = this.#database
      .query("SELECT * FROM auth_flows WHERE state = ? AND expires_at > ?")
      .get(state) as {
      state: string
      code_verifier: string
      return_to: string
      expires_at: string
    } | null
    this.#database.query("DELETE FROM auth_flows WHERE state = ?").run(state)
    return row
      ? {
          state: row.state,
          codeVerifier: row.code_verifier,
          returnTo: row.return_to,
          expiresAt: row.expires_at,
        }
      : undefined
  }

  saveSession(tokenHash: string, session: AdminSession): void {
    this.#database
      .query("INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)")
      .run(tokenHash, session.email, session.expiresAt)
  }

  getSession(tokenHash: string): AdminSession | undefined {
    const row = this.#database
      .query("SELECT email, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?")
      .get(tokenHash, now()) as { email: string; expires_at: string } | null
    return row ? { email: row.email, expiresAt: row.expires_at } : undefined
  }

  deleteSession(tokenHash: string): void {
    this.#database.query("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash)
  }
}
