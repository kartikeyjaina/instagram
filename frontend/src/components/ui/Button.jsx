import { forwardRef } from "react";

const Button = forwardRef(function Button(
  { variant = "primary", block = false, className = "", children, as: Component = "button", ...props },
  ref,
) {
  const classes = [
    "button",
    variant === "primary"
      ? "button-primary"
      : variant === "secondary"
        ? "button-secondary"
        : "button-ghost",
    block ? "button-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component ref={ref} className={classes} {...props}>
      {children}
    </Component>
  );
});

export default Button;
