"""
Structured extraction from free-text clinical, laboratory and radiology reports.

Principles (how clinical NLP pipelines report extracted data):
- Nothing is invented. A value that is not in the report is returned as missing,
  never as a "normal" default.
- Every extracted value carries the sentence it came from (evidence), so a
  clinician can verify it.
- Findings are negation-aware (NegEx-style cues) and have three states:
  present / absent / not mentioned (plus "possible" for hedged mentions).
- Lab values are unit-aware and converted to the units the models use; the
  report's own reference range is kept when it is printed.
"""
import re
from typing import Optional

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------
# Split on full stops (but not decimal points), semicolons, line breaks and wide column gaps
_SENTENCE_SPLIT = re.compile(r"(?<!\d)\.(?!\d)|\.(?=\s+[A-Z])|[;\n\r]+|(?<=\S)\s{3,}")


def _sentences(text: str):
    return [s.strip() for s in _SENTENCE_SPLIT.split(text) if s and s.strip()]


def _snippet(sentence: str, limit: int = 180) -> str:
    sentence = re.sub(r"\s+", " ", sentence).strip()
    return sentence if len(sentence) <= limit else sentence[: limit - 1] + "…"


def _num(text: str) -> float:
    return float(text.replace(",", ""))


# ---------------------------------------------------------------------------
# Findings with negation detection
# ---------------------------------------------------------------------------
FINDINGS = {
    "cirrhosis_present": r"\bcirrho(?:sis|tic)\b|\bmetavir\s*f4\b|\bf4\s+fibrosis\b",
    "mvi_pathology": r"\bmvi\b|\bmicro-?\s?vascular\s+invasion\b|\bmicroscopic\s+vascular\s+invasion\b",
    "hepatitis_b": r"\bhepatitis[\s-]*b\b|\bhbv\b|\bhbsag\b",
    "hepatitis_c": r"\bhepatitis[\s-]*c\b|\bhcv\b|\banti-?hcv\b",
    "metastasis_present": r"\bmetasta(?:sis|ses|tic)\b|\bextrahepatic\s+spread\b|\bdistant\s+spread\b",
    "ascites": r"\bascites\b",
    "encephalopathy": r"\b(?:hepatic\s+)?encephalopathy\b",
}

_NEG_PRE = re.compile(
    r"\b(?:no|not|without|negative\s+for|no\s+evidence\s+of|no\s+signs?\s+of|absence\s+of|free\s+of|"
    r"ruled\s+out|rules\s+out|denies|denied|nor|neither)\b[^,]*$"
)
_NEG_POST = re.compile(
    r"^[\s:=\-–(]*(?:status\s*[:=\-]?\s*)?(?:is\s+|was\s+|are\s+|were\s+)?"
    r"(?:negative|neg\b|absent|none|no\b|nil\b|not\s+(?:seen|identified|detected|present|demonstrated|found)|"
    r"ruled\s+out|excluded|non-?reactive)"
)
_POS_POST = re.compile(r"^[\s:=\-–(]*(?:status\s*[:=\-]?\s*)?(?:is\s+|was\s+)?(?:positive|pos\b|present|detected|seen|identified|reactive|yes\b)")
# Result words later in the same clause, e.g. "Hepatitis B serology: HBsAg negative"
_RESULT_IN_CLAUSE = re.compile(
    r"\b(?P<neg>negative|neg|absent|non-?reactive|not\s+(?:seen|identified|detected|present|demonstrated|found)|ruled\s+out|excluded)\b"
    r"|\b(?P<pos>positive|pos|present|detected|reactive)\b"
)
_HEDGE = re.compile(r"\b(?:possible|possibly|suspicious\s+for|suspected|cannot\s+be\s+excluded|questionable|equivocal|probable)\b")
_SCOPE_BREAK = re.compile(r"\b(?:but|however|although|except|whereas)\b|[,:]")


def _classify_mention(sentence: str, match: re.Match) -> str:
    before = sentence[: match.start()]
    # Negation scope ends at a clause break ("no ascites, but cirrhosis present")
    breaks = list(_SCOPE_BREAK.finditer(before))
    scope = before[breaks[-1].end():] if breaks else before
    after = sentence[match.end(): match.end() + 40]
    if _POS_POST.match(after):
        return "present"
    if _NEG_POST.match(after) or _NEG_PRE.search(scope[-60:]):
        return "absent"
    clause = re.split(r"[,;]|\b(?:but|however|and)\b", after, maxsplit=1)[0]
    result = _RESULT_IN_CLAUSE.search(clause)
    if result:
        return "absent" if result.group("neg") else "present"
    if _HEDGE.search(scope[-60:]) or _HEDGE.search(after):
        return "possible"
    return "present"


