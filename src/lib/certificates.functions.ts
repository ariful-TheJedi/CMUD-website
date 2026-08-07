import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { requireAuth } from "@/lib/require-auth";
import { assertSectionView, assertSectionUpdate } from "@/lib/admin-guards";
import { writeAuditLog } from "@/lib/audit";
import { dbQuery } from "@/lib/db-helpers";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type CertificateRow = {
  id: string;
  studentName: string;
  courseName: string;
  batch: string;
  yearOfAdmission: string | null;
  certificateNumber: string;
  bmdcNumber: string | null;
  mobileNumber: string | null;
};

export type CertificateInput = Omit<CertificateRow, "id"> & { id?: string };

type CertDbRow = {
  id: string;
  student_name: string;
  course_name: string;
  batch: string;
  year_of_admission: string | null;
  certificate_number: string;
  bmdc_number: string | null;
  mobile_number: string | null;
};

function toRow(r: CertDbRow): CertificateRow {
  return {
    id: r.id,
    studentName: r.student_name,
    courseName: r.course_name,
    batch: r.batch,
    yearOfAdmission: r.year_of_admission,
    certificateNumber: r.certificate_number,
    bmdcNumber: r.bmdc_number,
    mobileNumber: r.mobile_number,
  };
}

export type PublicCertificateMatch = {
  studentName: string;
  courseName: string;
  batch: string;
  yearOfAdmission: string | null;
  certificateNumber: string;
  bmdcMasked: string | null;
  issuer: string;
  status: "valid";
};

export type VerifyCertificateResult =
  | { valid: true; matches: PublicCertificateMatch[] }
  | { valid: false };

const ISSUER = "College of Medical Ultrasound & Doppler (CMUD)";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

async function hashKey(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function checkRateLimit(bucketKey: string): boolean {
  const now = Date.now();
  const b = rateBuckets.get(bucketKey);
  if (!b || b.resetAt < now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count += 1;
  return true;
}

function normalize(v: string) {
  return v.trim().replace(/\s+/g, "").toUpperCase();
}

const ID_RE = /^[A-Z0-9][A-Z0-9\-_/]{3,63}$/;

function maskBmdc(v: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (s.length <= 2) return "*".repeat(s.length);
  if (s.length <= 4) return `${s[0]}${"*".repeat(s.length - 2)}${s[s.length - 1]}`;
  return `${s[0]}${"*".repeat(Math.max(3, s.length - 3))}${s.slice(-2)}`;
}

function toPublicMatch(r: CertDbRow): PublicCertificateMatch {
  return {
    studentName: r.student_name,
    courseName: r.course_name,
    batch: r.batch,
    yearOfAdmission: r.year_of_admission,
    certificateNumber: r.certificate_number,
    bmdcMasked: maskBmdc(r.bmdc_number),
    issuer: ISSUER,
    status: "valid",
  };
}

const CERT_SELECT = `
  id, student_name, course_name, batch, year_of_admission,
  certificate_number, bmdc_number, mobile_number
`;

export const verifyCertificate = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { type: "certificate" | "bmdc"; value: string; captchaToken: string }) => input,
  )
  .handler(async ({ data }): Promise<VerifyCertificateResult> => {
    const value = normalize(data.value ?? "");
    if (!value || !ID_RE.test(value)) return { valid: false };

    let ipKey = "anon";
    try {
      const ip = getRequestIP({ xForwardedFor: true }) ?? "anon";
      ipKey = await hashKey(ip);
    } catch {
      // no request context
    }
    if (!checkRateLimit(ipKey)) return { valid: false };

    try {
      await verifyTurnstileToken(data.captchaToken);
    } catch {
      throw new Error("Captcha verification failed");
    }

    try {
      const column =
        data.type === "certificate" ? "certificate_number" : "bmdc_number";
      const { rows } = await dbQuery<CertDbRow>(
        "verifyCertificate",
        `SELECT ${CERT_SELECT}
         FROM certificates
         WHERE UPPER(REPLACE(COALESCE(${column}, ''), ' ', '')) = $1
         LIMIT 10`,
        [value],
      );
      if (rows.length === 0) return { valid: false };
      return { valid: true, matches: rows.map(toPublicMatch) };
    } catch (err) {
      console.error("[certificates] verify failed:", err);
      return { valid: false };
    }
  });

export const listAllCertificatesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<CertificateRow[]> => {
    await assertSectionView(context, "certificates");
    const { rows } = await dbQuery<CertDbRow>(
      "listAllCertificatesAdmin",
      `SELECT ${CERT_SELECT}
       FROM certificates
       ORDER BY created_at DESC`,
    );
    return rows.map(toRow);
  });

const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\/(19|20)\d{2}$/;

