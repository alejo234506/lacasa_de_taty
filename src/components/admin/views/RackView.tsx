
import { useEffect, useState } from "react";
import { BedDouble, Link2, Plus, Unlink, Users, X } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Buscador, Chips } from "../ui/Filtros";
import { formatMoney } from "@/lib/money";
import { apiSend } from "@/lib/api-client";
import { EST } from "@/lib/data";
import { METODOS_PAGO, PERIODOS, type Pago, type PeriodoTarifa, type RoomView } from "@/lib/panel-types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { Badge, Empty, Field, Modal, ModalForm, MoneyInput, Skeleton, fecha, inputClass } from "../ui/Modal";

const TIPOS = ["Individual", "Doble", "Triple", "Compartida", "Suite"];

type ModalKind = null | "nueva" | "editar" | "checkin" | "checkout" | "consumo" | "unir";

export function RackView() {
  const rooms = useAdminStore((s) => s.rooms);
  const sel = useAdminStore((s) => s.sel);
  const setSel = useAdminStore((s) => s.setSel);
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const setRecibo = useAdminStore((s) => s.setRecibo);
  const m = (n: number) => formatMoney(n, moneda);

  const [modal, setModal] = useState<ModalKind>(null);
  const [unirMode, setUnirMode] = useState(false);
  const [unirSel, setUnirSel] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtro, setFiltro] = useState<"TODAS" | "DISPONIBLES" | "PENS" | "HOTEL" | "ARREGLO">("TODAS");
  const [qHab, setQHab] = useState("");
  const intent = useAdminStore((s) => s.intent);
  const tomarIntent = useAdminStore((s) => s.tomarIntent);

  useEffect(() => {
    const i = tomarIntent(["checkin", "ver-huespedes", "nueva-habitacion", "ver-arreglo"]);
    if (i === "checkin") {
      setFiltro("DISPONIBLES");
      flash("Toca una habitación libre para registrar al huésped", "info");
    } else if (i === "ver-huespedes") {
      setFiltro("HOTEL");
      flash("Toca la habitación del huésped y luego «Check-out y facturar»", "info");
    } else if (i === "nueva-habitacion") {
      setModal("nueva");
    } else if (i === "ver-arreglo") {
      setFiltro("ARREGLO");
    }
  }, [intent, tomarIntent, flash]);

  const selected = rooms.find((r) => r.id === sel) || rooms[0];

  if (!selected) {
    return (
      <div className="space-y-4">
        {panelLoading ? <Skeleton /> : <Empty icon={BedDouble}>Aún no hay habitaciones. Crea la primera.</Empty>}
        {!panelLoading && <Button onClick={() => setModal("nueva")}><Plus className="w-4 h-4" /> Nueva habitación</Button>}
        <RoomFormModal open={modal === "nueva"} onClose={() => setModal(null)} />
      </div>
    );
  }

  const meta = EST[selected.estado];
  const cuentaRooms = selected.cuentaId ? rooms.filter((r) => r.cuentaId === selected.cuentaId) : [selected];
  const detalle = (
    <>
    <div className="p-5 border-b border-border" style={{ background: meta.bg }}>
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0" style={{ color: meta.color }}>
          <BedDouble className="w-6 h-6" />
        </span>
        <div className="min-w-0">
          <div className="text-xs text-muted">Habitación {selected.tipo.toLowerCase()}</div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold break-words leading-tight">{selected.numero}</h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <Badge tone="accent">{meta.label}</Badge>
        <Badge>{selected.personas}/{selected.capacidad} personas</Badge>
        {selected.pensionAusente && <Badge tone="solid">Pensionado ausente</Badge>}
      </div>
      {selected.cuentaId && (
        <div className="mt-3 text-xs text-accent-dark flex items-center gap-1">
          <Link2 className="w-3.5 h-3.5" /> {selected.cuentaNombre}: {cuentaRooms.map((r) => r.numero).join(" + ")}
        </div>
      )}
    </div>

    <div className="p-5 space-y-4">
      <div className="space-y-2 text-sm">
        {[
          ["Tarifa", `${m(selected.tarifa)} / ${PERIODOS[selected.periodo].unidad}`],
          ...(selected.notas ? [["Notas", selected.notas]] : []),
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-border pb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">{k}</span>
            <span className="font-semibold text-right">{v}</span>
          </div>
        ))}
      </div>

      {selected.residentes.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">Pensionados</div>
          <ul className="space-y-1 text-sm">
            {selected.residentes.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>{p.nombre} {p.ausente && <Badge tone="accent">ausente</Badge>}</span>
                <span className={p.saldo > 0 ? "text-accent font-semibold" : "text-muted"}>{p.saldo > 0 ? m(p.saldo) : "Al día"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected.stay && (
        <div className="rounded-xl border border-border p-3 space-y-1 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Huésped</div>
          <div className="font-bold">{selected.stay.huesped} · {selected.stay.personas} persona(s)</div>
          <div className="text-muted text-xs">
            Desde {fecha(selected.stay.desde)} · hab. {selected.stay.habitaciones.join(" + ")}
          </div>
          <div className="flex justify-between"><span>{cantidad(selected.stay.cantidad, selected.stay.periodo)}</span><span>{m(selected.stay.totalAlojamiento)}</span></div>
          {selected.stay.consumos.map((c, i) => (
            <div key={i} className="flex justify-between text-xs text-muted"><span>{c.concepto}</span><span>{m(c.monto)}</span></div>
          ))}
          <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total a la fecha</span><span>{m(selected.stay.total)}</span></div>
        </div>
      )}

      <AdminBtnGroup className="grid grid-cols-2 w-full [&>button]:w-full [&>button]:justify-center [&>button]:!h-12 [&>button:first-child]:col-span-2">
        {selected.stay ? (
          <>
            <Button data-tour="btn-checkout" onClick={() => setModal("checkout")}>Check-out y facturar</Button>
            <Button variant="secondary" onClick={() => setModal("consumo")}>Cargar consumo</Button>
          </>
        ) : selected.disponibleHotel ? (
          <Button data-tour="btn-checkin" onClick={() => setModal("checkin")}>
            {selected.pensionAusente ? "Alquilar (pensionado ausente)" : "Check-in"}
          </Button>
        ) : null}
        {selected.estado === "SUCIA" && <Button variant="secondary" onClick={() => setEstado("LIBRE")}>Marcar como limpia</Button>}
        {selected.estado === "MANT" ? (
          <Button variant="secondary" onClick={() => setEstado("LIBRE")}>Finalizar mantenimiento</Button>
        ) : (
          !selected.stay && <Button variant="secondary" onClick={() => setEstado("MANT")}>Enviar a mantenimiento</Button>
        )}
        {(selected.estado === "LIBRE" || selected.estado === "PENS") && !selected.stay && (
          <Button variant="secondary" onClick={() => setEstado("SUCIA")}>Marcar sucia</Button>
        )}
        <Button variant="secondary" onClick={() => setModal("editar")}>Editar habitación</Button>
        {selected.cuentaId && !selected.stay && (
          <Button
            variant="secondary"
            onClick={() => call(`/api/rooms/${selected.id}`, { method: "PATCH", body: JSON.stringify({ action: "separar" }) }, "Habitación separada de la cuenta")}
          >
            <Unlink className="w-4 h-4" /> Separar de la cuenta
          </Button>
        )}
        <Button variant="ghost" className="col-span-2" onClick={eliminar}>Eliminar habitación</Button>
      </AdminBtnGroup>
    </div>
    </>
  );

  async function call(url: string, init: RequestInit, ok: string) {
    try {
      const out = await apiSend(url, init);
      flash(ok);
      await refreshAll();
      return out;
    } catch (e) {
      flash((e as Error).message, "error");
      return null;
    }
  }

  const setEstado = (estado: "LIBRE" | "SUCIA" | "MANT") =>
    call(`/api/rooms/${selected.id}`, { method: "PATCH", body: JSON.stringify({ action: "estado", estado }) }, `Hab. ${selected.numero} actualizada`);

  async function eliminar() {
    if (!(await confirmar({ titulo: `¿Eliminar la habitación ${selected.numero}?`, mensaje: "Esta acción no se puede deshacer.", confirmar: "Eliminar", peligro: true }))) return;
    const ok = await call(`/api/rooms/${selected.id}`, { method: "DELETE" }, `Habitación ${selected.numero} eliminada`);
    if (ok) setSel(null);
  }

  const visibles = rooms.filter(
    (r) =>
      (filtro === "TODAS"
        ? true
        : filtro === "DISPONIBLES"
          ? r.disponibleHotel
          : filtro === "ARREGLO"
            ? r.estado === "SUCIA" || r.estado === "MANT"
            : r.estado === filtro) &&
      (!qHab ||
        `${r.numero} ${r.tipo} ${r.stay?.huesped ?? ""} ${r.residentes.map((x) => x.nombre).join(" ")}`.toLowerCase().includes(qHab.toLowerCase()))
  );

  return (
    <div className="flex gap-6 items-start flex-col xl:flex-row">
      <div className="flex-1 min-w-0 w-full space-y-4">
        <div className="flex items-center gap-2">
          <Buscador className="flex-1 min-w-0" value={qHab} onChange={setQHab} placeholder="Buscar habitación o persona" />
          {!unirMode && (
            <button
              onClick={() => setModal("nueva")}
              aria-label="Nueva habitación"
              className="shrink-0 w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center shadow-md shadow-accent/30"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <Chips
          value={filtro}
          onChange={setFiltro}
          opciones={[
            { key: "TODAS", label: "Todas", n: rooms.length },
            { key: "DISPONIBLES", label: "Libres", n: rooms.filter((r) => r.disponibleHotel).length },
            { key: "PENS", label: "Pensión", n: rooms.filter((r) => r.estado === "PENS").length },
            { key: "HOTEL", label: "Huéspedes", n: rooms.filter((r) => r.estado === "HOTEL").length },
            { key: "ARREGLO", label: "Sucias / mant.", n: rooms.filter((r) => r.estado === "SUCIA" || r.estado === "MANT").length },
          ]}
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted">Toca una habitación para ver sus opciones · máx. 4 personas</p>
          {unirMode ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" disabled={unirSel.length < 2} onClick={() => setModal("unir")}>
                <Link2 className="w-4 h-4" /> Unir ({unirSel.length})
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setUnirMode(false); setUnirSel([]); }} aria-label="Cancelar">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button onClick={() => setUnirMode(true)} className="shrink-0 text-xs font-semibold text-accent inline-flex items-center gap-1 min-h-[40px]">
              <Link2 className="w-3.5 h-3.5" /> Unir habitaciones
            </button>
          )}
        </div>

        {unirMode && (
          <div className="p-3 rounded-xl bg-accent-light text-sm text-accent-dark">
            Toca las habitaciones que quieres manejar en una sola cuenta (por ejemplo, una familia que toma dos habitaciones). Se cobran y facturan juntas.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
          {visibles.map((r) => {
            const e = EST[r.estado];
            const isSelected = unirMode ? unirSel.includes(r.id) : r.id === selected.id;
            return (
              <button
                key={r.id}
                data-tour={r.stay ? "room-huesped" : r.disponibleHotel ? "room-libre" : undefined}
                onClick={() =>
                  unirMode
                    ? setUnirSel((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))
                    : (setSel(r.id), setSheetOpen(true))
                }
                className={cn(
                  "card text-left p-3.5 flex flex-col gap-2 transition-all active:scale-[0.98]",
                  isSelected && "ring-2 ring-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: e.bg, color: e.color }}
                  >
                    <BedDouble className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-semibold text-muted inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {r.personas}/{r.capacidad}
                  </span>
                </div>
                <div className="font-bold leading-tight line-clamp-2 break-words min-h-[2.5em]" title={r.numero}>{r.numero}</div>
                <div className="text-xs text-muted truncate -mt-1">
                  {r.stay ? r.stay.huesped : r.residentes.length ? r.residentes.map((x) => x.nombre.split(" ")[0]).join(", ") : r.estado === "MANT" ? r.notas || "Mantenimiento" : r.tipo}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: e.bg, color: e.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.bar }} />
                    {e.label}
                  </span>
                  {r.pensionAusente && <span className="text-[11px] font-bold text-accent">ausente</span>}
                  {r.cuentaId && <Link2 className="w-3.5 h-3.5 text-accent" aria-label="Cuenta unida" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="hidden xl:block w-96 shrink-0 card shadow-lg overflow-hidden sticky top-28">
        {detalle}
      </aside>

      {sheetOpen && !modal && (
        <div className="xl:hidden fixed inset-0 z-[90] flex items-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && setSheetOpen(false)}>
          <div className="w-full max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="sticky top-0 bg-white/95 backdrop-blur flex justify-between items-center px-4 pt-3 pb-1 z-10">
              <span className="mx-auto h-1.5 w-12 rounded-full bg-border" />
              <button className="absolute right-3 top-2 p-2 text-muted" onClick={() => setSheetOpen(false)} aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>
            {detalle}
          </div>
        </div>
      )}

      <RoomFormModal open={modal === "nueva"} onClose={() => setModal(null)} />
      <RoomFormModal open={modal === "editar"} room={selected} onClose={() => setModal(null)} />
      <CheckInModal open={modal === "checkin"} rooms={cuentaRooms} onClose={() => setModal(null)} />
      {selected.stay && (
        <>
          <CheckOutModal
            open={modal === "checkout"}
            room={selected}
            onClose={() => setModal(null)}
            onDone={(pago) => {
              setModal(null);
              setRecibo(pago);
            }}
          />
          <ConsumoModal open={modal === "consumo"} stayId={selected.stay.id} onClose={() => setModal(null)} />
        </>
      )}
      <UnirModal
        open={modal === "unir"}
        rooms={rooms.filter((r) => unirSel.includes(r.id))}
        onClose={() => setModal(null)}
        onDone={() => {
          setModal(null);
          setUnirMode(false);
          setUnirSel([]);
        }}
      />
    </div>
  );
}

function useDone(onClose: () => void) {
  const flash = useAdminStore((s) => s.flash);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  return async (msg: string) => {
    flash(msg);
    onClose();
    await refreshAll();
  };
}

function RoomFormModal({ open, room, onClose }: { open: boolean; room?: RoomView; onClose: () => void }) {
  const done = useDone(onClose);
  const setSel = useAdminStore((s) => s.setSel);
  const [f, setF] = useState({ numero: "", tipo: "Individual", capacidad: 1, periodo: "DIA" as PeriodoTarifa, tarifa: 0, notas: "" });

  useEffect(() => {
    if (!open) return;
    setF(
      room
        ? { numero: room.numero, tipo: room.tipo, capacidad: room.capacidad, periodo: room.periodo, tarifa: room.tarifa, notas: room.notas }
        : { numero: "", tipo: "Individual", capacidad: 1, periodo: "DIA", tarifa: 0, notas: "" }
    );
  }, [open, room]);

  return (
    <Modal open={open} title={room ? `Editar habitación ${room.numero}` : "Nueva habitación"} onClose={onClose}>
      <ModalForm
        submitLabel={room ? "Guardar" : "Crear habitación"}
        onCancel={onClose}
        onSubmit={async () => {
          const out = await apiSend<{ id: string }>(room ? `/api/rooms/${room.id}` : "/api/rooms", {
            method: room ? "PATCH" : "POST",
            body: JSON.stringify(f),
          });
          if (!room) setSel(out.id);
          await done(room ? "Habitación actualizada" : `Habitación ${f.numero} creada`);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Apodo o número">
            <input required className={inputClass} value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} maxLength={30} placeholder="Ej: 117 o La del jardín" />
          </Field>
          <Field label="Tipo">
            <select className={inputClass} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Capacidad (máx. 4)">
            <select className={inputClass} value={f.capacidad} onChange={(e) => setF({ ...f, capacidad: Number(e.target.value) })}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} persona{n > 1 ? "s" : ""}</option>)}
            </select>
          </Field>
          <Field label="Cobro">
            <PeriodoSelect value={f.periodo} onChange={(periodo) => setF({ ...f, periodo })} />
          </Field>
          <Field label={`Tarifa por ${PERIODOS[f.periodo].unidad}`}>
            <MoneyInput required value={f.tarifa || ""} onValueChange={(d) => setF({ ...f, tarifa: Number(d) })} placeholder="Ej: 95.000" />
          </Field>
          <Field label="Notas">
            <input className={inputClass} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </Field>
        </div>
      </ModalForm>
    </Modal>
  );
}

function CheckInModal({ open, rooms, onClose }: { open: boolean; rooms: RoomView[]; onClose: () => void }) {
  const done = useDone(onClose);
  const capacidad = rooms.reduce((a, r) => a + r.capacidad, 0);
  const periodoBase = rooms[0]?.periodo ?? "DIA";
  const tarifaBase = rooms.reduce((a, r) => a + r.tarifa, 0);
  const inicial = { huesped: "", documento: "", telefono: "", personas: 1, periodo: periodoBase, cantidad: 1, tarifa: tarifaBase };
  const [f, setF] = useState(inicial);

  useEffect(() => {
    if (open) setF({ huesped: "", documento: "", telefono: "", personas: 1, periodo: periodoBase, cantidad: 1, tarifa: tarifaBase });
  }, [open, periodoBase, tarifaBase]);
  const per = PERIODOS[f.periodo];

  const ausente = rooms.some((r) => r.pensionAusente);

  return (
    <Modal
      open={open}
      title={`Check-in · hab. ${rooms.map((r) => r.numero).join(" + ")}`}
      subtitle={ausente ? "El pensionado no está: este alquiler suma como ganancia extra de habitaciones." : rooms.length > 1 ? "Habitaciones unidas: una sola cuenta y una sola factura." : undefined}
      onClose={onClose}
    >
      <ModalForm
        submitLabel="Confirmar check-in"
        onCancel={onClose}
        onSubmit={async () => {
          await apiSend(`/api/rooms/${rooms[0].id}`, { method: "PATCH", body: JSON.stringify({ action: "checkin", ...f }) });
          await done(`Check-in de ${f.huesped}`);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre del huésped" className="col-span-2">
            <input required className={inputClass} value={f.huesped} onChange={(e) => setF({ ...f, huesped: e.target.value })} />
          </Field>
          <Field label="Documento">
            <input className={inputClass} value={f.documento} onChange={(e) => setF({ ...f, documento: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input className={inputClass} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </Field>
          <Field label={`Personas (máx. ${capacidad})`}>
            <input type="number" min={1} max={capacidad} required className={inputClass} value={f.personas} onChange={(e) => setF({ ...f, personas: Number(e.target.value) })} />
          </Field>
          <Field label="Cobro">
            <PeriodoSelect value={f.periodo} onChange={(periodo) => setF({ ...f, periodo })} />
          </Field>
          <Field label={`Cantidad de ${per.unidades}`}>
            <input type="number" min={1} required className={inputClass} value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: Number(e.target.value) })} />
          </Field>
          <Field label={`Tarifa por ${per.unidad} (total)`} className="col-span-2">
            <MoneyInput required value={f.tarifa} onValueChange={(d) => setF({ ...f, tarifa: Number(d) })} />
          </Field>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3 text-sm flex justify-between">
          <span className="text-muted">Estimado {cantidad(f.cantidad, f.periodo)}</span>
          <strong>{formatMoney(f.cantidad * f.tarifa)}</strong>
        </div>
      </ModalForm>
    </Modal>
  );
}

function CheckOutModal({ open, room, onClose, onDone }: { open: boolean; room: RoomView; onClose: () => void; onDone: (p: Pago) => void }) {
  const flash = useAdminStore((s) => s.flash);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const stay = room.stay!;
  const [unidades, setUnidades] = useState(stay.cantidad);
  const [metodo, setMetodo] = useState<string>("Efectivo");
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState("");

  useEffect(() => {
    if (open) {
      setUnidades(stay.cantidad);
      setReferencia("");
      setComprobante("");
    }
  }, [open, stay.cantidad]);

  const total = unidades * stay.tarifa + stay.totalConsumos;

  return (
    <Modal open={open} title={`Check-out · ${stay.huesped}`} subtitle={`Hab. ${stay.habitaciones.join(" + ")}`} onClose={onClose}>
      <ModalForm
        submitLabel={`Cobrar ${formatMoney(total)} y facturar`}
        onCancel={onClose}
        onSubmit={async () => {
          const pago = await apiSend<Pago>(`/api/stays/${stay.id}`, {
            method: "PATCH",
            body: JSON.stringify({ action: "checkout", cantidad: unidades, metodo, referencia, comprobante }),
          });
          flash(`Factura ${pago.numero} generada`);
          await refreshAll();
          onDone(pago);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label={`${PERIODOS[stay.periodo].unidades[0].toUpperCase()}${PERIODOS[stay.periodo].unidades.slice(1)} a cobrar`}>
            <input type="number" min={1} className={inputClass} value={unidades} onChange={(e) => setUnidades(Number(e.target.value))} />
          </Field>
          <Field label="Método de pago">
            <select className={inputClass} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS_PAGO.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Referencia" className="col-span-2">
            <input className={inputClass} value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </Field>
          <Field label="Comprobante (texto de la captura)" className="col-span-2">
            <textarea rows={2} className={inputClass} value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
          </Field>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Alojamiento {cantidad(unidades, stay.periodo)} × {formatMoney(stay.tarifa)}</span><span>{formatMoney(unidades * stay.tarifa)}</span></div>
          <div className="flex justify-between"><span>Consumos</span><span>{formatMoney(stay.totalConsumos)}</span></div>
          <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>{formatMoney(total)}</span></div>
        </div>
      </ModalForm>
    </Modal>
  );
}

function ConsumoModal({ open, stayId, onClose }: { open: boolean; stayId: string; onClose: () => void }) {
  const done = useDone(onClose);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  useEffect(() => {
    if (open) { setConcepto(""); setMonto(""); }
  }, [open]);
  return (
    <Modal open={open} title="Cargar consumo a la habitación" onClose={onClose}>
      <ModalForm
        submitLabel="Cargar"
        onCancel={onClose}
        onSubmit={async () => {
          await apiSend(`/api/stays/${stayId}`, { method: "PATCH", body: JSON.stringify({ action: "consumo", concepto, monto: Number(monto) }) });
          await done("Consumo cargado");
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Concepto"><input required className={inputClass} value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Lavandería, bebida..." /></Field>
          <Field label="Monto"><MoneyInput required value={monto} onValueChange={setMonto} /></Field>
        </div>
      </ModalForm>
    </Modal>
  );
}

function UnirModal({ open, rooms, onClose, onDone }: { open: boolean; rooms: RoomView[]; onClose: () => void; onDone: () => void }) {
  const done = useDone(onDone);
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    if (open) setNombre(rooms.find((r) => r.cuentaNombre)?.cuentaNombre || "");
  }, [open, rooms]);
  return (
    <Modal open={open} title="Unir habitaciones en una cuenta" subtitle={`Habitaciones ${rooms.map((r) => r.numero).join(" + ")}`} onClose={onClose}>
      <ModalForm
        submitLabel="Unir"
        onCancel={onClose}
        onSubmit={async () => {
          await apiSend("/api/rooms", { method: "POST", body: JSON.stringify({ action: "unir", ids: rooms.map((r) => r.id), nombre }) });
          await done("Habitaciones unidas en una sola cuenta");
        }}
      >
        <Field label="Nombre de la cuenta (titular)">
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Familia Gómez" />
        </Field>
        <p className="text-sm text-muted">
          El check-in toma todas las habitaciones juntas, con una sola factura. Los pensionados de estas habitaciones pueden pagar como una sola cuenta desde &quot;Pensionados y cobros&quot;.
        </p>
      </ModalForm>
    </Modal>
  );
}

function PeriodoSelect({ value, onChange }: { value: PeriodoTarifa; onChange: (p: PeriodoTarifa) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as PeriodoTarifa)}>
      {(Object.keys(PERIODOS) as PeriodoTarifa[]).map((p) => (
        <option key={p} value={p}>{PERIODOS[p].label}</option>
      ))}
    </select>
  );
}

function cantidad(n: number, p: PeriodoTarifa) {
  return `${n} ${n === 1 ? PERIODOS[p].unidad : PERIODOS[p].unidades}`;
}
