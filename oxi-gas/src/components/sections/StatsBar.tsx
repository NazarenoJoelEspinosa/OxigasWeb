import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Award, Users, HeartHandshake, type LucideIcon } from 'lucide-react';

type Stat = {
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const stats: Stat[] = [
  { icon: Award, value: 60, prefix: '+', label: 'Años de experiencia' },
  { icon: Users, value: 500, suffix: '+', label: 'Clientes activos' },
  { icon: HeartHandshake, value: 100, suffix: '%', label: 'Atención personalizada' },
];

type CounterProps = {
  to: number;
  prefix?: string;
  suffix?: string;
  start: boolean;
};

function AnimatedCounter({ to, prefix = '', suffix = '', start }: CounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [start, to]);

  return (
    <span className="text-4xl md:text-5xl font-display font-bold text-[hsl(var(--text-main))] tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section className="bg-[hsl(var(--surface-0))] border-y border-[hsl(var(--surface-3))]/40 py-10">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-[hsl(var(--surface-3))]/40">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className="flex items-center justify-center gap-4 sm:gap-5 px-4 sm:px-6"
              >
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" aria-hidden="true" />
                </div>
                <div className="flex flex-col leading-tight">
                  <AnimatedCounter
                    to={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    start={inView}
                  />
                  <span className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[hsl(var(--text-soft))] font-semibold mt-1">
                    {stat.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
