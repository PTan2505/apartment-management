import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import { prisma } from "@/lib/prisma.js";
import { NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import { withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import type { ResidenceFormConfirmInput, ResidenceFormUploadInput } from "./schema.js";

const SLOT = storage.RESIDENCE_FORM_SLOT;

function assertStorage() {
  if (!storage.isConfigured()) {
    throw new ValidationError(
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured on this server",
    );
  }
}

/* ------------------------------------------------------------------ */
/* The blank form                                                      */
/* ------------------------------------------------------------------ */

/**
 * The blank residence form the owner uploaded, or that there is none.
 *
 * Absence is an answer, not a failure — the same shape as the blank contract,
 * and for the same reason: there is one of this file, it belongs to nobody in
 * particular, and storage is the record.
 */
export async function getForm() {
  assertStorage();
  const found = await storage.findSlotObject(SLOT);
  if (found === null) return { exists: false as const };
  return {
    exists: true as const,
    fileName: found.fileName,
    size: found.size,
    uploadedAt: found.uploadedAt,
  };
}

export async function signFormUpload(input: ResidenceFormUploadInput) {
  assertStorage();
  return storage.signSlotUpload(SLOT, input.fileName, input.contentType);
}

export async function confirmFormUpload(input: ResidenceFormConfirmInput) {
  assertStorage();

  // Checked against the slot's own place rather than trusted: without it, a
  // confirmation could point this at any object in the bucket.
  if (!input.key.startsWith(SLOT.prefix)) {
    throw new ValidationError(
      "RESIDENCE_FORM_KEY_FOREIGN",
      "File đó không phải là mẫu tờ khai được tải lên",
    );
  }

  const object = await storage.describeObject(input.key);
  if (object === null) {
    throw new ValidationError(
      "RESIDENCE_FORM_OBJECT_MISSING",
      "File chưa có trong kho. Có thể tải lên chưa xong — thử lại",
    );
  }

  // A size cannot be bound into a presigned PUT, so it is enforced here. The
  // oversized object is deleted: one nobody can reach through the application
  // is one nobody will ever clear.
  if (object.size > SLOT.maxBytes) {
    await storage.deleteObject(input.key);
    throw new ValidationError(
      "RESIDENCE_FORM_TOO_LARGE",
      `File lớn hơn giới hạn ${Math.round(SLOT.maxBytes / 1024 / 1024)} MB`,
    );
  }

  /*
    Opened before it is accepted.

    A .docx is a zip, and a file that is not one — an old binary .doc renamed,
    most likely, since that is the format the authorities publish CT01 as —
    cannot be filled in. Letting it through would store something that looks
    right and fails at the one moment the owner needs a form, so it is refused
    here with a message that names the actual problem.
  */
  const bytes = await storage.readObject(input.key);
  try {
    new Docxtemplater(new PizZip(bytes));
  } catch {
    await storage.deleteObject(input.key);
    throw new ValidationError(
      "RESIDENCE_FORM_NOT_A_DOCX",
      "File này không mở được như một file Word .docx. Nếu đang có bản .doc cũ, hãy mở bằng Word rồi Save As sang .docx",
    );
  }

  // Exactly one object is left behind: the form being replaced goes, and so
  // does any upload that reached storage and was never confirmed.
  await storage.clearPrefixExcept(SLOT.prefix, input.key).catch(() => {});

  // Described from the object just confirmed, NOT by listing the prefix. A
  // listing lags a write by a second or two, and reporting it here would show
  // the owner the file they had just replaced.
  return {
    exists: true as const,
    fileName: storage.slotFileName(SLOT, input.key),
    size: object.size,
    uploadedAt: object.uploadedAt,
  };
}

export async function getFormDownload() {
  assertStorage();
  const found = await storage.findSlotObject(SLOT);
  if (found === null) {
    throw new NotFoundError("RESIDENCE_FORM_NONE_ON_FILE", "Chưa tải lên mẫu tờ khai nào");
  }
  return storage.signSlotDownload(SLOT, found.key);
}

export async function removeForm() {
  assertStorage();
  const found = await storage.findSlotObject(SLOT);
  if (found === null) {
    throw new NotFoundError("RESIDENCE_FORM_NONE_ON_FILE", "Chưa tải lên mẫu tờ khai nào");
  }
  await storage.clearPrefixExcept(SLOT.prefix, null);
  // Stated rather than re-listed, for the same reason as confirmation.
  return { exists: false as const };
}

/* ------------------------------------------------------------------ */
/* Resolving what goes in the boxes                                    */
/* ------------------------------------------------------------------ */

/**
 * The labels, as the form prints them.
 *
 * Kept together so a box reported empty is named with the words the owner is
 * looking at on the paper — "mục 13" rather than "signatoryIdCardNumber".
 */
const BOX = {
  hoTen: "1. Họ, chữ đệm và tên",
  ngaySinh: "2. Ngày, tháng, năm sinh",
  gioiTinh: "3. Giới tính",
  soDinhDanh: "4. Số định danh cá nhân/CMND",
  soDienThoai: "5. Số điện thoại liên hệ",
  email: "6. Email",
  noiThuongTru: "7. Nơi thường trú",
  noiTamTru: "8. Nơi tạm trú",
  noiOHienTai: "9. Nơi ở hiện tại",
  ngheNghiep: "10. Nghề nghiệp, nơi làm việc",
  hoTenChuHo: "11. Họ, chữ đệm và tên chủ hộ",
  quanHeChuHo: "12. Quan hệ với chủ hộ",
  soDinhDanhChuHo: "13. Số định danh cá nhân/CMND của chủ hộ",
  // Inside the box-15 table: the relationship between two visitors, which no
  // registration records.
  quanHeNguoiThayDoi: "15. Quan hệ với người có thay đổi",
} as const;

/** What mục 14 always says here. This feature exists for exactly one request. */
const NOI_DUNG_DE_NGHI = "Đăng ký tạm trú";

const SEX_LABEL: Record<"male" | "female", string> = { male: "Nam", female: "Nữ" };

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * One identity number spread across twelve boxes.
 *
 * Boxes 4 and 13 on the published form are not dotted lines — they are grids of
 * twelve cells, one per digit. So the number is handed over as twelve separate
 * values rather than one string.
 *
 * A nine-digit CMND fills the first nine and leaves the rest empty, which is how
 * the box is filled in by hand. An absent number leaves all twelve empty, which
 * is the rule this whole module turns on: nothing is invented.
 */
function digitBoxes(prefix: string, value: string | null): Record<string, string> {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 12).split("");
  const boxes: Record<string, string> = {};
  for (let i = 0; i < 12; i += 1) {
    boxes[`${prefix}${i + 1}`] = digits[i] ?? "";
  }
  return boxes;
}

/**
 * Box 15 keeps the four blank rows the published form has.
 *
 * The template turns those four into ONE repeating row, so the table grows with
 * the number of people — and would shrink to nothing but its headings for the
 * common filing of a single guest. Padding the data back out to four restores
 * the form's own writing space, which is what somebody adding a name by hand at
 * the counter needs.
 *
 * Padding is not inventing: these are the empty rows the authorities printed.
 */
const HOUSEHOLD_MIN_ROWS = 4;

interface HouseholdRow {
  tt: string;
  hoTenTV: string;
  ngaySinhTV: string;
  gioiTinhTV: string;
  soDinhDanhTV: string;
  ngheNghiepTV: string;
  quanHeNguoiThayDoi: string;
  quanHeChuHoTV: string;
}

function padHousehold(rows: HouseholdRow[]): HouseholdRow[] {
  const blank: HouseholdRow = {
    tt: "",
    hoTenTV: "",
    ngaySinhTV: "",
    gioiTinhTV: "",
    soDinhDanhTV: "",
    ngheNghiepTV: "",
    quanHeNguoiThayDoi: "",
    quanHeChuHoTV: "",
  };
  const padded = [...rows];
  while (padded.length < HOUSEHOLD_MIN_ROWS) padded.push({ ...blank });
  return padded;
}

/** dd/mm/yyyy, read in UTC like every other date in this system. */
function formatDate(date: Date): string {
  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

const visitorSelect = {
  id: true,
  leaseId: true,
  fullName: true,
  idCardNumber: true,
  dateOfBirth: true,
  sex: true,
  permanentAddress: true,
  relationToSignatory: true,
  phone: true,
  email: true,
  occupation: true,
  cancelledAt: true,
} as const;

/**
 * Everything the form asks for, resolved, plus the boxes nothing could fill.
 *
 * ── Who the head of household is ────────────────────────────────────────────
 *
 * The lease SIGNATORY, never the landlord. The form asks who heads the
 * household at the address, which is the person registered as living there. The
 * landlord does not live there, and naming them would be a false statement on a
 * government form — an easy mistake to make from inside a landlord's software
 * where the owner is the main character.
 *
 * ── What is never invented ──────────────────────────────────────────────────
 *
 * A box with no record behind it comes back empty and is NAMED. No defaults, no
 * placeholder text, no inference. This is a document somebody signs and hands
 * to the police: a blank gets noticed and filled in, a guess gets signed.
 */
export async function resolveFiling(
  leaseId: number,
  visitorIds: number[],
  scope: BuildingScope,
) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    select: {
      id: true,
      room: {
        select: {
          id: true,
          roomCode: true,
          buildingId: true,
          building: {
            select: { id: true, displayName: true, address: true, ward: true, city: true },
          },
        },
      },
      occupants: {
        where: { isPrimary: true },
        orderBy: { joinedAt: "desc" },
        select: {
          leftAt: true,
          user: { select: { id: true, fullName: true, idCardNumber: true } },
        },
      },
      visitors: { where: { id: { in: visitorIds } }, select: visitorSelect },
    },
  });

  if (lease === null || !withinScope(scope, lease.room.buildingId)) {
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }

  /*
    Every requested registration has to belong to THIS tenancy and still be
    happening. Checked by comparing what came back against what was asked for,
    rather than by loading each in turn: the query above already restricted to
    this tenancy, so anything missing from the result was either somebody
    else's or does not exist — and the caller learns neither which.
  */
  const byId = new Map(lease.visitors.map((visitor) => [visitor.id, visitor]));
  const chosen = visitorIds.map((id) => {
    const visitor = byId.get(id);
    if (visitor === undefined) {
      throw new ValidationError(
        "RESIDENCE_FILING_VISITOR_FOREIGN",
        "Có người không thuộc hợp đồng này",
      );
    }
    if (visitor.cancelledAt !== null) {
      throw new ValidationError(
        "RESIDENCE_FILING_VISITOR_CANCELLED",
        `Đăng ký của ${visitor.fullName} đã bị huỷ — lần ở không diễn ra thì không có gì để khai`,
      );
    }
    return visitor;
  });

  const declarant = chosen[0]!;
  const household = chosen.slice(1);

  // Whoever signed, still here or last to hold it. A tenancy can have nobody
  // named on it, and that is a box to fill by hand rather than a refusal.
  const signatory = (lease.occupants.find((o) => o.leftAt === null) ?? lease.occupants[0])?.user;

  const building = lease.room.building;
  const addressOfStay = `Phòng ${lease.room.roomCode}, ${building.address}, ${building.ward}, ${building.city}`;

  const values = {
    // Derived from the building's recorded address, not invented: this is the
    // authority the paperwork goes to, and the owner can still edit the Word
    // document if they file with a different station.
    kinhGui: `Công an ${building.ward}, ${building.city}`,

    hoTen: declarant.fullName,
    ngaySinh: pad2(declarant.dateOfBirth.getUTCDate()),
    thangSinh: pad2(declarant.dateOfBirth.getUTCMonth() + 1),
    namSinh: String(declarant.dateOfBirth.getUTCFullYear()),
    ngaySinhDayDu: formatDate(declarant.dateOfBirth),
    gioiTinh: SEX_LABEL[declarant.sex],
    // Kept as one string for the preview to show, AND spread across the twelve
    // boxes the printed form has. Both, because the screen reads one and the
    // document reads the other.
    soDinhDanh: declarant.idCardNumber,
    ...digitBoxes("dd", declarant.idCardNumber),
    soDienThoai: declarant.phone ?? "",
    email: declarant.email ?? "",
    noiThuongTru: declarant.permanentAddress,
    // The same place twice, because for this filing they ARE the same place:
    // the room the person is staying in.
    noiTamTru: addressOfStay,
    noiOHienTai: addressOfStay,
    ngheNghiep: declarant.occupation ?? "",

    hoTenChuHo: signatory?.fullName ?? "",
    quanHeChuHo: declarant.relationToSignatory,
    soDinhDanhChuHo: signatory?.idCardNumber ?? "",
    ...digitBoxes("ch", signatory?.idCardNumber ?? null),

    noiDungDeNghi: NOI_DUNG_DE_NGHI,

    // Mục 15, as table rows. `tt` is the printed row number, which the form
    // numbers from one.
    thanhVien: padHousehold(
      household.map((member, index) => ({
        tt: String(index + 1),
        hoTenTV: member.fullName,
        ngaySinhTV: formatDate(member.dateOfBirth),
        gioiTinhTV: SEX_LABEL[member.sex],
        soDinhDanhTV: member.idCardNumber,
        ngheNghiepTV: member.occupation ?? "",
        /*
          The form asks for TWO relationships and the system holds one.

          "Quan hệ với chủ hộ" is what a registration records, so that column is
          filled. "Quan hệ với người có thay đổi" is the relationship to the
          DECLARANT — between two guests — and nothing here has ever been told
          it. A grandmother registered as the tenant's "bà" is not necessarily
          the first visitor's grandmother.

          So it is left EMPTY and named as a box to complete by hand. Copying
          the other column across would be plausible and sometimes wrong, on a
          document somebody signs for the police.
        */
        quanHeNguoiThayDoi: "",
        quanHeChuHoTV: member.relationToSignatory,
      })),
    ),
  };

  /*
    Which boxes nothing could fill.

    Only the ones the form NUMBERS, and only where the system could in principle
    hold the value — so the signature blocks are not listed, since they were
    always going to be signed by hand.
  */
  const emptyBoxes: string[] = [];
  const check = (value: string, label: string) => {
    if (value.trim() === "") emptyBoxes.push(label);
  };
  check(values.soDienThoai, BOX.soDienThoai);
  check(values.email, BOX.email);
  check(values.ngheNghiep, BOX.ngheNghiep);
  check(values.hoTenChuHo, BOX.hoTenChuHo);
  check(values.soDinhDanhChuHo, BOX.soDinhDanhChuHo);
  // Only when there is a household table to fill in at all.
  if (household.length > 0) emptyBoxes.push(BOX.quanHeNguoiThayDoi);

  return {
    lease: {
      id: lease.id,
      room: { id: lease.room.id, roomCode: lease.room.roomCode },
      building: { id: building.id, displayName: building.displayName },
    },
    declarant: { id: declarant.id, fullName: declarant.fullName },
    householdCount: household.length,
    signatory:
      signatory === undefined
        ? null
        : {
            id: signatory.id,
            fullName: signatory.fullName,
            hasIdCardNumber: signatory.idCardNumber !== null,
          },
    emptyBoxes,
    values,
  };
}

