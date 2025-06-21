import { ReactNode, MouseEvent, CSSProperties, MouseEventHandler } from "react";

type ScrollProps = {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export const Scroll = ({
  href,
  children,
  className = "",
  style,
  onClick,
}: ScrollProps) => {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const elementoAlvo = document.getElementById(href.substring(1));
      if (elementoAlvo) {
        elementoAlvo.classList.add("highlight");
        setTimeout(() => {
          elementoAlvo.classList.remove("highlight");
        }, 2000);
        setTimeout(() => {
          elementoAlvo.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }

    // tive que adicionar isso pra chamar o onClick
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={href}
      className={`link-rolagem ${className}`}
      onClick={handleClick}
      style={style}
    >
      {children}
    </a>
  );
};