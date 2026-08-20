/**
 * Folds Vietnamese text into a form that can be matched against a query typed
 * without care for case or diacritics.
 *
 * This exists because the database was created with the `C` collation, which
 * folds case for ASCII only. `lower('ĐỨC')` returns `'ĐỨc'` there — the `Đ` and
 * `Ứ` are left alone — so a case-insensitive search is case-insensitive for
 * `abc` and case-sensitive for `ăâđ`. Diacritics are a separate problem again:
 * a Vietnamese name is routinely typed without them, and a search that demands
 * them finds nothing while the person plainly exists.
 *
 * ── Why `đ` is handled separately ───────────────────────────────────────────
 *
 * NFD splits a letter from its combining marks, which covers almost all of
 * Vietnamese:
 *
 *     'ế'  →  U+0065 U+0302 U+0301   →  'e'
 *     'ợ'  →  U+006F U+031B U+0323   →  'o'
 *
 * `đ` is not that. It is U+0111, a single code point with no canonical
 * decomposition, because the stroke is part of the letter rather than a mark
 * over it — the same class of letter as `ø` or `ł`. NFD has nothing to split,
 * so it passes through untouched and the mapping has to be explicit.
 *
 * Leaving it out is a silent failure, not a loud one: `'Trọ thủ đức'` would
 * fold to `'tro thu đuc'`, a search for `duc` would miss it, and nothing would
 * report an error. Names like `Đức`, `Đặng`, and `Đỗ` are common enough that
 * the gap would be wide and invisible.
 *
 * The result is a matching key. It is never shown to anyone and never written
 * back over the value it came from — it discards information deliberately, so
 * treating it as text is lossy.
 */

/** The Unicode combining diacritical marks block, which covers every Vietnamese tone and vowel mark. */
const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeVi(value: string): string {
  return (
    value
      // Lowercasing first turns `Đ` into `đ`, so only the one mapping below is
      // needed rather than a pair — one fewer place to forget.
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/đ/g, "d")
  );
}