def extract_findings(text: str) -> dict:
    sentences = _sentences(text)
    results = {}
    for field, pattern in FINDINGS.items():
        rx = re.compile(pattern, re.IGNORECASE)
        mentions = []
        for s in sentences:
            for m in rx.finditer(s):
                mentions.append((_classify_mention(s.lower(), m), s))
        statuses = {st for st, _ in mentions}
        if "present" in statuses:
            status = "present"
        elif "possible" in statuses:
            status = "possible"
        elif "absent" in statuses:
            status = "absent"
        else:
            status = "not_mentioned"
        evidence = next((s for st, s in mentions if st == status), None)
        results[field] = {
            "status": status,
            "mentions": len(mentions),
            "evidence": _snippet(evidence) if evidence else None,
            "conflicting": "present" in statuses and "absent" in statuses,
        }
    return results


# ---------------------------------------------------------------------------
# Laboratory values (unit-aware)
# ---------------------------------------------------------------------------
LABS = {
    "afp_ngml": {
        "label": "AFP", "names": r"alpha[\s-]*feto\s*protein|α[\s-]*fetoprotein|afp",
        "unit": "ng/mL", "units": {"ng/ml": 1.0, "µg/l": 1.0, "ug/l": 1.0, "mcg/l": 1.0, "iu/ml": 1.21, "ku/l": 1.21},
        "plausible": (0, 1_000_000),
    },
    "alt_iul": {
        "label": "ALT", "names": r"alanine\s+(?:amino)?transaminase|alanine\s+aminotransferase|sgpt|alt",
        "unit": "IU/L", "units": {"iu/l": 1.0, "u/l": 1.0}, "plausible": (0, 20_000),
    },
    "ast_iul": {
        "label": "AST", "names": r"aspartate\s+(?:amino)?transaminase|aspartate\s+aminotransferase|sgot|ast",
        "unit": "IU/L", "units": {"iu/l": 1.0, "u/l": 1.0}, "plausible": (0, 20_000),
    },
    "alp_iul": {
        "label": "ALP", "names": r"alkaline\s+phosphatase|alk\.?\s*phos|alp",
        "unit": "IU/L", "units": {"iu/l": 1.0, "u/l": 1.0}, "plausible": (0, 10_000),
    },
    "bilirubin_mgdl": {
        "label": "Bilirubin", "names": r"total\s+bilirubin|bilirubin\s*\(total\)|t\.?\s*bili(?:rubin)?|tbil|bilirubin",
        "unit": "mg/dL", "units": {"mg/dl": 1.0, "µmol/l": 1 / 17.1, "umol/l": 1 / 17.1}, "plausible": (0, 60),
    },
    "albumin_gdl": {
        "label": "Albumin", "names": r"serum\s+albumin|albumin|alb",
        "unit": "g/dL", "units": {"g/dl": 1.0, "g/l": 0.1}, "plausible": (0.5, 7),
    },
    "platelet_k_ul": {
        "label": "Platelets", "names": r"platelet\s+count|platelets?|plt",
        "unit": "k/µL", "units": {"k/µl": 1.0, "k/ul": 1.0, "x10^3/µl": 1.0, "x10^3/ul": 1.0, "10^3/µl": 1.0, "10^3/ul": 1.0,
                                  "x10^9/l": 1.0, "10^9/l": 1.0, "x10e9/l": 1.0, "/µl": 0.001, "/ul": 0.001, "/mm3": 0.001},
        "plausible": (1, 2000),
    },
    "inr": {
        "label": "INR", "names": r"inr|international\s+normali[sz]ed\s+ratio",
        "unit": "", "units": {}, "plausible": (0.5, 15),
    },
}

_NUMBER = re.compile(r"(?<![\d.])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)")
_DATE_AT = re.compile(r"\d{1,4}[/\-.]\d{1,2}[/\-.]\d{2,4}")
_RANGE = re.compile(
    r"(?:ref(?:erence)?(?:\s*range)?|normal(?:\s*range)?|nr|range)?\s*[:(\[]?\s*"
    r"(?:(?P<lo>\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(?P<hi>\d+(?:\.\d+)?)|(?P<op><|≤|<=|>|≥|>=)\s*(?P<bound>\d+(?:\.\d+)?))",
    re.IGNORECASE,
)
_FLAG = re.compile(r"^\s*\(?\s*(H|L|HIGH|LOW|↑|↓)\b\)?", re.IGNORECASE)


def _normalise_unit(raw: str) -> str:
    return raw.lower().replace("μ", "µ").replace("×", "x").replace(" ", "").replace("*", "x").replace("ml", "ml")


