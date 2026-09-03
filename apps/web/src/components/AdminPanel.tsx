import {
  conferenceRequestInputSchema,
  type Edition,
  scheduleOverrideInputSchema,
} from "@conf/contracts"
import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react"
import {
  dispatchManagementReview,
  getManagementAdminSession,
  getManagementApiConfig,
  getManagementRequests,
  logoutManagementAdmin,
  type ManagementRequestSummary,
  reviewManagementRequest,
  signInManagementAdmin,
  submitConferenceRequest,
  submitScheduleOverride,
} from "../admin/management-api"

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
  const config = useMemo(() => getManagementApiConfig(), [])
  const [mode, setMode] = useState<ManagementMode>("add")
  const [session, setSession] = useState<{ readonly username: string }>()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [requests, setRequests] = useState<readonly ManagementRequestSummary[]>([])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editionId, setEditionId] = useState(editions[0]?.id ?? "")
  useEffect(() => {
    if (editions.some((edition) => edition.id === editionId)) return
    setEditionId(editions[0]?.id ?? "")
  }, [editionId, editions])
  useEffect(() => {
    if (!config) return
    void getManagementAdminSession(config)
      .then((nextSession) => setSession(nextSession))
      .catch(() => setMessage("관리 서버에 연결하지 못했습니다."))
  }, [config])

  const refreshRequests = useCallback(async () => {
    if (!config || !session) return
    try {
      setRequests(await getManagementRequests(config))
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "검수 요청을 불러오지 못했습니다.")
    }
  }, [config, session])

  useEffect(() => {
    void refreshRequests()
  }, [refreshRequests])
  const selectedEdition = useMemo(
    () => editions.find((edition) => edition.id === editionId),
    [editionId, editions],
  )

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config) return
    setSubmitting(true)
    setMessage("")
    try {
      setSession(await signInManagementAdmin(config, username, password))
      setPassword("")
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "관리자 로그인에 실패했습니다.")
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
      await submitConferenceRequest(config, parsed.data)
      formElement.reset()
      await refreshRequests()
      setMessage("학회 추가 요청을 저장했습니다. 서버 검수 후 공식 수집 대상에 등록됩니다.")
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
      await submitScheduleOverride(config, parsed.data)
      formElement.reset()
      await refreshRequests()
      setMessage("수정 요청을 저장했습니다. 승인 전에는 자동 수집값과 공개 일정이 바뀌지 않습니다.")
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "수정 요청을 저장하지 못했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function reviewRequest(request: ManagementRequestSummary, status: "approved" | "rejected") {
    if (!config) return
    setSubmitting(true)
    setMessage("")
    try {
      await reviewManagementRequest(config, request, status)
      await refreshRequests()
      setMessage(status === "approved" ? "요청을 승인했습니다." : "요청을 반려했습니다.")
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "요청을 검수하지 못했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function logout() {
    if (!config) return
    await logoutManagementAdmin(config)
    setSession(undefined)
    setRequests([])
  }

  async function createReview() {
    if (!config) return
    setSubmitting(true)
    try {
      await dispatchManagementReview(config)
      setMessage(
        "GitHub 검수 workflow를 시작했습니다. 완료 후 생성된 PR을 GitHub에서 병합해 주세요.",
      )
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "GitHub 검수 workflow를 시작하지 못했습니다.",
      )
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
          session ? (
            <span className="management-admin-actions">
              <button disabled={submitting} onClick={() => void createReview()} type="button">
                검수 PR 만들기
              </button>
              <button disabled={submitting} onClick={() => void logout()} type="button">
                로그아웃
              </button>
            </span>
          ) : (
            <form className="management-login" onSubmit={(event) => void signIn(event)}>
              <input
                aria-label="관리자 아이디"
                autoComplete="username"
                disabled={submitting}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="관리자 아이디"
                required
                value={username}
              />
              <input
                aria-label="관리자 비밀번호"
                autoComplete="current-password"
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                required
                type="password"
                value={password}
              />
              <button className="management-sign-in" disabled={submitting} type="submit">
                로그인
              </button>
            </form>
          )
        ) : (
          <p className="management-setup">관리 서버 연결 후 활성화됩니다.</p>
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
      {session ? (
        <section className="management-review" aria-label="검수 요청">
          <h3>검수 요청</h3>
          {requests.length === 0 ? <p>저장된 요청이 없습니다.</p> : null}
          <ul>
            {requests.map((request) => (
              <li key={`${request.kind}-${request.id}`}>
                <span>
                  {request.kind === "conference" ? "학회 추가" : "일정 수정"} · {request.title} ·{" "}
                  {request.status}
                </span>
                {request.status === "submitted" ? (
                  <span>
                    <button
                      disabled={submitting}
                      onClick={() => void reviewRequest(request, "approved")}
                      type="button"
                    >
                      승인
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => void reviewRequest(request, "rejected")}
                      type="button"
                    >
                      반려
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {message ? <output className="management-message">{message}</output> : null}
    </section>
  )
}
