import mongoose, { Schema, models } from "mongoose";

export interface IResident {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  documento: string;
  habitacion: string;
  grupo: "REGULAR_13_20" | "MEDICINA_30_05";
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  accessToken: string;
  activo: boolean;
  estudios: string;
}

const ResidentSchema = new Schema<IResident>(
  {
    nombre: { type: String, required: true },
    documento: { type: String, required: true, unique: true },
    habitacion: { type: String, required: true },
    grupo: { type: String, enum: ["REGULAR_13_20", "MEDICINA_30_05"], required: true },
    comidaIncluida: { type: Boolean, default: true },
    tarifaMensual: { type: Number, required: true },
    saldo: { type: Number, default: 0 },
    accessToken: { type: String, required: true, unique: true, index: true },
    activo: { type: Boolean, default: true },
    estudios: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Resident = models.Resident || mongoose.model<IResident>("Resident", ResidentSchema);

export function residentLink(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/mi-casa/${token}`;
}
