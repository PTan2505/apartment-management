/**
 * Turns the published CT01 into a fillable template.
 *
 * ── Why this is a script and not a hand-edited file ─────────────────────────
 *
 * The authorities publish CT01 as a Word document with no placeholders in it.
 * Something has to put them there. Doing it by hand in Word produces a binary
 * nobody can review and nobody can redo when the form is reissued — and it WILL
 * be reissued, because it was last reissued in 2021 by Thông tư 56/2021/TT-BCA.
 *
 * So the transformation is code. The published file stays pristine at
 * `assets/CT01.docx`, and this writes `assets/CT01-template.docx` beside it.
 *
 * ── Two things about this file that will bite anybody who edits it ──────────
 *
 * 1. The text inside the document is NOT in composed Unicode. It is NFD, so
 *    "Kính gửi" typed in an editor does not equal "Kính gửi" in the XML. Every
 *    comparison here normalises first. Without that the script matches nothing
 *    and reports cheerful success.
 *
 * 2. Boxes 4 and 13 — the identity numbers — are not dotted lines. They are
 *    twelve-cell grids, one cell per digit, which is why the number is split
 *    across twelve placeholders instead of being written as one.
 *
 * Run with: npm run ct01:template
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import PizZip from "pizzip";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "..", "assets");
const SOURCE = join(ASSETS, "CT01.docx");
const TARGET = join(ASSETS, "CT01-template.docx");
const PART = "word/document.xml";

/** The document's own spelling, whatever form it is stored in. */
function nfc(text: string): string {
  return text.normalize("NFC");
}

function runText(run: string): string {
  return nfc(
    [...run.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]!).join(""),
  );
}

/** A tab, or a row of dots: the places the published form leaves to write in. */
function isFillable(run: string): boolean {
  if (/<w:tab\/>/.test(run)) return true;
  const text = runText(run);
  return text.length > 0 && /^[….\s]+$/.test(text);
}

function rPrOf(run: string): string {
  return /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] ?? "";
}

function xmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function newRun(rPr: string, text: string): string {
  return `<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

/**
 * Writes a placeholder into one fillable run.
 *
 * A run carrying dots has its TEXT replaced, so the tab stop and the font stay
 * exactly as published. A run that is nothing but a tab gets a new run inserted
 * BEFORE it — put after, the text would start at the tab stop, which on these
 * paragraphs is the right-hand margin.
 */
function fill(run: string, placeholder: string): string {
  if (/<w:t(?:\s[^>]*)?>/.test(run)) {
    let first = true;
    return run.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g, (_m, open, _body, close) => {
      if (!first) return `${open}${close}`;
      first = false;
      return `<w:t xml:space="preserve">${xmlEscape(placeholder)}${close}`;
    });
  }
  return newRun(rPrOf(run), placeholder) + run;
}

/**
 * The outermost tables, as slices.
 *
 * Depth-counted rather than matched with a regex, because `</w:tbl>` found by
 * searching forwards from an opening tag is the wrong one as soon as a table
 * contains another — and this form nests them.
 */
function topLevelTables(doc: string): { start: number; end: number; xml: string }[] {
  const tables: { start: number; end: number; xml: string }[] = [];
  const tags = /<w:tbl>|<\/w:tbl>/g;
  let depth = 0;
  let start = -1;
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(doc)) !== null) {
    if (tag[0] === "<w:tbl>") {
      if (depth === 0) start = tag.index;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        const end = tag.index + tag[0].length;
        tables.push({ start, end, xml: doc.slice(start, end) });
        start = -1;
      }
    }
  }
  return tables;
}

/**
 * The placeholders each labelled paragraph takes, in the order the form reads.
 *
 * Matched on label text rather than on a paragraph number, so a reissued form
 * that moves a line still works — and a reissue that RENAMES a line fails
 * loudly below instead of silently filling the wrong box.
 */
const PARAGRAPH_FILLS: { label: string; placeholders: string[] }[] = [
  { label: "Kính gửi", placeholders: ["{kinhGui}"] },
  { label: "1. Họ, chữ đệm và tên", placeholders: ["{hoTen}"] },
  {
    label: "2. Ngày, tháng, năm sinh",
    placeholders: ["{ngaySinh}", "{thangSinh}", "{namSinh}", "{gioiTinh}"],
  },
  { label: "5. Số điện thoại liên hệ", placeholders: ["{soDienThoai}", "{email}"] },
  { label: "7. Nơi thường trú", placeholders: ["{noiThuongTru}"] },
  { label: "8. Nơi tạm trú", placeholders: ["{noiTamTru}"] },
  { label: "9. Nơi ở hiện tại", placeholders: ["{noiOHienTai}"] },
  { label: "10. Nghề nghiệp", placeholders: ["{ngheNghiep}"] },
  { label: "11. Họ, chữ đệm và tên chủ hộ", placeholders: ["{hoTenChuHo}", "{quanHeChuHo}"] },
  { label: "14. Nội dung đề nghị", placeholders: ["{noiDungDeNghi}"] },
];

/** Box 4 is the declarant's number, box 13 the head of household's. */
const DIGIT_GRIDS: { label: string; prefix: string }[] = [
  { label: "4. Số định danh cá nhân/CMND", prefix: "dd" },
  { label: "13. Số định danh cá nhân/CMND của chủ hộ", prefix: "ch" },
];

const HOUSEHOLD_COLUMNS = [
  "{#thanhVien}{tt}",
  "{hoTenTV}",
  "{ngaySinhTV}",
  "{gioiTinhTV}",
  "{soDinhDanhTV}",
  "{ngheNghiepTV}",
  "{quanHeNguoiThayDoi}",
  "{quanHeChuHoTV}{/thanhVien}",
];

const problems: string[] = [];

// A .docx is a ZIP. Reading the file itself as text yields compressed bytes
// that match nothing, which is a mistake that looks exactly like a reissued
// form — so the part is pulled out of the archive here, once.
const source = new PizZip(readFileSync(SOURCE));
const part = source.file(PART);
if (part === null) {
  throw new Error(`${SOURCE} has no ${PART} — is it really a .docx?`);
}
let xml = part.asText();

/* ---------- 1. the dotted-line and tab boxes ---------- */

const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => m[0]);

for (const { label, placeholders } of PARAGRAPH_FILLS) {
  const target = paragraphs.find((p) => nfc(runText(p)).includes(nfc(label)));
  if (target === undefined) {
    problems.push(`no paragraph contains "${label}"`);
    continue;
  }

  const runs = [...target.matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)].map((m) => m[0]);
  const fillable = runs.filter(isFillable);
  if (fillable.length !== placeholders.length) {
    problems.push(
      `"${label}" has ${fillable.length} writable spots but ${placeholders.length} placeholders`,
    );
    continue;
  }

  let rebuilt = target;
  fillable.forEach((run, index) => {
    // Replaced one occurrence at a time: identical runs do occur, and a global
    // replace would write the same placeholder into every one of them.
    rebuilt = rebuilt.replace(run, fill(run, placeholders[index]!));
  });
  xml = xml.replace(target, rebuilt);
}

/* ---------- 2. the twelve-cell identity grids ---------- */

/*
  The label for boxes 4 and 13 sits INSIDE the grid it belongs to — the first
  cell of the table, with the twelve digit boxes beside it. Looking for "the
  next table after the label" therefore lands on the FOLLOWING grid, which has
  twelve empty cells too and accepts the placeholders without complaint.
*/
for (const { label, prefix } of DIGIT_GRIDS) {
  const grid = topLevelTables(xml).find((table) =>
    nfc(runText(table.xml)).includes(nfc(label)),
  );
  if (grid === undefined) {
    problems.push(`no table contains "${label}"`);
    continue;
  }

  const cells = [...grid.xml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);
  // The first cell holds the label; the rest are the digit boxes.
  const digitCells = cells.filter((cell) => runText(cell).trim() === "");
  if (digitCells.length !== 12) {
    problems.push(`"${label}" has ${digitCells.length} empty boxes, expected 12`);
    continue;
  }

  let rebuilt = grid.xml;
  digitCells.forEach((cell, index) => {
    const placeholder = `{${prefix}${index + 1}}`;
    // An empty cell still holds a paragraph; the placeholder goes inside it so
    // the cell keeps its borders and its vertical centring.
    const withRun = cell.replace(
      /(<w:p[ >][\s\S]*?)(<\/w:p>)/,
      (_m, head: string, close: string) => `${head}${newRun("", placeholder)}${close}`,
    );
    rebuilt = rebuilt.replace(cell, withRun);
  });
  xml = xml.slice(0, grid.start) + rebuilt + xml.slice(grid.end);
}

/* ---------- 3. the household table becomes one repeating row ---------- */

{
  const marker = paragraphs.find((p) =>
    nfc(runText(p)).includes(nfc("15. Những thành viên trong hộ gia đình")),
  );
  if (marker === undefined) {
    problems.push("no paragraph introduces box 15");
  } else {
    // This label IS a plain paragraph, outside any table, with its table next.
    const after = xml.indexOf(marker) + marker.length;
    const found = topLevelTables(xml).find((t) => t.start >= after);
    if (found === undefined) {
      problems.push("no table follows box 15");
      throw new Error("unreachable");
    }
    const table = found.xml;

    const rows = [...table.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
    const blankRows = rows.filter((row) => runText(row).trim() === "");
    if (blankRows.length === 0) {
      problems.push("box 15 has no blank rows to turn into a repeating row");
    } else {
      const templateRow = blankRows[0]!;
      const cells = [...templateRow.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);
      if (cells.length !== HOUSEHOLD_COLUMNS.length) {
        problems.push(
          `box 15 has ${cells.length} columns but ${HOUSEHOLD_COLUMNS.length} placeholders`,
        );
      } else {
        let loopRow = templateRow;
        cells.forEach((cell, index) => {
          const withRun = cell.replace(
            /(<w:p[ >][\s\S]*?)(<\/w:p>)/,
            (_m, head: string, close: string) =>
              `${head}${newRun("", HOUSEHOLD_COLUMNS[index]!)}${close}`,
          );
          loopRow = loopRow.replace(cell, withRun);
        });

        // One repeating row replaces the published four. The number of rows is
        // then the number of people, and the service pads the data back out to
        // four so a filing with one guest still prints with the form's own
        // writing space rather than a table with nothing under the headings.
        let rebuilt = table.replace(templateRow, loopRow);
        for (const row of blankRows.slice(1)) rebuilt = rebuilt.replace(row, "");
        xml = xml.replace(table, rebuilt);
      }
    }
  }
}

/* ---------- 4. write it out, or refuse ---------- */

if (problems.length > 0) {
  console.error("Could not build the template:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nThe published form has probably changed. Re-read its structure before editing this script.",
  );
  process.exitCode = 1;
} else {
  source.file(PART, xml);
  writeFileSync(TARGET, source.generate({ type: "nodebuffer", compression: "DEFLATE" }));

  const placed = [
    ...PARAGRAPH_FILLS.flatMap((f) => f.placeholders),
    ...DIGIT_GRIDS.flatMap(({ prefix }) =>
      Array.from({ length: 12 }, (_, i) => `{${prefix}${i + 1}}`),
    ),
    ...HOUSEHOLD_COLUMNS,
  ];
  console.log(`Wrote ${TARGET}`);
  console.log(`${placed.length} placeholders placed.`);
}
