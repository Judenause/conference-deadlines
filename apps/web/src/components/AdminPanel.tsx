import {
  conferenceRequestInputSchema,
  type Edition,
  scheduleOverrideInputSchema,
} from "@conf/contracts"
import { type FormEvent, useEffect, useId, useMemo, useState } from "react"
import {
  type FirebaseAdminSession,
  getFirebaseAdminConfig,
  signInFirebaseAdmin,
  submitConferenceRequest,
  submitScheduleOverride,
} from "../admin/firebase-rest"

type ManagementMode = "add" | "override"

function formValue(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === "string" ? value : ""
}

function messageForError(): string {
  return "입력값을 확인해 주세요. URL은 https://로 시작해야 합니다."
}

export function AdminPanel({
  editions,
  id,
}: {
  readonly editions: readonly Edition[]
  readonly id: string
}) {
  const titleId = useId()
  const config = getFirebaseAdminConfig()
  const [mode, setMode] = useState<ManagementMode>("add")
  const [session, setSession] = useState<FirebaseAdminSession>()
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editionId, setEditionId] = useState(editions[0]?.id ?? "")
  useEffect(() => {
    if (editions.some((edition) => edition.id === editionId)) return
    setEditionId(editions[0]?.id ?? "")
  }, [editionId, editions])
  const selectedEdition = useMemo(
    () => editions.find((edition) => edition.id === editionId),
    [editionId, editions],
  )

  async function signIn() {
    if (!config) return
    setSubmitting(true)
    setMessage("")
    try {
      const nextSession = await signInFirebaseAdmin(config)
      setSession(nextSession)
      setMessage(`${nextSession.email} 계정으로 인증했습니다.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "관리자 인증에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAddition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config || !session) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const parsed = conferenceRequestInputSchema.safeParse({
      name: formValue(form, "name"),
      officialUrl: formValue(form, "officialUrl"),
      category: formValue(form, "category"),
      note: formValue(form, "note"),
    })
    if (!parsed.success) {
      setMessage(messageForError())
      return
    }
    setSubmitting(true)
    setMessage("")
    try {
      await submitConferenceRequest(config, session, parsed.data)
      formElement.reset()
      setMessage("학회 추가 요청을 저장했습니다. 공식 URL 확인 후 월간 수집 대상에 등록됩니다.")
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "학회 추가 요청을 저장하지 못했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config || !session || !selectedEdition) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const deadlineId = formValue(form, "deadlineId") || null
    const parsed = scheduleOverrideInputSchema.safeParse({
      editionId: selectedEdition.id,
      deadlineId,
      value: formValue(form, "value"),
      evidenceUrl: formValue(form, "evidenceUrl"),
      note: formValue(form, "note"),
    })
    if (!parsed.success) {
      setMessage(messageForError())
      return
    }
    setSubmitting(true)
    setMessage("")
    try {
      await submitScheduleOverride(config, session, parsed.data)
      formElement.reset()
      setMessage("수정 요청을 저장했습니다. 승인 전에는 자동 수집값과 공개 일정이 바뀌지 않습니다.")
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "수정 요청을 저장하지 못했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby={titleId} className="management-panel" id={id}>
      <div>
        <p className="eyebrow">MANAGEMENT</p>
        <h2 id={titleId}>학회 관리</h2>
        <p>추가와 수정은 검수 요청으로 저장됩니다.</p>
      </div>
      <div className="management-panel__controls">
        <fieldset className="management-tabs">
          <legend className="sr-only">관리 작업</legend>
          <button aria-pressed={mode === "add"} onClick={() => setMode("add")} type="button">
            학회 추가
          </button>
          <button
            aria-pressed={mode === "override"}
            onClick={() => setMode("override")}
            type="button"
          >
            일정 수정
          </button>
        </fieldset>
        {config ? (
          <button
            className="management-sign-in"
            disabled={submitting || Boolean(session)}
            onClick={() => void signIn()}
            type="button"
          >
            {session ? "관리자 인증됨" : "Google로 관리자 인증"}
          </button>
        ) : (
          <p className="management-setup">Firebase 연결 후 활성화됩니다.</p>
        )}
      </div>
      {mode === "add" ? (
        <form className="management-form" onSubmit={(event) => void submitAddition(event)}>
          <label>
            학회명
            <input
              disabled={!session || submitting}
              name="name"
              placeholder="예: NeurIPS"
              required
            />
          </label>
          <label>
            공식 홈페이지
            <input
              disabled={!session || submitting}
              name="officialUrl"
              placeholder="https://example.org"
              required
              type="url"
            />
          </label>
          <label>
            분야
            <select defaultValue="AI" disabled={!session || submitting} name="category">
              <option value="AI">AI</option>
              <option value="System">System</option>
              <option value="CV">CV</option>
              <option value="Circuit">Circuit</option>
              <option value="Archi">Archi</option>
            </select>
          </label>
          <label className="management-form__wide">
            메모 (선택)
            <textarea
              disabled={!session || submitting}
              name="note"
              placeholder="트랙, 주기, 참고할 공식 페이지"
              rows={3}
            />
          </label>
          <button disabled={!session || submitting} type="submit">
            {submitting ? "저장 중" : "추가 요청 저장"}
          </button>
        </form>
      ) : (
        <form className="management-form" onSubmit={(event) => void submitOverride(event)}>
          <label>
            학회
            <select
              disabled={!session || submitting}
              onChange={(event) => setEditionId(event.target.value)}
              value={editionId}
            >
              {editions.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {edition.acronym}
                </option>
              ))}
            </select>
          </label>
          <label>
            수정 항목
            <select disabled={!session || submitting} name="deadlineId">
              <option value="">학회 개최 정보</option>
              {selectedEdition?.deadlines.map((deadline) => (
                <option key={deadline.id} value={deadline.id}>
                  {deadline.label} · {deadline.track}
                </option>
              ))}
            </select>
          </label>
          <label>
            새 일정값
            <input
              disabled={!session || submitting}
              name="value"
              placeholder="예: 2027. 5. 13 23:59 AoE"
              required
            />
          </label>
          <label>
            공식 근거 URL
            <input
              disabled={!session || submitting}
              name="evidenceUrl"
              placeholder="https://example.org/cfp"
              required
              type="url"
            />
          </label>
          <label className="management-form__wide">
            수정 사유 (선택)
            <textarea
              disabled={!session || submitting}
              name="note"
              placeholder="변경 이유와 원문 문구"
              rows={3}
            />
          </label>
          <button disabled={!session || submitting || !selectedEdition} type="submit">
            {submitting ? "저장 중" : "수정 요청 저장"}
          </button>
        </form>
      )}
      {message ? <output className="management-message">{message}</output> : null}
    </section>
  )
}
