/* Leave API. Employees create/see their own requests; managers see & decide
 * their team's; HR/Admin see & manage everything. Approvals are role-gated
 * (leaves:approve) AND object-level scoped for managers. */
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../utils/audit');

const SEES_ALL = ['HR', 'ADMIN', 'SUPER_ADMIN'];

async function myEmployee(user) {
  return Employee.findOne({ $or: [{ user: user._id }, { employeeId: user.employeeId }] });
}
async function teamEmployeeIds(user) {
  const team = await Employee.find({ manager: user.employeeId }).select('_id');
  return team.map((e) => e._id);
}

/* GET /api/leaves */
exports.list = catchAsync(async (req, res) => {
  let filter = {};
  if (SEES_ALL.includes(req.user.role)) {
    filter = {};
  } else if (req.user.role === 'MANAGER') {
    const ids = await teamEmployeeIds(req.user);
    const me = await myEmployee(req.user);
    if (me) ids.push(me._id);
    filter = { employee: { $in: ids } };
  } else {
    const me = await myEmployee(req.user);
    filter = { employee: me ? me._id : null };
  }
  if (req.query.status) filter.status = req.query.status;
  const leaves = await Leave.find(filter).populate('employee', 'employeeId fullName department').sort({ appliedOn: -1 }).limit(500);
  res.json({ count: leaves.length, leaves });
});

/* POST /api/leaves — employee applies (for themselves; HR/Admin may specify an employee) */
exports.create = catchAsync(async (req, res) => {
  let employeeId = req.body.employee;
  if (!SEES_ALL.includes(req.user.role)) {
    const me = await myEmployee(req.user);
    if (!me) throw ApiError.badRequest('No employee record linked to your account.');
    employeeId = me._id; // employees can only file for themselves
  }
  if (!employeeId) throw ApiError.badRequest('employee is required.');

  // Server computes the duration — a client-supplied `days` is never trusted.
  const from = new Date(req.body.from);
  const to = new Date(req.body.to);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) throw ApiError.badRequest('Valid from and to dates are required.');
  if (from > to) throw ApiError.badRequest('Leave "from" date must be on or before the "to" date.');
  const halfDay = !!req.body.halfDay;
  const days = halfDay ? 0.5 : Math.floor((to - from) / 86400000) + 1; // inclusive day count

  const leave = await Leave.create({
    employee: employeeId,
    requestedBy: req.user._id,
    type: req.body.type,
    from,
    to,
    days,          // server-calculated; any client-provided value is ignored
    halfDay,
    reason: req.body.reason,
    status: 'Pending'
  });
  res.status(201).json({ leave });
});

/* PUT /api/leaves/:id — approve / reject (managers: team only) or cancel own */
exports.update = catchAsync(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'employeeId manager');
  if (!leave) throw ApiError.notFound('Leave request not found.');
  const action = req.body.status; // Approved | Rejected | Cancelled

  if (action === 'Cancelled') {
    // an employee may cancel their OWN pending request
    const me = await myEmployee(req.user);
    const isOwner = me && String(leave.employee._id) === String(me._id);
    if (!isOwner && !SEES_ALL.includes(req.user.role)) throw ApiError.forbidden('You can only cancel your own request.');
  } else if (action === 'Approved' || action === 'Rejected') {
    // needs approve permission; managers limited to their team
    const canApprove = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role) ||
      (req.user.role === 'MANAGER' && leave.employee.manager === req.user.employeeId);
    if (!canApprove) throw ApiError.forbidden('You do not have permission to decide this leave request.');
    leave.decidedBy = req.user._id;
  } else {
    throw ApiError.badRequest('status must be Approved, Rejected or Cancelled.');
  }
  leave.status = action;
  if (req.body.managerNote !== undefined) leave.managerNote = req.body.managerNote;
  await leave.save();
  if (action === 'Approved' || action === 'Rejected') {
    const who = (leave.employee && leave.employee.employeeId) || leave.employee;
    logAudit(req, { action: 'leave.' + action.toLowerCase(), targetType: 'Leave', targetId: leave._id, description: `${action} leave for ${who}` });
  }
  res.json({ leave });
});

/* DELETE /api/leaves/:id — HR/Admin only (route-guarded) */
exports.remove = catchAsync(async (req, res) => {
  const leave = await Leave.findByIdAndDelete(req.params.id);
  if (!leave) throw ApiError.notFound('Leave request not found.');
  res.json({ ok: true });
});
