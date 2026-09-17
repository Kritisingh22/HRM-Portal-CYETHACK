/* Payroll API. Employees/managers may read only THEIR OWN payslips; HR/Admin
 * read all and are the only ones who may create/update. */
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../utils/audit');

const SEES_ALL = ['HR', 'ADMIN', 'SUPER_ADMIN'];
async function myEmployee(user) { return Employee.findOne({ $or: [{ user: user._id }, { employeeId: user.employeeId }] }); }

/* GET /api/payroll */
exports.list = catchAsync(async (req, res) => {
  let filter = {};
  if (SEES_ALL.includes(req.user.role)) {
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.period) filter.period = req.query.period;
  } else {
    const me = await myEmployee(req.user);
    filter.employee = me ? me._id : null; // own payslips only
  }
  const payslips = await Payroll.find(filter).populate('employee', 'employeeId fullName').sort({ period: -1 }).limit(500);
  res.json({ count: payslips.length, payroll: payslips });
});

/* GET /api/payroll/:id — object-level: employees can only open their own */
exports.getOne = catchAsync(async (req, res) => {
  const slip = await Payroll.findById(req.params.id).populate('employee', 'employeeId fullName user');
  if (!slip) throw ApiError.notFound('Payslip not found.');
  if (!SEES_ALL.includes(req.user.role)) {
    const me = await myEmployee(req.user);
    const owns = me && String(slip.employee._id) === String(me._id);
    if (!owns) throw ApiError.forbidden('You do not have permission to view this payslip.');
  }
  res.json({ payslip: slip });
});

/* POST /api/payroll (payroll:write) */
exports.create = catchAsync(async (req, res) => {
  const { employee, period, gross } = req.body;
  if (!employee || !period) throw ApiError.badRequest('employee and period are required.');
  const slip = await Payroll.create({
    employee, period, gross: gross || 0,
    deductions: req.body.deductions || {}, status: req.body.status || 'Draft'
  });
  logAudit(req, { action: 'payroll.create', targetType: 'Payroll', targetId: slip._id, description: `Created payslip ${period} (net ${slip.net}) for employee ${employee}` });
  res.status(201).json({ payslip: slip });
});

/* PUT /api/payroll/:id (payroll:write) */
exports.update = catchAsync(async (req, res) => {
  const slip = await Payroll.findById(req.params.id);
  if (!slip) throw ApiError.notFound('Payslip not found.');
  ['gross', 'status', 'payDate'].forEach((k) => { if (req.body[k] !== undefined) slip[k] = req.body[k]; });
  if (req.body.deductions !== undefined) {
    // deep-merge so a partial update can't wipe unrelated deduction components (pf/tds/esi/other)
    const current = slip.deductions && slip.deductions.toObject ? slip.deductions.toObject() : (slip.deductions || {});
    slip.deductions = { ...current, ...req.body.deductions };
  }
  await slip.save(); // pre-save recomputes net; min:0 validators reject a negative net
  res.json({ payslip: slip });
});
