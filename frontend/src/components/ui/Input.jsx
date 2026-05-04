import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { multiline = false, className = "", rows = 4, ...props },
  ref,
) {
  const classes = [multiline ? "field-textarea" : "field-input", className]
    .filter(Boolean)
    .join(" ");

  if (multiline) {
    return <textarea ref={ref} rows={rows} className={classes} {...props} />;
  }

  return <input ref={ref} className={classes} {...props} />;
});

export default Input;