function toPayload(input: CertificateInput) {
  const year = input.yearOfAdmission?.trim() || null;
  if (year && !MONTH_YEAR_RE.test(year)) {
    throw new Error("Month/Year of Admission must be in MM/YYYY format (e.g. 01/2024)");
  }
  return {
    student_name: input.studentName.trim(),
    course_name: input.courseName.trim(),
    batch: input.batch.trim(),
    year_of_admission: year,
    certificate_number: input.certificateNumber.trim(),
    bmdc_number: input.bmdcNumber?.trim() || null,
    mobile_number: input.mobileNumber?.trim() || null,
  };
}

export const upsertCertificateAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: CertificateInput) => input)
  .handler(async ({ data, context }): Promise<CertificateRow> => {
    try {
      await assertSectionUpdate(context, "certificates");
      const payload = toPayload(data);
      if (!payload.student_name) throw new Error("Student name is required");
      if (!payload.course_name) throw new Error("Course name is required");
      if (!payload.certificate_number) throw new Error("Certificate number is required");

      if (data.id) {
        const { rows } = await dbQuery<CertDbRow>(
          "upsertCertificateAdmin.update",
          `UPDATE certificates SET
             student_name = $1, course_name = $2, batch = $3, year_of_admission = $4,
             certificate_number = $5, bmdc_number = $6, mobile_number = $7, updated_at = now()
           WHERE id = $8
           RETURNING ${CERT_SELECT}`,
          [
            payload.student_name,
            payload.course_name,
            payload.batch,
            payload.year_of_admission,
            payload.certificate_number,
            payload.bmdc_number,
            payload.mobile_number,
            data.id,
          ],
        );
        const row = rows[0];
        if (!row) throw new Error("Certificate not found");
        await writeAuditLog(context, {
          action: "certificate.updated",
          contentType: "certificate",
          contentId: row.id,
          summary: `Certificate ${row.certificate_number}`,
        });
        return toRow(row);
      }

      const { rows } = await dbQuery<CertDbRow>(
        "upsertCertificateAdmin.insert",
        `INSERT INTO certificates (
           student_name, course_name, batch, year_of_admission,
           certificate_number, bmdc_number, mobile_number
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING ${CERT_SELECT}`,
        [
          payload.student_name,
          payload.course_name,
          payload.batch,
          payload.year_of_admission,
          payload.certificate_number,
          payload.bmdc_number,
          payload.mobile_number,
        ],
      );
      const row = rows[0];
      if (!row) throw new Error("Insert failed");
      await writeAuditLog(context, {
        action: "certificate.created",
        contentType: "certificate",
        contentId: row.id,
        summary: `Certificate ${row.certificate_number}`,
      });
      return toRow(row);
    } catch (error) {
      console.error("DB Error in upsertCertificateAdmin:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (/unique|duplicate/i.test(msg)) {
        throw new Error("Certificate number already exists");
      }
      throw error instanceof Error ? error : new Error(msg);
    }
  });

export const bulkInsertCertificatesAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { rows: CertificateInput[] }) => input)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ inserted: number; errors: { row: number; message: string }[] }> => {
      await assertSectionUpdate(context, "certificates");
      const errors: { row: number; message: string }[] = [];
      const valid: ReturnType<typeof toPayload>[] = [];
      data.rows.forEach((r, i) => {
        try {
          const p = toPayload(r);
          if (!p.student_name || !p.course_name || !p.certificate_number) {
            throw new Error(
              "Missing required fields (Student Name, Course Name, Certificate Number)",
            );
          }
          valid.push(p);
        } catch (e) {
          errors.push({ row: i + 2, message: (e as Error).message });
        }
      });
      if (valid.length === 0) return { inserted: 0, errors };

      let inserted = 0;
      for (const p of valid) {
        try {
          await dbQuery(
            "bulkInsertCertificatesAdmin.insert",
            `INSERT INTO certificates (
               student_name, course_name, batch, year_of_admission,
               certificate_number, bmdc_number, mobile_number
             ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              p.student_name,
              p.course_name,
              p.batch,
              p.year_of_admission,
              p.certificate_number,
              p.bmdc_number,
              p.mobile_number,
            ],
          );
          inserted += 1;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({
            row: 0,
            message: /unique|duplicate/i.test(msg)
              ? `Duplicate certificate number: ${p.certificate_number}`
              : msg,
          });
        }
      }

      await writeAuditLog(context, {
        action: "certificate.bulk_imported",
        contentType: "certificate",
        summary: `Bulk imported ${inserted} certificates (${errors.length} errors)`,
      });
      return { inserted, errors };
    },
  );

export const deleteCertificateAdmin = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSectionUpdate(context, "certificates");
    await dbQuery("deleteCertificateAdmin", `DELETE FROM certificates WHERE id = $1`, [data.id]);
    await writeAuditLog(context, {
      action: "certificate.deleted",
      contentType: "certificate",
      contentId: data.id,
      summary: `Deleted certificate ${data.id}`,
    });
    return { ok: true };
  });