def _match_unit(rest: str, units: dict):
    """Longest known unit at the start of `rest`; returns (unit key, chars consumed)."""
    compact = _normalise_unit(rest[:20])
    best = None
    for key in units:
        if compact.startswith(key) and (best is None or len(key) > len(best)):
            best = key
    if best is None:
        return None, 0
    # Map consumed compact chars back onto the original string (spaces were removed)
    consumed, seen = 0, 0
    while consumed < len(rest) and seen < len(best):
        if rest[consumed] != " ":
            seen += 1
        consumed += 1
    return best, consumed


def _extract_lab(field: str, spec: dict, text: str) -> Optional[dict]:
    name_rx = re.compile(rf"(?<![a-z])(?:{spec['names']})(?![a-z])", re.IGNORECASE)
    for line in re.split(r"[\n\r]+", text):
        for name in name_rx.finditer(line):
            window = line[name.end(): name.end() + 60]
            date_spans = [d.span() for d in _DATE_AT.finditer(window)]
            for num in _NUMBER.finditer(window):
                # Skip numbers that are part of a date (e.g. "AFP 12/03/2026: 850")
                if any(a <= num.start() < b for a, b in date_spans):
                    continue
                # Do not jump over another word-heavy clause to reach a number
                if re.search(r"[a-z]{4,}", window[: num.start()], re.IGNORECASE) and num.start() > 25:
                    break
                reported = _num(num.group(1))
                rest = window[num.end():]
                unit_key, used = _match_unit(rest.lstrip(), spec["units"])
                rest_after_unit = rest.lstrip()[used:]
                factor = spec["units"].get(unit_key, 1.0) if unit_key else 1.0
                assumed = None
                if unit_key is None:
                    # Heuristics only where the magnitude makes the unit unambiguous
                    if field == "albumin_gdl" and reported > 10:
                        factor, assumed = 0.1, "g/L"
                    elif field == "platelet_k_ul" and reported > 2000:
                        factor, assumed = 0.001, "/µL"
                    elif field == "bilirubin_mgdl" and reported > 30:
                        factor, assumed = 1 / 17.1, "µmol/L"
                value = reported * factor
                lo, hi = spec["plausible"]
                if not lo <= value <= hi:
                    continue
                reference = None
                rng = _RANGE.search(rest_after_unit[:40])
                if rng:
                    if rng.group("lo") is not None:
                        reference = {"low": round(_num(rng.group("lo")) * factor, 3), "high": round(_num(rng.group("hi")) * factor, 3)}
                    elif rng.group("op") in ("<", "≤", "<="):
                        reference = {"low": None, "high": round(_num(rng.group("bound")) * factor, 3)}
                    else:
                        reference = {"low": round(_num(rng.group("bound")) * factor, 3), "high": None}
                    reference["text"] = rng.group(0).strip(" :([")
                flag_match = _FLAG.match(rest_after_unit)
                flag = None
                if flag_match:
                    flag = "H" if flag_match.group(1).upper() in ("H", "HIGH", "↑") else "L"
                elif reference:
                    if reference["high"] is not None and value > reference["high"]:
                        flag = "H"
                    elif reference["low"] is not None and value < reference["low"]:
                        flag = "L"
                return {
                    "value": round(value, 2),
                    "unit": spec["unit"],
                    "reported_value": reported,
                    "reported_unit": unit_key or assumed,
                    "unit_assumed": unit_key is None,
                    "reference": reference,
                    "flag": flag,
                    "evidence": _snippet(line),
                }
    return None


def extract_labs(text: str) -> dict:
    return {field: _extract_lab(field, spec, text) for field, spec in LABS.items()}


# ---------------------------------------------------------------------------
# Radiology findings from the report text
# ---------------------------------------------------------------------------
_LESION_WORDS = re.compile(r"\b(?:lesions?|mass(?:es)?|tumou?rs?|nodules?|observations?|hcc|hepatocellular)\b", re.IGNORECASE)
_DIMENSIONS = re.compile(
    r"(?P<a>\d+(?:\.\d+)?)\s*(?:(?:x|×|by)\s*(?P<b>\d+(?:\.\d+)?)\s*(?:(?:x|×|by)\s*(?P<c>\d+(?:\.\d+)?)\s*)?)?(?P<u>cm|mm)\b",
    re.IGNORECASE,
)
_COUNT_WORDS = {"one": 1, "single": 1, "solitary": 1, "unifocal": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6}
_COUNT = re.compile(
    r"\b(?P<n>one|two|three|four|five|six|\d)\s+(?:discrete\s+|separate\s+|hepatic\s+|liver\s+)?(?:lesions|masses|tumou?rs|nodules|observations)\b"
    r"|\b(?P<s>single|solitary|unifocal)\s+(?:hepatic\s+|liver\s+)?(?:lesion|mass|tumou?r|nodule|observation|hcc)\b",
    re.IGNORECASE,
)
_MULTIFOCAL = re.compile(r"\bmultifocal\b|\bmultiple\s+(?:lesions|masses|tumou?rs|nodules)\b", re.IGNORECASE)
_DENSITY = re.compile(r"(-?\d+(?:\.\d+)?)\s*(?:hu|hounsfield(?:\s+units?)?)\b", re.IGNORECASE)


