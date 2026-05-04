export default function FormContainer({ className = "", children, ...props }) {
  const classes = ["form-stack", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
