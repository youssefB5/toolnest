import { useState } from 'react';
import { Checkbox, ErrorBox, Notice, NumberInput, Segmented, Select, Stat } from '../../components/tools/kit';
import {
  age,
  applyDiscounts,
  aspectRatio,
  dateDifference,
  parseDate,
  percentChange,
  percentOf,
  round2,
  solveRatio,
  vat,
  whatPercent,
  type Discount,
} from './logic';

const n = (v: number | '') => (v === '' ? null : Number(v));
const fmt = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 4 });
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Result({ children, formula }: { children: React.ReactNode; formula?: string }) {
  return (
    <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-700/15" aria-live="polite">
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{children}</div>
      {formula && <div className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">{formula}</div>}
    </div>
  );
}

/* ---------------------------- Percentage ---------------------------- */
export function PercentageCalculator() {
  const [a1, setA1] = useState<number | ''>(15);
  const [b1, setB1] = useState<number | ''>(200);
  const [a2, setA2] = useState<number | ''>(30);
  const [b2, setB2] = useState<number | ''>(120);
  const [a3, setA3] = useState<number | ''>(80);
  const [b3, setB3] = useState<number | ''>(100);
  const r2 = n(a2) !== null && n(b2) !== null ? whatPercent(n(a2)!, n(b2)!) : null;
  const r3 = n(a3) !== null && n(b3) !== null ? percentChange(n(a3)!, n(b3)!) : null;
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-semibold">What is X% of Y?</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="Percentage (X)" value={a1} onChange={setA1} suffix="%" />
          <NumberInput label="Number (Y)" value={b1} onChange={setB1} />
        </div>
        {n(a1) !== null && n(b1) !== null && <Result formula={`${a1} ÷ 100 × ${b1}`}>{fmt(percentOf(n(a1)!, n(b1)!))}</Result>}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">X is what percent of Y?</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="Value (X)" value={a2} onChange={setA2} />
          <NumberInput label="Total (Y)" value={b2} onChange={setB2} />
        </div>
        {n(a2) !== null && n(b2) !== null && (r2 === null ? <ErrorBox error="The total cannot be zero." /> : <Result formula={`${a2} ÷ ${b2} × 100`}>{fmt(r2)}%</Result>)}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Percentage change from X to Y</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="From (X)" value={a3} onChange={setA3} />
          <NumberInput label="To (Y)" value={b3} onChange={setB3} />
        </div>
        {n(a3) !== null &&
          n(b3) !== null &&
          (r3 === null ? (
            <ErrorBox error="Percentage change from 0 is undefined." />
          ) : (
            <Result formula={`(${b3} − ${a3}) ÷ |${a3}| × 100`}>
              {r3 >= 0 ? '+' : ''}
              {fmt(r3)}% {r3 >= 0 ? 'increase' : 'decrease'}
            </Result>
          ))}
      </section>
    </div>
  );
}

/* ----------------------------- Discount ----------------------------- */
export function DiscountCalculator() {
  const [price, setPrice] = useState<number | ''>(80);
  const [d1, setD1] = useState<number | ''>(30);
  const [t1, setT1] = useState<Discount['type']>('percent');
  const [d2, setD2] = useState<number | ''>('');
  const [t2, setT2] = useState<Discount['type']>('percent');
  const p = n(price);
  const res = p !== null && p >= 0 ? applyDiscounts(p, [{ type: t1, value: Number(d1) || 0 }, { type: t2, value: Number(d2) || 0 }]) : null;
  return (
    <>
      <NumberInput label="Original price" value={price} onChange={setPrice} min={0} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <NumberInput label="Discount" value={d1} onChange={setD1} min={0} />
          <Segmented label="Discount type" value={t1} onChange={setT1} options={[{ value: 'percent', label: '%' }, { value: 'amount', label: 'Amount' }]} />
        </div>
        <div className="space-y-2">
          <NumberInput label="Additional discount (optional)" value={d2} onChange={setD2} min={0} />
          <Segmented label="Additional discount type" value={t2} onChange={setT2} options={[{ value: 'percent', label: '%' }, { value: 'amount', label: 'Amount' }]} />
        </div>
      </div>
      {res && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Final price" value={fmt(res.final)} />
          <Stat label="You save" value={fmt(res.saved)} />
          <Stat label="Effective discount" value={`${res.effectivePercent}%`} />
        </div>
      )}
    </>
  );
}

/* -------------------------------- VAT ------------------------------- */
export function VatCalculator() {
  const [amount, setAmount] = useState<number | ''>(100);
  const [rate, setRate] = useState<number | ''>(20);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const res = n(amount) !== null && n(rate) !== null && Number(rate) >= 0 ? vat(Number(amount), Number(rate), mode) : null;
  return (
    <>
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'add', label: 'Add VAT (net → gross)' }, { value: 'remove', label: 'Remove VAT (gross → net)' }]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput label={mode === 'add' ? 'Net amount (excl. VAT)' : 'Gross amount (incl. VAT)'} value={amount} onChange={setAmount} min={0} />
        <NumberInput label="VAT rate" value={rate} onChange={setRate} min={0} max={100} suffix="%" />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common rates">
        {[5, 7, 10, 14, 15, 19, 20, 21].map((r) => (
          <button key={r} type="button" className="btn-secondary btn-sm" onClick={() => setRate(r)} aria-pressed={rate === r}>
            {r}%
          </button>
        ))}
      </div>
      {res && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Net" value={fmt(res.net)} />
          <Stat label="VAT" value={fmt(res.tax)} />
          <Stat label="Gross" value={fmt(res.gross)} />
        </div>
      )}
      <Notice>Rates shown are examples only. Check the applicable rate for your country and product.</Notice>
    </>
  );
}

