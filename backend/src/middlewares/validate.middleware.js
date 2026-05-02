const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const error = result.error.errors[0]?.message || "Validation failed";
    return res.status(400).json({ success: false, error });
  }
  req.body = result.data;
  next();
};

export default validate;
