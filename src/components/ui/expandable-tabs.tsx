"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  href?: string;
  badge?: number;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
  badge?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary",
  onChange,
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  const TabButton = ({ tab, index }: { tab: Tab, index: number }) => {
    const Icon = tab.icon;
    const isSelected = selected === index;
    
    const content = (
      <>
        <div className="relative">
          <Icon size={20} />
          {tab.badge && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {tab.badge > 9 ? '9+' : tab.badge}
            </span>
          )}
        </div>
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.span
              variants={spanVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="overflow-hidden"
            >
              {tab.title}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    );
    
    const buttonClasses = cn(
      "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
      isSelected
        ? cn("bg-muted", activeColor)
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );
    
    if (tab.href) {
      return (
        <Link href={tab.href}>
          <motion.div
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={buttonClasses}
          >
            {content}
          </motion.div>
        </Link>
      );
    }
    
    return (
      <motion.button
        variants={buttonVariants}
        initial={false}
        animate="animate"
        custom={isSelected}
        onClick={() => handleSelect(index)}
        transition={transition}
        className={buttonClasses}
      >
        {content}
      </motion.button>
    );
  };

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        return <TabButton key={tab.title} tab={tab} index={index} />;
      })}
    </div>
  );
} 