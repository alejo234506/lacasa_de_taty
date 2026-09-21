import mongoose, { Schema, models } from "mongoose";

export interface IDiaMinuta {
  dia: string;
  desayuno: string;
  almuerzo: string;
  cena: string;
}

export interface IMinuta {
  _id: mongoose.Types.ObjectId;
  mes: string;
  semana: number;
  dias: IDiaMinuta[];
}

const MinutaSchema = new Schema<IMinuta>(
  {
    mes: { type: String, required: true },
    semana: { type: Number, required: true, min: 1, max: 4 },
    dias: [
      {
        dia: String,
        desayuno: String,
        almuerzo: String,
        cena: String,
      },
    ],
  },
  { timestamps: true }
);

MinutaSchema.index({ mes: 1, semana: 1 }, { unique: true });

export const Minuta = models.Minuta || mongoose.model<IMinuta>("Minuta", MinutaSchema);
