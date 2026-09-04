import type { BackendErrorCode } from '@/lib/error-codes.generated'
import { isApiError } from '@/lib/api-error'

/**
 * What each API failure is called to the person reading the screen.
 *
 * ── Why the sentence lives here and not in the API ─────────────────────────
 *
 * The API answers callers; this answers a reader. The two are not the same job,
 * and the same failure is explained differently to a landlord running the
 * business than to a tenant who opened a link — so the wording belongs where
 * the reader is, keyed by a code that does not change when the wording does.
 *
 * ── Why this is a Record and not a lookup with a default ───────────────────
 *
 * `Record<BackendErrorCode, string>` over a GENERATED union means a code the API
 * can return but this file has no sentence for does not compile. That is the
 * whole safety net: a phrase can be forgotten, but it cannot be shipped
 * forgotten.
 *
 * The union comes from `backend/scripts/generate-error-codes.ts`. CI regenerates
 * it and fails if the committed copy differs.
 */
const MESSAGES: Record<BackendErrorCode, string> = {
  // ── Signing in and sessions ───────────────────────────────────────────────
  INVALID_CREDENTIALS: 'Số điện thoại hoặc mật khẩu không đúng.',
  LOGIN_REQUEST_INVALID: 'Thông tin đăng nhập chưa hợp lệ.',
  ACCOUNT_GONE: 'Tài khoản này không còn tồn tại.',
  AUTHENTICATION_REQUIRED: 'Bạn cần đăng nhập để làm việc này.',
  NOT_AUTHENTICATED: 'Bạn cần đăng nhập để làm việc này.',
  ACCESS_TOKEN_INVALID: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  ACCESS_TOKEN_SUBJECT_INVALID: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  AUTH_HEADER_MISSING: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  REFRESH_TOKEN_MISSING: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
  REFRESH_TOKEN_INVALID: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  ROLE_NOT_PERMITTED: 'Tài khoản của bạn không có quyền với mục này.',

  // ── Requests the server could not read ────────────────────────────────────
  BODY_NOT_JSON: 'Dữ liệu gửi lên không đọc được. Vui lòng thử lại.',
  BODY_INCOMPLETE: 'Dữ liệu gửi lên bị gián đoạn. Vui lòng thử lại.',
  BODY_TOO_LARGE: 'Dữ liệu gửi lên quá lớn.',
  BODY_ENCODING_UNSUPPORTED: 'Định dạng dữ liệu gửi lên không được hỗ trợ.',
  QUERY_INVALID: 'Bộ lọc không hợp lệ.',
  ROUTE_NOT_FOUND: 'Không tìm thấy trang này.',
  INTERNAL_SERVER_ERROR: 'Máy chủ gặp sự cố. Vui lòng thử lại sau ít phút.',

  // ── Toà nhà ──────────────────────────────────────────────────────────────
  BUILDING_NOT_FOUND: 'Không tìm thấy toà nhà.',
  BUILDING_PAYLOAD_INVALID: 'Thông tin toà nhà chưa hợp lệ.',
  BUILDING_RETIRE_HAS_ACTIVE_LEASE:
    'Không thể ngừng toà nhà khi vẫn còn phòng đang có hợp đồng.',

  // ── Phòng ────────────────────────────────────────────────────────────────
  ROOM_NOT_FOUND: 'Không tìm thấy phòng.',
  ROOM_PAYLOAD_INVALID: 'Thông tin phòng chưa hợp lệ.',
  ROOM_CODE_TAKEN: 'Mã phòng này đã được dùng cho một phòng khác trong toà nhà.',
  ROOM_BUILDING_RETIRED: 'Không thể thêm phòng vào toà nhà đã ngừng.',
  ROOM_RETIRE_HAS_ACTIVE_LEASE: 'Không thể ngừng phòng đang có hợp đồng.',
  ROOM_BUILDING_MISMATCH: 'Phòng này không thuộc toà nhà đã chọn.',
  ROOM_ALREADY_LET: 'Phòng này đang có hợp đồng.',

  // ── Khách ────────────────────────────────────────────────────────────────
  CUSTOMER_NOT_FOUND: 'Không tìm thấy khách.',
  CUSTOMER_PAYLOAD_INVALID: 'Thông tin khách chưa hợp lệ.',
  PHONE_ALREADY_IN_USE: 'Số điện thoại này đã được dùng.',
  PHONE_BELONGS_TO_ANOTHER: 'Số điện thoại này thuộc về một tài khoản khác.',

  // ── Hợp đồng ─────────────────────────────────────────────────────────────
  LEASE_NOT_FOUND: 'Không tìm thấy hợp đồng.',
  LEASE_PAYLOAD_INVALID: 'Thông tin hợp đồng chưa hợp lệ.',
  LEASE_ROOM_RETIRED: 'Không thể lập hợp đồng cho phòng đã ngừng.',
  LEASE_START_METER_REQUIRED:
    'Cần nhập số điện đầu kỳ: phòng này chưa có số cũ để lấy làm mốc.',
  LEASE_STARTS_BEFORE_PREVIOUS_END:
    'Hợp đồng mới không thể bắt đầu trước ngày hợp đồng trước của phòng kết thúc.',
  LEASE_FINALIZED_NOT_EDITABLE: 'Hợp đồng đã kết thúc nên không sửa được.',
  LEASE_ALREADY_MOVED_OUT: 'Hợp đồng này đã ghi nhận trả phòng.',
  LEASE_ALREADY_CANCELLED: 'Hợp đồng này đã được huỷ.',
  LEASE_CANCELLED: 'Hợp đồng này đã được huỷ.',
  LEASE_CANCEL_PAYLOAD_INVALID: 'Thông tin huỷ hợp đồng chưa hợp lệ.',
  LEASE_CANCEL_AFTER_MOVE_OUT:
    'Hợp đồng đã ghi nhận trả phòng nên không thể coi như chưa từng diễn ra.',
  LEASE_CANCEL_AFTER_BILLING:
    'Hợp đồng đã xuất hoá đơn nên không thể coi như chưa từng diễn ra. Hãy ghi nhận trả phòng.',
  LEASE_MOVE_OUT_PAYLOAD_INVALID: 'Thông tin trả phòng chưa hợp lệ.',
  MOVE_OUT_BEFORE_START: 'Ngày trả phòng không thể trước ngày bắt đầu hợp đồng.',
  LEASE_EXTENSION_PAYLOAD_INVALID: 'Thông tin gia hạn chưa hợp lệ.',
  LEASE_EXTEND_AFTER_MOVE_OUT: 'Hợp đồng đã trả phòng nên không gia hạn được.',
  SIGNATORY_NOT_FOUND: 'Không tìm thấy người đứng tên.',
  SIGNATORY_PHONE_REQUIRED: 'Người đứng tên hợp đồng phải có số điện thoại.',

  // ── Người ở ──────────────────────────────────────────────────────────────
  OCCUPANT_NOT_FOUND: 'Không tìm thấy người ở.',
  OCCUPANT_NOT_ON_LEASE: 'Người này không có trong hợp đồng.',
  OCCUPANT_PAYLOAD_INVALID: 'Thông tin người ở chưa hợp lệ.',
  OCCUPANT_ADD_TO_FINALIZED: 'Không thể thêm người ở vào hợp đồng đã kết thúc.',
  OCCUPANT_ALREADY_PRESENT: 'Người này đang ở trong hợp đồng rồi.',
  OCCUPANT_ALREADY_DEPARTED: 'Người này đã rời đi.',
  OCCUPANT_DEPARTURE_PAYLOAD_INVALID: 'Thông tin rời đi chưa hợp lệ.',
  DEPARTURE_BEFORE_JOIN: 'Ngày rời đi không thể trước ngày vào ở.',
  PRIMARY_OCCUPANT_MUST_TRANSFER:
    'Hãy chuyển vai trò người đứng tên cho người khác trước khi ghi nhận rời đi.',
  OCCUPANT_TRANSFER_PAYLOAD_INVALID: 'Thông tin chuyển vai trò chưa hợp lệ.',
  TRANSFER_ON_FINALIZED_LEASE: 'Không thể chuyển vai trò trên hợp đồng đã kết thúc.',
  TRANSFER_TARGET_NOT_OCCUPANT: 'Người này không đang ở trong hợp đồng.',
  TRANSFER_TARGET_ALREADY_PRIMARY: 'Người này đã là người đứng tên.',

  // ── Hợp đồng đã ký (tệp) ─────────────────────────────────────────────────
  CONTRACT_STORAGE_NOT_CONFIGURED:
    'Máy chủ chưa cấu hình nơi lưu trữ nên chưa lưu được bản hợp đồng.',
  CONTRACT_UPLOAD_PAYLOAD_INVALID: 'Yêu cầu tải lên chưa hợp lệ.',
  CONTRACT_CONFIRM_PAYLOAD_INVALID: 'Xác nhận tải lên chưa hợp lệ.',
  CONTRACT_KEY_FOREIGN: 'Tệp này không thuộc về hợp đồng đang xem.',
  CONTRACT_OBJECT_MISSING: 'Tệp chưa có trên kho lưu trữ. Có thể tải lên chưa xong — hãy thử lại.',
  CONTRACT_FILE_TOO_LARGE: 'Tệp vượt quá dung lượng cho phép.',
  CONTRACT_NONE_ON_FILE: 'Hợp đồng này chưa có bản scan nào.',

  // ── Hoá đơn ──────────────────────────────────────────────────────────────
  INVOICE_NOT_FOUND: 'Không tìm thấy hoá đơn.',
  INVOICE_PAYLOAD_INVALID: 'Thông tin hoá đơn chưa hợp lệ.',
  ADHOC_INVOICE_PAYLOAD_INVALID: 'Thông tin hoá đơn phát sinh chưa hợp lệ.',
  INVOICE_MONTH_ALREADY_BILLED: 'Hợp đồng này đã có hoá đơn cho tháng đó.',
  INVOICE_MONTH_OUTSIDE_TENANCY: 'Tháng đó nằm ngoài thời gian hợp đồng thuê phòng.',
  INVOICE_LEASE_CANCELLED: 'Hợp đồng đã huỷ nên không có tháng nào để tính tiền.',
  INVOICE_PERIOD_EMPTY: 'Hợp đồng này không có ngày nào trong kỳ nên không có gì để tính.',
  INVOICE_FINAL_MONTH_EMPTY: 'Hợp đồng không ở ngày nào trong tháng kết thúc.',
  INVOICE_NO_RENT_LEFT:
    'Tháng kế tiếp nằm ngoài kỳ hạn hợp đồng nên không còn tiền nhà để tính — hãy ghi nhận trả phòng.',
  INVOICE_ALREADY_PAID: 'Hoá đơn này đã được thanh toán.',
  INVOICE_ALREADY_VOIDED: 'Hoá đơn này đã được rút.',
  INVOICE_VOID_PAYLOAD_INVALID: 'Thông tin rút hoá đơn chưa hợp lệ.',
  INVOICE_VOID_AFTER_PAYMENT:
    'Hoá đơn đã thu tiền nên không rút được. Hãy đảo giao dịch thanh toán trước.',
  INVOICE_SERVICE_FEE_UNKNOWN: 'Dịch vụ được chọn không tồn tại.',
  METER_BELOW_LEASE_START: 'Số điện cuối kỳ không thể thấp hơn số lúc hợp đồng bắt đầu.',
  METER_BELOW_INVOICED: 'Số điện cuối kỳ không thể thấp hơn số đã xuất hoá đơn trước đó.',
  METER_BELOW_PERIOD_OPENING: 'Số điện cuối kỳ không thể thấp hơn số đầu kỳ.',

  // ── Thanh toán ───────────────────────────────────────────────────────────
  PAYMENT_NOT_FOUND: 'Không tìm thấy giao dịch thanh toán.',
  PAYMENT_PAYLOAD_INVALID: 'Thông tin thanh toán chưa hợp lệ.',
  PAYMENT_ON_VOIDED_INVOICE: 'Không thể ghi nhận thanh toán cho hoá đơn đã rút.',
  PAYMENT_ALREADY_REVERSED: 'Giao dịch này đã được đảo.',
  PAYMENT_REVERSAL_PAYLOAD_INVALID: 'Thông tin đảo giao dịch chưa hợp lệ.',
  PAYMENT_NOT_FROM_GATEWAY: 'Giao dịch này không thực hiện qua cổng thanh toán.',
  GATEWAY_NOT_CONFIGURED: 'Máy chủ chưa cấu hình thanh toán trực tuyến.',
  GATEWAY_UNREACHABLE: 'Không kết nối được tới cổng thanh toán. Vui lòng thử lại.',
  GATEWAY_REFUSED: 'Cổng thanh toán từ chối yêu cầu.',

  // ── Tiền cọc ─────────────────────────────────────────────────────────────
  DEPOSIT_NONE_HELD: 'Hợp đồng này không giữ tiền cọc nào.',
  DEPOSIT_REFUND_PAYLOAD_INVALID: 'Thông tin trả cọc chưa hợp lệ.',
  DEPOSIT_ADJUSTMENT_PAYLOAD_INVALID: 'Thông tin điều chỉnh cọc chưa hợp lệ.',
  DEPOSIT_SPLIT_REQUIRED: 'Hãy ghi rõ trả lại bao nhiêu và giữ lại bao nhiêu.',
  DEPOSIT_SPLIT_MISMATCH: 'Số trả lại cộng số giữ lại phải bằng đúng số tiền cọc đang giữ.',
  DEPOSIT_ALREADY_RETURNED: 'Tiền cọc của hợp đồng này đã được trả.',
  DEPOSIT_LEASE_STILL_RUNNING: 'Hợp đồng còn hiệu lực nên chưa trả cọc được.',
  DEPOSIT_SETTLED_ON_CANCEL: 'Hợp đồng đã huỷ và tiền cọc được tất toán cùng lúc đó.',
  DEPOSIT_ADJUST_AFTER_CANCEL: 'Hợp đồng đã huỷ nên không còn khoản cọc nào để điều chỉnh.',
  DEPOSIT_ADJUST_AFTER_RETURN: 'Tiền cọc đã trả nên không còn khoản nào để điều chỉnh.',
  DEPOSIT_RETURN_EXCEEDS_HELD: 'Số trả lại vượt quá số tiền cọc đang giữ.',
  DEPOSIT_WOULD_GO_NEGATIVE: 'Thanh toán này sẽ khiến tiền cọc đang giữ bị âm.',
  DEPOSIT_TOO_SMALL_TO_SETTLE: 'Hoá đơn lớn hơn số tiền cọc đang giữ nên không trừ vào cọc được.',
  DEPOSIT_VOID_ALREADY_SPENT:
    'Khoản cọc do hoá đơn này lập đã bị dùng một phần. Hãy đảo các lần trừ cọc trước.',
  DEPOSIT_RESTORE_WOULD_GO_NEGATIVE: 'Khôi phục khoản trừ này sẽ khiến tiền cọc bị âm.',

  // ── Dịch vụ ──────────────────────────────────────────────────────────────
  SERVICE_FEE_NOT_FOUND: 'Không tìm thấy dịch vụ.',
  SERVICE_FEE_PAYLOAD_INVALID: 'Thông tin dịch vụ chưa hợp lệ.',
  SERVICE_FEE_SELECTION_INVALID: 'Lựa chọn dịch vụ chưa hợp lệ.',
  SERVICE_FEE_NAME_TAKEN: 'Toà nhà này đã có một dịch vụ trùng tên.',
  SERVICE_FEE_WRONG_BUILDING: 'Dịch vụ này thuộc toà nhà khác.',
  SERVICE_FEE_WITHDRAWN: 'Dịch vụ này không còn được cung cấp.',
  SERVICE_FEE_ALREADY_ON_LEASE:
    'Hợp đồng đã có dịch vụ này — hãy đổi số lượng thay vì thêm lần nữa.',
  SERVICE_FEE_STARTS_BEFORE_LEASE: 'Dịch vụ không thể bắt đầu trước ngày hợp đồng bắt đầu.',
  SERVICE_FEE_ENDS_BEFORE_START: 'Dịch vụ không thể kết thúc trước ngày bắt đầu.',
  LEASE_SERVICE_FEE_NOT_FOUND: 'Không tìm thấy dịch vụ trên hợp đồng này.',
  LEASE_SERVICE_FEE_ALREADY_ENDED: 'Dịch vụ này đã ngừng.',

  // ── Chi phí và tháng trống ───────────────────────────────────────────────
  EXPENSE_NOT_FOUND: 'Không tìm thấy khoản chi.',
  EXPENSE_PAYLOAD_INVALID: 'Thông tin khoản chi chưa hợp lệ.',
  EXPENSE_AMOUNT_REQUIRED: 'Cần nhập số tiền, hoặc nhập cả số lượng và đơn giá.',
  EXPENSE_AMOUNT_NOT_POSITIVE: 'Số tiền phải lớn hơn 0.',
  VACANCY_PAYLOAD_INVALID: 'Thông tin phòng trống chưa hợp lệ.',
  VACANCY_ROOM_WAS_LET:
    'Cuối tháng đó phòng vẫn đang cho thuê, nên điện nước thuộc hoá đơn của khách.',
  VACANCY_ALREADY_RECORDED: 'Phòng này đã được ghi nhận trống trong tháng đó.',
  VACANCY_NO_BASELINE_READING: 'Phòng này chưa có số công tơ nào để làm mốc.',
  VACANCY_READING_BELOW_LAST: 'Số công tơ không thể thấp hơn số đã ghi lần gần nhất.',

  // ── Báo cáo ──────────────────────────────────────────────────────────────
  REPORT_PARAMS_INVALID: 'Tham số báo cáo chưa hợp lệ.',

  // ── Địa chỉ ──────────────────────────────────────────────────────────────
  ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ.',
  ADDRESS_SEARCH_INVALID: 'Từ khoá tìm địa chỉ chưa hợp lệ.',
  ADDRESS_REQUEST_INVALID: 'Yêu cầu tra địa chỉ chưa hợp lệ.',
  ADDRESS_PLACE_ID_REQUIRED: 'Hãy chọn một địa chỉ từ danh sách gợi ý.',
  ADDRESS_LOOKUP_NOT_CONFIGURED: 'Máy chủ chưa cấu hình tra cứu địa chỉ.',
  ADDRESS_LOOKUP_UNAVAILABLE: 'Dịch vụ tra cứu địa chỉ đang không phản hồi.',
  ADDRESS_LOOKUP_UNREADABLE: 'Dịch vụ tra cứu địa chỉ trả về dữ liệu không đọc được.',

  // ── Cổng thông tin người thuê ────────────────────────────────────────────
  PORTAL_NOT_FOUND: 'Liên kết không còn hiệu lực.',
  PORTAL_LINK_NONE: 'Khách này chưa có liên kết xem hoá đơn.',
  PORTAL_LINK_ONLY_FOR_CUSTOMER: 'Chỉ khách thuê mới được cấp liên kết xem hoá đơn.',
}

