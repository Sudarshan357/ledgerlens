"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const FLOW_STEPS = ["Order", "Payment", "Refund", "Adjustment", "Settlement"];
const PROBLEM_INDEX = 3; // Adjustment — the injected incident type

type Stage = "line" | "flow" | "reveal" | "done";

export function SplashIntro() {
  const [stage, setStage] = useState<Stage>("line");
  const [showTagline, setShowTagline] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage("flow"), 350));
    timers.push(setTimeout(() => setStage("reveal"), 1250));
    timers.push(setTimeout(() => setShowTagline(true), 1750));
    timers.push(setTimeout(() => setShowCta(true), 2250));
    timers.push(setTimeout(() => setStage("done"), 3500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {stage !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08080a]"
        >
          {/* thin red line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: stage === "line" ? 1 : 0, opacity: stage === "line" ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute h-px w-40 origin-center bg-[#f0475c]"
          />

          {/* financial network -> flow chain */}
          <AnimatePresence>
            {stage === "flow" && (
              <motion.div key="flow" exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-2.5">
                {FLOW_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2.5">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.11, duration: 0.28 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: i === PROBLEM_INDEX ? "#f0475c" : "#4a4a52" }}
                      />
                      <span className="text-[10px] font-medium tracking-wide text-[#7a7a84]">{step}</span>
                    </motion.div>
                    {i < FLOW_STEPS.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.11 + 0.08, duration: 0.28 }}
                        className="h-px w-8 origin-left bg-[#2c2c33]"
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* wordmark + tagline + CTA */}
          <AnimatePresence>
            {stage === "reveal" && (
              <motion.div
                key="word"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-[26px] font-semibold tracking-tight text-white">
                  LEDGER<span className="text-[#f0475c]">LENS</span>
                </div>
                <div className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7a7a84]">
                  Financial Incident Investigation
                </div>

                <AnimatePresence>
                  {showTagline && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="mt-7 max-w-xs text-center text-sm text-[#b0b0b8]"
                    >
                      &ldquo;When money doesn&apos;t add up, investigate why.&rdquo;
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showCta && (
                    <motion.button
                      onClick={() => setStage("done")}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#f0475c] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#ff6478]"
                    >
                      Entering Investigation Console
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
