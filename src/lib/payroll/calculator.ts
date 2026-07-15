export interface PayrollInput {
  sueldo_base: number;
  gratificacion_tipo: string;    // 'proporcional' | 'garantizada' | 'ninguna'
  afp_tasa: number | null;       // e.g. 0.1087
  salud_tipo: string | null;     // 'fonasa' | 'isapre'
  plan_salud_uf: number | null;  // for isapre: monthly plan in UF
  overtime_aprobado: { horas: number; tipo: '50%' | '100%' | 'otro'; monto: number | null }[];
  bonos: number;
  colacion: number;
  movilizacion: number;
  otros_haberes: number;
  otros_descuentos: number;
  uf_value: number;
}

export interface PayrollResult {
  sueldo_base: number;
  gratificacion: number;
  monto_horas_extra: number;
  horas_extra: number;
  bonos: number;
  colacion: number;
  movilizacion: number;
  otros_haberes: number;
  total_haberes: number;
  desc_afp: number;
  desc_salud: number;
  desc_cesantia: number;
  impuesto_unico: number;
  otros_descuentos: number;
  total_descuentos: number;
  sueldo_liquido: number;
}

const UF_VALUE_FALLBACK = 38500;
const TASA_CESANTIA = 0.006;

export function calcularPayroll(input: PayrollInput): PayrollResult {
  const uf = input.uf_value || UF_VALUE_FALLBACK;

  // 1. Gratificación
  let gratificacion = 0;
  if (input.gratificacion_tipo === 'proporcional') {
    gratificacion = Math.round(input.sueldo_base * 0.25);
  } else if (input.gratificacion_tipo === 'garantizada') {
    // Gratificación garantizada = 25% del sueldo base mensual
    gratificacion = Math.round(input.sueldo_base * 0.25);
  }

  // 2. Horas extra
  let monto_horas_extra = 0;
  let horas_extra = 0;
  for (const ot of input.overtime_aprobado) {
    horas_extra += ot.horas;
    if (ot.monto) {
      monto_horas_extra += ot.monto;
    } else {
      // Calculate from hourly rate: sueldo_base / (45 hrs/week * 4.33 weeks) = monthly hour value
      const valorHora = input.sueldo_base / (45 * 4.33);
      const recargo = ot.tipo === '100%' ? 2.0 : 1.5; // 50% recargo or 100% recargo
      monto_horas_extra += Math.round(ot.horas * valorHora * recargo);
    }
  }
  monto_horas_extra = Math.round(monto_horas_extra);

  // 3. Total haberes
  const total_haberes = input.sueldo_base + gratificacion + monto_horas_extra +
    input.bonos + input.colacion + input.movilizacion + input.otros_haberes;

  // 4. Base imponible (for deductions — excludes colacion and movilizacion which are non-taxable)
  const base_imponible = input.sueldo_base + gratificacion + monto_horas_extra + input.bonos;

  // 5. AFP
  const afp_tasa = input.afp_tasa ?? 0.1087;
  const desc_afp = Math.round(base_imponible * afp_tasa);

  // 6. Salud
  let desc_salud = 0;
  if (input.salud_tipo === 'fonasa' || !input.salud_tipo) {
    desc_salud = Math.round(base_imponible * 0.07);
  } else if (input.salud_tipo === 'isapre' && input.plan_salud_uf) {
    desc_salud = Math.round(input.plan_salud_uf * uf);
  }

  // 7. Cesantía
  const desc_cesantia = Math.round(base_imponible * TASA_CESANTIA);

  // 8. Impuesto único al trabajo (simplified — for typical salaries of CPC workers, usually 0)
  // Casa particular workers with sueldo_base < ~3M CLP rarely pay impuesto único
  const impuesto_unico = 0;

  // 9. Total descuentos
  const total_descuentos = desc_afp + desc_salud + desc_cesantia + impuesto_unico + input.otros_descuentos;

  // 10. Líquido
  const sueldo_liquido = total_haberes - total_descuentos;

  return {
    sueldo_base: input.sueldo_base,
    gratificacion,
    monto_horas_extra,
    horas_extra: Math.round(horas_extra * 10) / 10,
    bonos: input.bonos,
    colacion: input.colacion,
    movilizacion: input.movilizacion,
    otros_haberes: input.otros_haberes,
    total_haberes,
    desc_afp,
    desc_salud,
    desc_cesantia,
    impuesto_unico,
    otros_descuentos: input.otros_descuentos,
    total_descuentos,
    sueldo_liquido,
  };
}
