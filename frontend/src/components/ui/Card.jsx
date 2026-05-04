export default function Card({ className = "", children, ...props }) {
  const classes = ["surface-card", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