/**
 * What to say about a failure nobody wrote a sentence for.
 *
 * The Record above makes this unreachable during development. It is reachable
 * in exactly one situation: a backend deployed ahead of its frontend, emitting
 * a code this build has never heard of.
 *
 * By HTTP status, because that is the one thing still known about the failure.
 * The two alternatives are worse — the API's own message puts English in front
 * of the reader precisely when something unfamiliar has broken, and the code
 * itself puts a developer's identifier there.
 */
function fallbackForStatus(status: number | null): string {
  if (status === null) return 'Không kết nối được tới máy chủ. Vui lòng thử lại.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Tài khoản của bạn không có quyền với mục này.'
  if (status === 404) return 'Không tìm thấy dữ liệu này.'
  if (status === 409) return 'Không thực hiện được vì trạng thái hiện tại đã khác.'
  if (status >= 500) return 'Máy chủ gặp sự cố. Vui lòng thử lại sau ít phút.'
  return 'Không thực hiện được yêu cầu này.'
}

/**
 * The sentence for a code, for callers that hold one without an `ApiError`.
 *
 * The tenant portal is such a caller: it has its own client and its own error
 * type, and before this it put the API's English straight in front of a tenant.
 * Both surfaces read from one dictionary here — the spec permits each to phrase
 * a code for its own reader, and the moment one actually wants different
 * wording is the moment to split this, not before.
 */
export function messageForCode(code: string | undefined, status: number | null): string {
  const phrase = code === undefined ? undefined : MESSAGES[code as BackendErrorCode]
  return phrase ?? fallbackForStatus(status)
}

/**
 * The sentence to show for any failure, in Vietnamese.
 *
 * Takes `unknown` because that is what a `catch` and a react-query `error` hand
 * over, and every caller would otherwise repeat the same narrowing.
 */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Đã xảy ra lỗi không mong muốn.'

  // A request that never arrived says so, whatever code it was given: there is
  // nothing wrong with the data, and telling the reader there is sends them
  // looking for a mistake they did not make.
  if (error.isTransport) return 'Không kết nối được tới máy chủ. Vui lòng thử lại.'

  const phrase = MESSAGES[error.code as BackendErrorCode]
  return phrase ?? fallbackForStatus(error.status)
}