/* ------------------------------------------------------------------ */
/* Writing it into the document                                        */
/* ------------------------------------------------------------------ */

/**
 * The filled form, as bytes.
 *
 * ── Why the bytes go through the API ────────────────────────────────────────
 *
 * The project's rule is that large file bytes never cross the Express process.
 * This document is GENERATED — a few pages of text, a hundred kilobytes or so,
 * existing nowhere until it is asked for — so there is no object to sign a URL
 * for. Reading the blank, filling it and streaming the result is the only shape
 * available, and it is not the case the rule was written about.
 *
 * ── Why it is not stored ────────────────────────────────────────────────────
 *
 * It is derived entirely from records that change. A kept copy would start
 * disagreeing with them the first time a date was corrected, and then there
 * would be two answers to "what did we file".
 */
export async function renderFiling(
  leaseId: number,
  visitorIds: number[],
  scope: BuildingScope,
) {
  assertStorage();

  const found = await storage.findSlotObject(SLOT);
  if (found === null) {
    throw new NotFoundError(
      "RESIDENCE_FORM_NONE_ON_FILE",
      "Chưa tải lên mẫu tờ khai nào — tải mẫu CT01 lên trước đã",
    );
  }

  const filing = await resolveFiling(leaseId, visitorIds, scope);
  const template = await storage.readObject(found.key);

  let doc: Docxtemplater;
  try {
    doc = new Docxtemplater(new PizZip(template), {
      paragraphLoop: true,
      linebreaks: true,
      /*
        An empty box, never the word "undefined".

        This is the library's default behaviour being overridden, and it is the
        single most important line in this file: docxtemplater renders a missing
        value as the literal text "undefined", which on a form submitted to the
        police is far worse than a blank. A blank gets noticed and filled in.
      */
      nullGetter: () => "",
    });
    doc.render(filing.values);
  } catch (error) {
    /*
      A template problem, not a caller problem.

      The likeliest cause is a blank form carrying no placeholders at all — a
      published CT01 uploaded as-is — or one whose tags were mistyped. Either
      way the owner can fix it by replacing the file, so the message points
      there rather than reporting a server fault.
    */
    throw new ValidationError(
      "RESIDENCE_FORM_TEMPLATE_BROKEN",
      "Không điền được mẫu tờ khai. Kiểm tra lại các chỗ đánh dấu trong file mẫu, rồi tải lại",
      { reason: error instanceof Error ? error.message : String(error) },
    );
  }

  const bytes = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;

  return {
    bytes,
    fileName: `CT01-${filing.lease.room.roomCode}-${filing.declarant.fullName}.docx`,
    emptyBoxes: filing.emptyBoxes,
  };
}
