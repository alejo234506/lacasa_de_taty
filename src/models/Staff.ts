import mongoose, { Schema, models } from "mongoose";

export interface IStaff {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: "admin" | "recepcion";
}

const StaffSchema = new Schema<IStaff>(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ["admin", "recepcion"], default: "recepcion" },
  },
  { timestamps: true }
);

export const Staff = models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
