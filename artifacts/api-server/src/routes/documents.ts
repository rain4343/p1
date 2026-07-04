import { Router } from "express";
import { eq, ilike, and, desc, type SQL } from "drizzle-orm";
import { db, documentsTable, documentLogsTable, usersTable } from "@workspace/db";
import {
  CreateDocumentBody,
  UpdateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  DeleteDocumentParams,
  ListDocumentLogsParams,
  CreateDocumentLogParams,
  CreateDocumentLogBody,
  ListDocumentsQueryParams,
} from "@workspace/api-zod";

const router = Router();

async function getDocumentWithCreator(id: number) {
  const [doc] = await db
    .select({
      id: documentsTable.id,
      document_number: documentsTable.document_number,
      document_date: documentsTable.document_date,
      subject: documentsTable.subject,
      creator_id: documentsTable.creator_id,
      creator_name: usersTable.full_name,
      current_status: documentsTable.current_status,
      file_path: documentsTable.file_path,
      created_at: documentsTable.created_at,
      updated_at: documentsTable.updated_at,
    })
    .from(documentsTable)
    .leftJoin(usersTable, eq(documentsTable.creator_id, usersTable.id))
    .where(eq(documentsTable.id, id))
    .limit(1);
  return doc;
}

// GET /documents
router.get("/documents", async (req, res) => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query parameters" });
  const { search, status } = parsed.data;

  const conditions: SQL[] = [];
  if (search) {
    conditions.push(ilike(documentsTable.subject, `%${search}%`));
  }
  if (status) {
    conditions.push(eq(documentsTable.current_status, status));
  }

  const rows = await db
    .select({
      id: documentsTable.id,
      document_number: documentsTable.document_number,
      document_date: documentsTable.document_date,
      subject: documentsTable.subject,
      creator_id: documentsTable.creator_id,
      creator_name: usersTable.full_name,
      current_status: documentsTable.current_status,
      file_path: documentsTable.file_path,
      created_at: documentsTable.created_at,
      updated_at: documentsTable.updated_at,
    })
    .from(documentsTable)
    .leftJoin(usersTable, eq(documentsTable.creator_id, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(documentsTable.document_date));

  return res.json(rows);
});

// POST /documents
router.post("/documents", async (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [creator] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, parsed.data.creator_id)).limit(1);
  if (!creator) return res.status(400).json({ error: "Creator user does not exist" });

  const [existing] = await db.select({ id: documentsTable.id }).from(documentsTable).where(eq(documentsTable.document_number, parsed.data.document_number)).limit(1);
  if (existing) return res.status(409).json({ error: "Document number already exists" });

  const [doc] = await db.insert(documentsTable).values({
    ...parsed.data,
    document_date: parsed.data.document_date.toISOString().slice(0, 10),
  }).returning();

  await db.insert(documentLogsTable).values({
    document_id: doc.id,
    user_id: req.session?.userId ?? null,
    action: "دروستکرا",
    notes: null,
  });

  const result = await getDocumentWithCreator(doc.id);
  return res.status(201).json(result);
});

// GET /documents/:id
router.get("/documents/:id", async (req, res) => {
  const parsed = GetDocumentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid document ID" });

  const doc = await getDocumentWithCreator(parsed.data.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  return res.json(doc);
});

// PATCH /documents/:id
router.patch("/documents/:id", async (req, res) => {
  const paramParsed = UpdateDocumentParams.safeParse(req.params);
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid document ID" });

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [exists] = await db.select({ id: documentsTable.id, current_status: documentsTable.current_status }).from(documentsTable).where(eq(documentsTable.id, paramParsed.data.id)).limit(1);
  if (!exists) return res.status(404).json({ error: "Document not found" });

  if (parsed.data.document_number) {
    const [dup] = await db.select({ id: documentsTable.id }).from(documentsTable).where(eq(documentsTable.document_number, parsed.data.document_number)).limit(1);
    if (dup && dup.id !== paramParsed.data.id) return res.status(409).json({ error: "Document number already exists" });
  }

  await db.update(documentsTable).set({
    ...parsed.data,
    document_date: parsed.data.document_date ? parsed.data.document_date.toISOString().slice(0, 10) : undefined,
    updated_at: new Date(),
  }).where(eq(documentsTable.id, paramParsed.data.id));

  if (parsed.data.current_status && parsed.data.current_status !== exists.current_status) {
    await db.insert(documentLogsTable).values({
      document_id: paramParsed.data.id,
      user_id: req.session?.userId ?? null,
      action: `دۆخ گۆڕدرا بۆ: ${parsed.data.current_status}`,
      notes: null,
    });
  } else {
    await db.insert(documentLogsTable).values({
      document_id: paramParsed.data.id,
      user_id: req.session?.userId ?? null,
      action: "نوێکرایەوە",
      notes: null,
    });
  }

  const result = await getDocumentWithCreator(paramParsed.data.id);
  return res.json(result);
});

// DELETE /documents/:id
router.delete("/documents/:id", async (req, res) => {
  const parsed = DeleteDocumentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid document ID" });

  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, parsed.data.id)).returning();
  if (!doc) return res.status(404).json({ error: "Document not found" });
  return res.status(204).send();
});

// GET /documents/:id/logs
router.get("/documents/:id/logs", async (req, res) => {
  const parsed = ListDocumentLogsParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid document ID" });

  const [doc] = await db.select({ id: documentsTable.id }).from(documentsTable).where(eq(documentsTable.id, parsed.data.id)).limit(1);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const logs = await db
    .select({
      id: documentLogsTable.id,
      document_id: documentLogsTable.document_id,
      user_id: documentLogsTable.user_id,
      user_name: usersTable.full_name,
      action: documentLogsTable.action,
      notes: documentLogsTable.notes,
      timestamp: documentLogsTable.timestamp,
    })
    .from(documentLogsTable)
    .leftJoin(usersTable, eq(documentLogsTable.user_id, usersTable.id))
    .where(eq(documentLogsTable.document_id, parsed.data.id))
    .orderBy(desc(documentLogsTable.timestamp));

  return res.json(logs);
});

// POST /documents/:id/logs
router.post("/documents/:id/logs", async (req, res) => {
  const paramParsed = CreateDocumentLogParams.safeParse(req.params);
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid document ID" });

  const parsed = CreateDocumentLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [doc] = await db.select({ id: documentsTable.id }).from(documentsTable).where(eq(documentsTable.id, paramParsed.data.id)).limit(1);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const [log] = await db.insert(documentLogsTable).values({
    document_id: paramParsed.data.id,
    user_id: req.session?.userId ?? null,
    action: parsed.data.action,
    notes: parsed.data.notes ?? null,
  }).returning();

  return res.status(201).json(log);
});

export default router;
