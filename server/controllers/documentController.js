/* Documents API with real file upload/download and object-level access.
 *  - HR/Admin: all documents.
 *  - Others: documents with visibility 'all', plus their own.
 * Non-HR uploads are forced to owner=self + visibility=private. Files stream
 * through this controller (which authorises first) — raw paths are never public. */
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Employee = require('../models/Employee');
const { UPLOAD_DIR } = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const SEES_ALL = ['HR', 'ADMIN', 'SUPER_ADMIN'];
async function myEmployee(user) { return Employee.findOne({ $or: [{ user: user._id }, { employeeId: user.employeeId }] }); }

exports.list = catchAsync(async (req, res) => {
  let filter = {};
  if (!SEES_ALL.includes(req.user.role)) {
    const me = await myEmployee(req.user);
    const or = [{ visibility: 'all' }];
    if (me) or.push({ owner: me._id });
    filter = { $or: or };
  }
  if (req.query.category) filter.category = req.query.category;
  const docs = await Document.find(filter).populate('owner', 'employeeId fullName').sort({ createdAt: -1 }).limit(500);
  res.json({ count: docs.length, documents: docs });
});

/* POST /api/documents  (multipart/form-data, field "file") */
exports.upload = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded (send it in the "file" field).');
  let owner = req.body.owner || undefined;
  let visibility = req.body.visibility || 'private';
  if (!SEES_ALL.includes(req.user.role)) {           // non-HR may only upload their own private docs
    const me = await myEmployee(req.user);
    owner = me ? me._id : undefined;
    visibility = 'private';
  }
  const doc = await Document.create({
    title: req.body.title || req.file.originalname,
    category: req.body.category || 'Other',
    owner, visibility,
    storageKey: req.file.filename, originalName: req.file.originalname,
    mimeType: req.file.mimetype, size: req.file.size, uploadedBy: req.user._id
  });
  res.status(201).json({ document: doc });
});

/* GET /api/documents/:id/download */
exports.download = catchAsync(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Document not found.');
  if (!SEES_ALL.includes(req.user.role)) {
    const me = await myEmployee(req.user);
    const owns = me && doc.owner && String(doc.owner) === String(me._id);
    if (!(doc.visibility === 'all' || owns)) throw ApiError.forbidden('You do not have access to this document.');
  }
  const filePath = path.join(UPLOAD_DIR, path.basename(doc.storageKey)); // basename blocks path traversal
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File is missing on the server.');
  res.download(filePath, doc.originalName);
});

/* DELETE /api/documents/:id  (documents:delete) */
exports.remove = catchAsync(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Document not found.');
  try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(doc.storageKey))); } catch (e) { /* file may already be gone */ }
  await doc.deleteOne();
  res.json({ ok: true });
});
