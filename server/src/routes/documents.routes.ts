import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeDocument } from "../utils/serializers.js";
import { supabase } from "../supabase.js";

export const documentsRouter = Router();

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "Only PDF, JPEG, PNG, WEBP, DOC, and DOCX files are permitted",
        ),
      );
    }
  },
});

const idParams = z.object({ id: z.string().min(1) });
const documentTypeSchema = z.enum(["contract", "certificate", "id", "offer_letter", "other"]);

const documentsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
  type: documentTypeSchema.optional(),
});

// Metadata arrives as multipart form fields alongside the binary file
const documentMetaSchema = z.object({
  name: z.string().min(2).max(200),
  type: documentTypeSchema,
  employeeId: z.string().min(1),
});

documentsRouter.use(authenticate);

// ── List Documents ─────────────────────────────────────────────────────────
documentsRouter.get(
  "/",
  validate({ query: documentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof documentsQuerySchema>;
    const { skip, take } = getPagination(query);
    const privileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    // Non-privileged employees only see their own documents
    const employeeId = privileged ? query.employeeId : req.user!.employeeId;
    const where: Prisma.DocumentItemWhereInput = {
      ...(employeeId ? { employeeId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    };
    const [total, documents] = await prisma.$transaction([
      prisma.documentItem.count({ where }),
      prisma.documentItem.findMany({
        where,
        include: { employee: true, uploadedBy: true },
        orderBy: { uploadedAt: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, documents.map(serializeDocument), pageMeta(total, query));
  }),
);

// ── Upload Document ────────────────────────────────────────────────────────
documentsRouter.post(
  "/",
  authorize("admin", "manager", "supervisor"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "FILE_REQUIRED", "A file must be attached under the 'file' field");
    }
    // Parse and validate form-text metadata fields
    const meta = documentMetaSchema.parse(req.body);
    const sizeKb = Math.ceil(req.file.size / 1024);

    // Generate unique storage key
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const storageKey = `${uniqueSuffix}${ext}`;

    // Upload buffer to Supabase Storage bucket 'documents'
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storageKey, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      throw new ApiError(
        500,
        "STORAGE_UPLOAD_FAILED",
        `Failed to save file to cloud storage: ${uploadError.message}`,
      );
    }

    const document = await prisma.documentItem.create({
      data: {
        name: meta.name,
        type: meta.type,
        employeeId: meta.employeeId,
        uploadedById: req.user!.employeeId,
        storageKey,
        mimeType: req.file.mimetype,
        sizeKb,
      },
      include: { employee: true, uploadedBy: true },
    });
    await audit(req, "document.upload", `document:${document.id}`, { sizeKb });
    created(res, serializeDocument(document));
  }),
);

// ── Download Document ──────────────────────────────────────────────────────
documentsRouter.get(
  "/:id/download",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const document = await prisma.documentItem.findUniqueOrThrow({ where: { id } });

    const isOwner = document.employeeId === req.user!.employeeId;
    const isPrivileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    if (!isOwner && !isPrivileged) {
      throw new ApiError(403, "FORBIDDEN", "You do not have access to this document");
    }

    // Generate a temporary signed URL for file download
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storageKey, 60);

    if (error || !data?.signedUrl) {
      console.error("Supabase signed URL error:", error);
      throw new ApiError(
        404,
        "FILE_NOT_FOUND",
        "The file could not be retrieved from cloud storage",
      );
    }

    res.redirect(data.signedUrl);
  }),
);

// ── Delete Document ────────────────────────────────────────────────────────
documentsRouter.delete(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const document = await prisma.documentItem.findUniqueOrThrow({ where: { id } });

    // Delete DB record first
    await prisma.documentItem.delete({ where: { id } });

    // Attempt best-effort file removal from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([document.storageKey]);

    if (deleteError) {
      console.warn(`Failed to clean up Supabase storage file ${document.storageKey}:`, deleteError);
    }

    await audit(req, "document.delete", `document:${id}`);
    ok(res, { success: true });
  }),
);