def extract_radiology(text: str) -> dict:
    out = {}
    sentences = _sentences(text)

    # Largest lesion diameter (cm), as used for staging
    best = None
    for s in sentences:
        if not _LESION_WORDS.search(s):
            continue
        for m in _DIMENSIONS.finditer(s):
            dims = [float(d) for d in (m.group("a"), m.group("b"), m.group("c")) if d]
            size_cm = max(dims) / (10.0 if m.group("u").lower() == "mm" else 1.0)
            if 0.2 <= size_cm <= 30 and (best is None or size_cm > best[0]):
                best = (size_cm, s)
    if best:
        out["tumor_size_cm"] = {"value": round(best[0], 2), "evidence": _snippet(best[1])}

    for s in sentences:
        m = _COUNT.search(s)
        if m:
            n = m.group("n") or m.group("s")
            count = _COUNT_WORDS.get(n.lower()) if not n.isdigit() else int(n)
            if count:
                out["tumor_number"] = {"value": count, "evidence": _snippet(s)}
                break
    if "tumor_number" not in out:
        multi = next((s for s in sentences if _MULTIFOCAL.search(s)), None)
        if multi:
            out["tumor_number"] = {"value": None, "display": "Multiple (count not stated)", "evidence": _snippet(multi)}

    for s in sentences:
        if _LESION_WORDS.search(s) or "density" in s.lower() or "attenuation" in s.lower():
            m = _DENSITY.search(s)
            if m:
                out["tumor_density_hu"] = {"value": float(m.group(1)), "evidence": _snippet(s)}
                break

    # Radiomics values printed in the report
    for field, pattern in (("tumor_shape_irregularity", r"shape\s+irregularity[^\d\n]{0,15}(\d+(?:\.\d+)?)"),
                           ("tumor_texture_entropy", r"texture\s+entropy[^\d\n]{0,15}(-?\d+(?:\.\d+)?)")):
        for s in sentences:
            m = re.search(pattern, s, re.IGNORECASE)
            if m:
                out[field] = {"value": float(m.group(1)), "evidence": _snippet(s)}
                break

    for s in sentences:
        low = s.lower()
        if "margin" not in low:
            continue
        if re.search(r"\b(ill-?defined|infiltrative|indistinct)\b", low):
            out["margin_definition"] = {"value": "Ill-defined", "evidence": _snippet(s)}
        elif re.search(r"\b(irregular|jagged|spiculated|lobulated)\b", low):
            out["margin_definition"] = {"value": "Irregular", "evidence": _snippet(s)}
        elif re.search(r"\b(well-?defined|smooth|well-?circumscribed|sharp)\b", low):
            out["margin_definition"] = {"value": "Well-defined", "evidence": _snippet(s)}
        if "margin_definition" in out:
            break

    # LI-RADS major features: arterial phase hyperenhancement (APHE) and washout
    aphe = next((s for s in sentences if re.search(r"\baphe\b|arterial(?:\s+phase)?\s+(?:hyper)?enhanc|hypervascular", s, re.IGNORECASE)
                 and not _NEG_PRE.search(s.lower()[:40])), None)
    washout = next((s for s in sentences if re.search(r"\bwash-?\s?out\b", s, re.IGNORECASE)
                    and not re.search(r"\bno\s+(?:\w+\s+){0,2}wash-?\s?out", s, re.IGNORECASE)), None)
    if washout:
        out["enhancement_pattern"] = {"value": "APHE with washout" if aphe else "Washout", "evidence": _snippet(washout)}
    elif aphe:
        out["enhancement_pattern"] = {"value": "Arterial hyperenhancement (APHE)", "evidence": _snippet(aphe)}
    else:
        for s in sentences:
            m = re.search(r"\b(portal\s+venous|delayed)\s+(?:phase\s+)?enhancement\b", s, re.IGNORECASE)
            if m:
                out["enhancement_pattern"] = {"value": f"{m.group(1).title()} enhancement", "evidence": _snippet(s)}
                break

    lirads = re.search(r"\bLI-?RADS\s*(?:category\s*)?[:\-]?\s*(LR-?)?(\d|M|TIV|TR[\s-]?\w+)\b|\bLR-?(\d|M|TIV)\b", text, re.IGNORECASE)
    if lirads:
        cat = (lirads.group(2) or lirads.group(3)).upper().replace(" ", "-")
        out["lirads_category"] = {"value": f"LR-{cat}", "evidence": _snippet(text[max(0, lirads.start() - 40): lirads.end() + 40])}
    return out