/* -------------------------------- Age ------------------------------- */
export function AgeCalculator() {
  const [birth, setBirth] = useState('');
  const [on, setOn] = useState(today());
  const b = parseDate(birth);
  const o = parseDate(on);
  const res = b && o ? age(b, o) : null;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="age-b">
            Date of birth
          </label>
          <input id="age-b" type="date" className="input" value={birth} onChange={(e) => setBirth(e.target.value)} max={on} />
        </div>
        <div>
          <label className="label" htmlFor="age-o">
            Age on
          </label>
          <input id="age-o" type="date" className="input" value={on} onChange={(e) => setOn(e.target.value)} />
        </div>
      </div>
      {b && o && !res && <ErrorBox error="The birth date is after the reference date." />}
      {res && (
        <>
          <Result>
            {res.years} years, {res.months} months, {res.days} days
          </Result>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total months" value={res.totalMonths.toLocaleString()} />
            <Stat label="Total weeks" value={res.totalWeeks.toLocaleString()} />
            <Stat label="Total days" value={res.totalDays.toLocaleString()} />
            <Stat label="Next birthday" value={res.isBirthdayToday ? 'Today! 🎉' : `in ${res.nextBirthdayInDays} days`} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Born on a {res.weekdayBorn}.</p>
        </>
      )}
    </>
  );
}

/* ---------------------------- Date difference ----------------------- */
export function DateDifferenceCalculator() {
  const [a, setA] = useState(today());
  const [b, setB] = useState('');
  const [inc, setInc] = useState(false);
  const da = parseDate(a);
  const db = parseDate(b);
  const res = da && db ? dateDifference(da, db, inc) : null;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="dd-a">
            Start date
          </label>
          <input id="dd-a" type="date" className="input" value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="dd-b">
            End date
          </label>
          <input id="dd-b" type="date" className="input" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </div>
      <Checkbox label="Include the end date (add 1 day)" checked={inc} onChange={setInc} />
      {res && (
        <>
          {res.reversed && <Notice tone="warn">The end date is before the start date; the dates were swapped.</Notice>}
          <Result>
            {res.years} years, {res.months} months, {res.days} days
          </Result>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total days" value={res.totalDays.toLocaleString()} />
            <Stat label="Weeks + days" value={`${res.weeks} w ${res.remDays} d`} />
            <Stat label="Business days (Mon–Fri)" value={res.businessDays.toLocaleString()} />
            <Stat label="Hours" value={res.hours.toLocaleString()} />
          </div>
        </>
      )}
    </>
  );
}

/* ----------------------------- Aspect ratio ------------------------- */
export function AspectRatioCalculator() {
  const [w, setW] = useState<number | ''>(1920);
  const [h, setH] = useState<number | ''>(1080);
  const [rx, setRx] = useState<number | ''>(16);
  const [ry, setRy] = useState<number | ''>(9);
  const [target, setTarget] = useState<'width' | 'height'>('width');
  const [tv, setTv] = useState<number | ''>(1280);
  const ar = w && h ? aspectRatio(Number(w), Number(h)) : null;
  const solved = rx && ry && tv ? solveRatio(Number(rx), Number(ry), target === 'width' ? Number(tv) : null, target === 'height' ? Number(tv) : null) : null;
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-semibold">Find the ratio of a size</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="Width" value={w} onChange={setW} min={1} suffix="px" />
          <NumberInput label="Height" value={h} onChange={setH} min={1} suffix="px" />
        </div>
        {ar && (
          <Result formula={`${w} ÷ ${h} = ${ar.decimal} · closest common ratio ${ar.closest}`}>
            {ar.x}:{ar.y}
          </Result>
        )}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Compute a missing dimension</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberInput label="Ratio X" value={rx} onChange={setRx} min={0} />
          <NumberInput label="Ratio Y" value={ry} onChange={setRy} min={0} />
          <Select label="I know the" value={target} onChange={setTarget} options={[{ value: 'width', label: 'Width' }, { value: 'height', label: 'Height' }]} />
          <NumberInput label={target === 'width' ? 'Width' : 'Height'} value={tv} onChange={setTv} min={0} suffix="px" />
        </div>
        {solved && (
          <Result>
            {round2(solved.width)} × {round2(solved.height)}
          </Result>
        )}
        {rx && ry ? (
          <div className="mx-auto max-w-xs">
            <div className="w-full rounded-lg border-2 border-dashed border-brand-500 bg-brand-50 dark:bg-brand-700/15" style={{ aspectRatio: `${rx} / ${ry}` }} aria-hidden="true" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
