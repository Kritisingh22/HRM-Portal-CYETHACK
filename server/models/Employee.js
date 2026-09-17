/* Employee — HR record for a person. Linked to a User (the login identity)
 * where one exists. Field shape mirrors the existing portal's employee data. */
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, index: true }, // e.g. CHS-0001
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true }, // unique when present; sparse allows records without email
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    manager: { type: String, trim: true }, // employeeId of the manager (mirrors portal data)
    employmentType: { type: String, default: 'Full-time' },
    location: { type: String },
    address: { type: String, trim: true },              // self-service editable
    emergencyContact: { type: String, trim: true },     // self-service editable
    joiningDate: { type: Date },
    salary: { type: Number, default: 0 },
    grade: { type: String },
    status: { type: String, enum: ['Active', 'On Leave', 'Probation', 'Exited'], default: 'Active', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