# ---------------------------------------------------------------------------
# Staging: Child-Pugh (reported or calculated) and BCLC
# ---------------------------------------------------------------------------
_CP_REPORTED = re.compile(
    r"child[\s-]*(?:turcotte[\s-]*)?pugh(?:\s*(?:class|score|grade|stage))?\s*[:\-=]?\s*(?:class\s*)?(?P<cls>[abc])?\s*\(?(?P<score>\d{1,2})?\)?",
    re.IGNORECASE,
)


def _cp_class(score: int) -> str:
    return "A" if score <= 6 else "B" if score <= 9 else "C"


def extract_child_pugh(text: str, labs: dict, findings: dict) -> Optional[dict]:
    for s in _sentences(text):
        m = _CP_REPORTED.search(s)
        if m and (m.group("cls") or m.group("score")):
            score = int(m.group("score")) if m.group("score") and 5 <= int(m.group("score")) <= 15 else None
            cls = (m.group("cls") or _cp_class(score)).upper() if (m.group("cls") or score) else None
            if cls:
                return {"class": cls, "score": score, "method": "reported", "evidence": _snippet(s)}

    # Calculate from components when all five are available
    bili, alb, inr = (labs.get(k) for k in ("bilirubin_mgdl", "albumin_gdl", "inr"))
    ascites, enceph = findings.get("ascites", {}), findings.get("encephalopathy", {})
    if not (bili and alb and inr) or ascites.get("status") in (None, "not_mentioned", "possible") \
            or enceph.get("status") in (None, "not_mentioned", "possible"):
        return None
    b, a, i = bili["value"], alb["value"], inr["value"]
    points = {
        "bilirubin": 1 if b < 2 else 2 if b <= 3 else 3,
        "albumin": 1 if a > 3.5 else 2 if a >= 2.8 else 3,
        "inr": 1 if i < 1.7 else 2 if i <= 2.3 else 3,
        "ascites": 1 if ascites["status"] == "absent" else (3 if re.search(r"moderate|severe|tense|refractory", ascites.get("evidence") or "", re.IGNORECASE) else 2),
        "encephalopathy": 1 if enceph["status"] == "absent" else (3 if re.search(r"grade\s*(?:3|4|iii|iv)", enceph.get("evidence") or "", re.IGNORECASE) else 2),
    }
    score = sum(points.values())
    return {"class": _cp_class(score), "score": score, "method": "calculated", "points": points,
            "evidence": f"Bilirubin {b} mg/dL, albumin {a} g/dL, INR {i}, ascites {ascites['status']}, encephalopathy {enceph['status']}"}


_BCLC = re.compile(r"\b(?:bclc|barcelona\s+clinic\s+liver\s+cancer)(?:\s*(?:stage|class))?\s*[:\-=]?\s*(?:stage\s*)?\(?(0|a|b|c|d)\b", re.IGNORECASE)


def extract_bclc(text: str) -> Optional[dict]:
    for s in _sentences(text):
        m = _BCLC.search(s)
        if m:
            return {"stage": m.group(1).upper(), "evidence": _snippet(s)}
    return None


_REPORT_DATE = re.compile(
    r"(?:report(?:ed)?|collect(?:ed|ion)|sample|specimen|exam(?:ination)?|study|visit|summary|note|dated?)\b[^\n\d]{0,20}"
    r"(\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\.?\s+\d{4}|[a-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def extract_report(text: str) -> dict:
    """Extract labs, findings, radiology measurements and staging from report text."""
    text = text or ""
    labs = extract_labs(text)
    findings = extract_findings(text)
    radiology = extract_radiology(text)
    date = _REPORT_DATE.search(text)
    return {
        "labs": labs,
        "findings": findings,
        "radiology": radiology,
        "child_pugh": extract_child_pugh(text, labs, findings),
        "bclc": extract_bclc(text),
        "report_date": date.group(1) if date else None,
    }


def finding_to_flag(status: str):
    """Model input for a finding: True/False, or None when not stated (or only hedged)."""
    return {"present": True, "absent": False}.get(status)
