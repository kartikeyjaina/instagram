export const notFoundHandler = (_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, error: message });
};
